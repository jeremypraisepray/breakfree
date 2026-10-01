# Break Free Worldwide — website

Minimal, editorial, cinematic rebuild of [breakfreeworldwide.com](https://www.breakfreeworldwide.com), organised around two conversion paths:

| Path | Audience | Primary CTA | Funnel |
| --- | --- | --- | --- |
| **01 — First Class Free** | Students, parents, Houston community | Get your first class free | `/first-class-free` |
| **02 — Entertainment + Partnerships** | Schools, brands, corporations, events, agencies | Book Break Free / Start a partnership | `/book` (`?interest=partnership`) |

Built with [Astro](https://astro.build): static HTML, ~zero JS by default, AVIF/WebP responsive images generated at build time.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site → dist/
npm run preview
```

## Pages

`/` home · `/school` · `/first-class-free` (+ `/thanks`) · `/entertainment` · `/partnerships` · `/book` (+ `/thanks`) · `/about` · `/contact` · `/news` · `404`

## Editing content (no code)

Everything editable lives in plain files, and the same files are wired to a visual editor at **`/admin`** ([Decap CMS](https://decapcms.org)):

| What | Where |
| --- | --- |
| Address, hours, email, phone, social links, announcement bar, impact numbers, form endpoints | `src/data/site.json` |
| Classes / programs | `src/content/programs/*.md` |
| Homepage services menu | `src/content/services/*.md` |
| Events | `src/content/events/*.md` |
| News & announcements | `src/content/news/*.md` |
| Testimonials | `src/content/testimonials/*.md` |
| Partners | `src/content/partners/*.md` |
| Photos | `src/assets/photos/` (uploads go to `src/assets/uploads/`) |

New programs, services, events and partners appear automatically — no redesign needed. Set `draft: true` to hide an entry.
Testimonials and partners sections stay hidden until at least one real entry is published (example files are drafts).

**CMS login:** on Netlify, enable *Identity* + *Git Gateway* and change `backend.name` in `public/admin/config.yml` to `git-gateway`. On other hosts keep `github` and add an OAuth provider.

## Lead capture

Both funnels are multi-step (progressive disclosure), validate each step, prefill from the URL (`?program=breaking`, `?service=dj`, `?interest=partnership`) and end on an inline confirmation ("YOU'RE IN." / "LET'S MOVE.").

- **Netlify (default):** leave `forms.*Endpoint` empty in `site.json`. Netlify Forms captures submissions (`first-class-free`, `book-break-free`), with a honeypot.
- **Anywhere else:** paste a Formspree / Basin / CRM webhook URL into `forms.firstClassEndpoint` / `forms.bookingEndpoint`.
- Without JavaScript, the forms still post normally and land on `/first-class-free/thanks` or `/book/thanks`.
- Conversion tracking: each success dispatches a `bf:lead` window event and pushes `generate_lead` to `dataLayer` if GTM is present.

## Before launch — please confirm

The current live site could not be reached while building, so only facts from the brief were used. Nothing was invented:

- [ ] Add the public **email, phone and social URLs** in `src/data/site.json` (they render only once filled in).
- [ ] Review the program details (ages, levels, schedule) in `src/content/programs/`.
- [ ] Add real testimonials, partners, events and verified stats as they become available.
- [ ] Swap in more photography or short looping video. The 7 supplied photos are used throughout.

## Design system

- **Palette:** ink `#0a0a0a`, bone `#efebe4`, paper `#f7f5f1`, plus two signal accents taken from the photography: **school yellow** `#f3d23a` (Path 01) and **worldwide red** `#ea4a2f` (Path 02).
- **Type:** Archivo variable (width + weight axes, self-hosted) for display and body; JetBrains Mono for labels.
- **Motion:** masked line reveals, image mask reveals, parallax, a pinned horizontal gallery, spring-based split hero, magnetic CTAs, a decorative cursor and cross-document view transitions. All of it is disabled under `prefers-reduced-motion`, and every section works without JS.
- **SEO:** per-page titles and descriptions, canonical URLs, Open Graph/Twitter images, `Organization` + `LocalBusiness` JSON-LD (address, hours, First Class Free offer), FAQ and Event schema, sitemap, robots.
