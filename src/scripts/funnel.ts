/**
 * Multi-step funnel forms (progressive disclosure).
 * Without JS every step renders and the form posts normally to its action.
 *
 * Markup contract:
 *   form[data-funnel]            data-endpoint="" → Netlify Forms, otherwise POST to that URL
 *     [data-step]                one per step
 *     [data-show-if="name=val"]  conditional block (val may be a|b list)
 *     [data-next] [data-back]    navigation buttons
 *     [data-progress]            progress bar (uses --progress)
 *     [data-step-count]          "01 / 03" counter
 *   [data-funnel-success]        revealed on success
 *   [data-funnel-error]          revealed on failure
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll<HTMLFormElement>('form[data-funnel]').forEach((form) => {
  const steps = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'));
  const progress = form.closest('[data-funnel-wrap]')?.querySelector<HTMLElement>('[data-progress]');
  const counter = form.closest('[data-funnel-wrap]')?.querySelector<HTMLElement>('[data-step-count]');
  const success = document.querySelector<HTMLElement>('[data-funnel-success]');
  const errorBox = form.querySelector<HTMLElement>('[data-funnel-error]');
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  let current = 0;

  form.classList.add('is-enhanced');

  /* ----- URL prefill: ?program=breaking&service=dj&interest=partnership ----- */
  const params = new URLSearchParams(location.search);
  params.forEach((value, key) => {
    form.querySelectorAll<HTMLInputElement>(`input[name="${key}"]`).forEach((input) => {
      if ((input.type === 'radio' || input.type === 'checkbox') && input.value === value) input.checked = true;
    });
    const select = form.querySelector<HTMLSelectElement>(`select[name="${key}"]`);
    if (select && Array.from(select.options).some((o) => o.value === value)) select.value = value;
  });

  /* ----- Conditional fields ----- */
  const conditionals = Array.from(form.querySelectorAll<HTMLElement>('[data-show-if]'));
  const syncConditionals = () => {
    const data = new FormData(form);
    conditionals.forEach((el) => {
      const [name, raw] = el.dataset.showIf!.split('=');
      const values = raw.split('|');
      const current = data.getAll(name).map(String);
      const show = current.some((v) => values.includes(v));
      el.hidden = !show;
      el.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((f) => {
        f.disabled = !show;
        if (f.dataset.req !== undefined) f.required = show;
      });
    });
  };
  form.addEventListener('change', syncConditionals);
  syncConditionals();

  /* ----- Steps ----- */
  const render = (focus = true) => {
    steps.forEach((s, i) => {
      const on = i === current;
      s.hidden = !on;
      s.classList.toggle('is-current', on);
    });
    const p = (current + 1) / steps.length;
    progress?.style.setProperty('--progress', String(p));
    if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    if (focus) {
      const heading = steps[current].querySelector<HTMLElement>('[data-step-title]');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
      const top = form.closest('[data-funnel-wrap]')!.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  const validateStep = (step: HTMLElement) => {
    const fields = Array.from(step.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'))
      .filter((f) => !f.disabled && f.closest('[hidden]') === null);
    let firstInvalid: HTMLElement | null = null;
    // Required checkbox groups: [data-require-one] on the fieldset.
    step.querySelectorAll<HTMLElement>('[data-require-one]').forEach((group) => {
      if (group.closest('[hidden]')) return;
      const ok = Array.from(group.querySelectorAll<HTMLInputElement>('input')).some((i) => i.checked);
      group.classList.toggle('is-invalid', !ok);
      const msg = group.querySelector<HTMLElement>('.err');
      if (msg) msg.textContent = ok ? '' : 'Pick at least one option.';
      if (!ok && !firstInvalid) firstInvalid = group.querySelector('input');
    });
    fields.forEach((f) => {
      const ok = f.checkValidity();
      const wrap = f.closest('.field');
      if (f.type !== 'radio' && f.type !== 'checkbox') f.setAttribute('aria-invalid', String(!ok));
      const msg = wrap?.querySelector<HTMLElement>('.err');
      if (msg) msg.textContent = ok ? '' : f.validationMessage;
      if (f.type === 'radio') {
        const group = f.closest<HTMLElement>('fieldset');
        const groupMsg = group?.querySelector<HTMLElement>('.err');
        if (groupMsg && !ok) groupMsg.textContent = 'Choose one option.';
        if (groupMsg && ok) groupMsg.textContent = '';
      }
      if (!ok && !firstInvalid) firstInvalid = f;
    });
    (firstInvalid as HTMLElement | null)?.focus();
    return !firstInvalid;
  };

  form.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-next]')) {
      e.preventDefault();
      if (!validateStep(steps[current])) return;
      current = Math.min(steps.length - 1, current + 1);
      render();
    } else if (t.closest('[data-back]')) {
      e.preventDefault();
      current = Math.max(0, current - 1);
      render();
    }
  });

  // Enter in a text field advances instead of submitting early.
  form.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && t.tagName === 'INPUT' && current < steps.length - 1) {
      e.preventDefault();
      steps[current].querySelector<HTMLButtonElement>('[data-next]')?.click();
    }
  });

  // Clear error state as the user corrects a field.
  form.addEventListener('input', (e) => {
    const f = e.target as HTMLInputElement;
    if (f.getAttribute('aria-invalid') === 'true' && f.checkValidity()) {
      f.setAttribute('aria-invalid', 'false');
      const msg = f.closest('.field')?.querySelector<HTMLElement>('.err');
      if (msg) msg.textContent = '';
    }
  });

  /* ----- Submit ----- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(steps[current])) return;
    errorBox && (errorBox.hidden = true);
    submitBtn?.setAttribute('aria-busy', 'true');
    submitBtn && (submitBtn.disabled = true);

    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;
    try {
      const res = endpoint
        ? await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        : await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
          });
      if (!res.ok) throw new Error(String(res.status));

      const name = String(data.get('first_name') || data.get('name') || '').trim().split(' ')[0];
      success?.querySelectorAll<HTMLElement>('[data-first-name]').forEach((n) => { n.textContent = name ? `, ${name}` : ''; });
      (form.closest<HTMLElement>('[data-funnel-hide]') ?? form.closest<HTMLElement>('[data-funnel-wrap]')!).hidden = true;
      if (success) {
        success.hidden = false;
        requestAnimationFrame(() => success.classList.add('is-in'));
        success.querySelector<HTMLElement>('h2')?.focus();
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }
      // Analytics hook: listen for this event to fire conversion pixels.
      window.dispatchEvent(new CustomEvent('bf:lead', { detail: { form: form.getAttribute('name') } }));
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: 'generate_lead', form: form.getAttribute('name') });
    } catch {
      if (errorBox) errorBox.hidden = false;
    } finally {
      submitBtn?.removeAttribute('aria-busy');
      submitBtn && (submitBtn.disabled = false);
    }
  });

  render(false);
});
