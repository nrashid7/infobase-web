import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://infobase.lovable.app';
const today = new Date().toISOString().split('T')[0];

const guidesIndex = JSON.parse(
  readFileSync(resolve(__dirname, '../src/data/public_guides_index.json'), 'utf-8')
);

const govDirectoryRaw = readFileSync(
  resolve(__dirname, '../src/data/govDirectory.ts'), 'utf-8'
);

function getSiteSlug(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').replace(/\./g, '-');
  } catch {
    return encodeURIComponent(url);
  }
}

const urlRegex = /url:\s*['"]([^'"]+)['"]/g;
const directorySlugs = new Set();
let match;
while ((match = urlRegex.exec(govDirectoryRaw)) !== null) {
  directorySlugs.add(getSiteSlug(match[1]));
}

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/guides', priority: '0.9', changefreq: 'weekly' },
  { path: '/directory', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
];

const guidePages = guidesIndex.entries.map((entry) => ({
  path: `/guides/${entry.guide_id}`,
  priority: '0.8',
  changefreq: 'monthly',
}));

const directoryPages = [...directorySlugs].map((slug) => ({
  path: `/directory/${slug}`,
  priority: '0.6',
  changefreq: 'monthly',
}));

const allPages = [...staticPages, ...guidePages, ...directoryPages];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(resolve(__dirname, '../public/sitemap.xml'), sitemap);
console.log(`Generated sitemap.xml with ${allPages.length} URLs`);
