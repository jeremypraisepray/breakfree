/**
 * Break Free Worldwide — interaction layer.
 * Progressive enhancement only: every section is fully usable without JS.
 * All motion is disabled under prefers-reduced-motion.
 */
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $$ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) =>
  Array.from(ctx.querySelectorAll<T>(sel) as NodeListOf<T>);

/* ---------- Nav: scrolled state, hide on scroll down, mobile dock ---------- */
(() => {
  let lastY = window.scrollY;
  let ticking = false;
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const update = () => {
    const y = window.scrollY;
    root.classList.toggle('is-scrolled', y > 24);
    const menuOpen = root.classList.contains('menu-open');
    root.classList.toggle('nav-hidden', !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4) root.classList.remove('nav-hidden');
    const threshold = hero ? hero.offsetHeight * 0.85 : 320;
    const nearEnd = window.innerHeight + y > document.body.scrollHeight - 900;
    root.classList.toggle('dock-on', y > threshold && !nearEnd);
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* ---------- Nav: sliding indicator ---------- */
(() => {
  const host = document.querySelector<HTMLElement>('[data-indicator-host]');
  const bar = document.querySelector<HTMLElement>('[data-indicator]');
  if (!host || !bar) return;
  const links = $$<HTMLAnchorElement>('a', host);
  const active = links.find((a) => a.getAttribute('aria-current') === 'page');
  const moveTo = (a?: HTMLElement) => {
    if (!a) { bar.style.setProperty('--o', '0'); return; }
    const pad = 13.6; // matches link inline padding
    bar.style.setProperty('--x', `${a.offsetLeft + pad}px`);
    bar.style.setProperty('--w', `${a.offsetWidth - pad * 2}px`);
    bar.style.setProperty('--o', '1');
  };
  links.forEach((a) => {
    a.addEventListener('mouseenter', () => moveTo(a));
    a.addEventListener('focus', () => moveTo(a));
  });
  host.addEventListener('mouseleave', () => moveTo(active));
  document.fonts?.ready.then(() => moveTo(active));
})();

/* ---------- Mobile menu ---------- */
(() => {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!btn || !menu) return;
  const main = document.getElementById('main');
  const open = () => {
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    btn.setAttribute('aria-expanded', 'true');
    root.classList.add('menu-open');
    root.classList.remove('nav-hidden');
    document.body.style.overflow = 'hidden';
    main?.setAttribute('inert', '');
    menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
  };
  const close = (focusBtn = true) => {
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
    document.body.style.overflow = '';
    main?.removeAttribute('inert');
    window.setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduced ? 0 : 800);
    if (focusBtn) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => (btn.getAttribute('aria-expanded') === 'true' ? close() : open()));
  menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) close(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) close(); });
  window.matchMedia('(min-width: 1001px)').addEventListener('change', (e) => { if (e.matches && root.classList.contains('menu-open')) close(false); });
})();

/* ---------- Scroll reveals ---------- */
(() => {
  const targets = $$('[data-reveal], [data-split]');
  if (reduced || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
  // Fully clipped elements never "intersect" (clip-path is honoured by IO),
  // so masked reveals are observed through their parent instead.
  const proxy = new Map<Element, Element[]>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (proxy.get(e.target) ?? []).forEach((t) => t.classList.add('is-in'));
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  targets.forEach((t) => {
    const observed = t.getAttribute('data-reveal') === 'mask' && t.parentElement ? t.parentElement : t;
    proxy.set(observed, [...(proxy.get(observed) ?? []), t]);
    io.observe(observed);
  });
})();

/* ---------- Scroll-linked motion: parallax, horizontal gallery, scrub type ---------- */
(() => {
  if (reduced) return;
  const parallax = $$('[data-parallax]');
  const scrubs = $$('[data-scrub]');
  const hscroll = $$('[data-hscroll]');
  if (!parallax.length && !scrubs.length && !hscroll.length) return;

  const visible = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  }, { rootMargin: '20% 0px' });
  [...parallax, ...scrubs, ...hscroll].forEach((el) => io.observe(el));

  const desktopH = window.matchMedia('(min-width: 900px)');
  let ticking = false;
  const frame = () => {
    const vh = window.innerHeight;
    parallax.forEach((el) => {
      if (!visible.has(el)) return;
      const r = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax || '0.15');
      const center = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', `${(-center * speed).toFixed(1)}px`);
    });
    scrubs.forEach((el) => {
      if (!visible.has(el)) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty('--p', p.toFixed(4));
    });
    hscroll.forEach((section) => {
      const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
      if (!track) return;
      if (!desktopH.matches) { track.style.transform = ''; section.style.height = ''; return; }
      const distance = track.scrollWidth - window.innerWidth;
      section.style.height = `${distance + vh}px`;
      if (!visible.has(section)) return;
      const r = section.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      track.style.transform = `translate3d(${(-distance * p).toFixed(1)}px,0,0)`;
      section.style.setProperty('--hp', p.toFixed(4));
    });
    ticking = false;
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  frame();
})();

