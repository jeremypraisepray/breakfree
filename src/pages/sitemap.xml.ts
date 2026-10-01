import type { APIRoute } from 'astro';

const pages = ['', 'school', 'first-class-free', 'entertainment', 'partnerships', 'book', 'about', 'contact', 'news'];

export const GET: APIRoute = ({ site }) => {
  const base = site?.href.replace(/\/$/, '') ?? '';
  const urls = pages
    .map((p) => `<url><loc>${base}/${p}</loc><changefreq>monthly</changefreq><priority>${p === '' ? '1.0' : p === 'first-class-free' || p === 'book' ? '0.9' : '0.7'}</priority></url>`)
    .join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
