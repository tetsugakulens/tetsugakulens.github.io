export const prerender = true;
export function GET({ site }: { site: URL }) {
  const body = `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap-index.xml", site).href}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
