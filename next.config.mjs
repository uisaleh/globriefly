/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: works free on Vercel, Cloudflare Pages, Netlify or GitHub Pages.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
