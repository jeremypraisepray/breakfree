import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content model. Every collection lives in src/content/<name>/ as Markdown
 * and is editable through the CMS at /admin (see public/admin/config.yml).
 * Set `draft: true` to hide an entry without deleting it.
 */

const programs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programs' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kicker: z.string(),
      summary: z.string(),
      audience: z.string(),
      level: z.string(),
      schedule: z.string().optional(),
      image: image(),
      imageAlt: z.string(),
      order: z.number().default(99),
      draft: z.boolean().default(false),
    }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      path: z.enum(['school', 'worldwide']),
      summary: z.string(),
      highlights: z.array(z.string()).default([]),
      image: image(),
      imageAlt: z.string(),
      link: z.string(),
      order: z.number().default(99),
      draft: z.boolean().default(false),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    name: z.string(),
    role: z.string().optional(),
    path: z.enum(['school', 'worldwide']).default('school'),
    order: z.number().default(99),
    draft: z.boolean().default(true),
  }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/partners' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      category: z.string().optional(),
      logo: image().optional(),
      url: z.string().optional(),
      order: z.number().default(99),
      draft: z.boolean().default(true),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      location: z.string(),
      summary: z.string(),
      link: z.string().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      draft: z.boolean().default(true),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      draft: z.boolean().default(true),
    }),
});

export const collections = { programs, services, testimonials, partners, events, news };