/* ---------- Two-path hero: hover / focus expands a panel ---------- */
(() => {
  $$('[data-paths]').forEach((host) => {
    const panels = $$('[data-path]', host);
    const set = (which: string | null) => {
      if (which) host.dataset.active = which; else delete host.dataset.active;
    };
    panels.forEach((p) => {
      p.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse') set(p.dataset.path!); });
      p.addEventListener('focusin', () => set(p.dataset.path!));
    });
    host.addEventListener('pointerleave', () => set(null));
    host.addEventListener('focusout', (e) => { if (!host.contains((e as FocusEvent).relatedTarget as Node)) set(null); });

    // Subtle image drift following the pointer inside each panel.
    if (!finePointer || reduced) return;
    panels.forEach((p) => {
      p.addEventListener('pointermove', (e) => {
        const r = p.getBoundingClientRect();
        p.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
        p.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
      });
    });
  });
})();

/* ---------- Editorial services menu ----------
 * Hover previews (image + highlight) without moving layout; click / focus / tap
 * expands the item. Keeping the two apart stops the list jumping under the pointer.
 */
(() => {
  $$('[data-services]').forEach((host) => {
    const list = host.querySelector<HTMLElement>('.services__list');
    const items = $$<HTMLElement>('[data-service]', host);
    const figures = $$<HTMLElement>('[data-service-figure]', host);
    let active = 0;
    const preview = (i: number) => {
      items.forEach((it, j) => it.classList.toggle('is-lit', i === j));
      figures.forEach((f, j) => f.classList.toggle('is-active', i === j));
    };
    const activate = (i: number) => {
      active = i;
      items.forEach((it, j) => {
        it.classList.toggle('is-active', i === j);
        it.querySelector('button')?.setAttribute('aria-expanded', String(i === j));
      });
      preview(i);
    };
    items.forEach((it, i) => {
      it.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse') preview(i); });
      it.querySelector('button')?.addEventListener('click', () => activate(i));
      it.addEventListener('focusin', () => { if (active !== i) activate(i); });
    });
    list?.addEventListener('pointerleave', () => preview(active));
    activate(0);
  });
})();

/* ---------- Magnetic CTAs ---------- */
(() => {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((el) => {
    const strength = 0.28;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
})();

/* ---------- Cursor follower (decorative; native cursor stays visible) ---------- */
(() => {
  const c = document.querySelector<HTMLElement>('[data-cursor]');
  if (!c || !finePointer || reduced) return;
  const label = c.querySelector('span')!;
  let x = -100, y = -100, cx = x, cy = y, raf = 0;
  const loop = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(loop) : 0;
  };
  window.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    c.classList.add('is-visible');
    if (!raf) raf = requestAnimationFrame(loop);
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor-label], a, button, input, select, textarea, label');
    const text = t?.dataset.cursorLabel;
    c.classList.toggle('is-label', !!text);
    c.classList.toggle('is-link', !text && !!t && !t.matches('input, select, textarea'));
    if (text) label.textContent = text;
  }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.remove('is-visible'));
})();
