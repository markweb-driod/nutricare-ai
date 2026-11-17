/** @type {import('next').NextConfig} */
// Proxy the PHP API through the Next.js origin so the app works behind a
// single public tunnel (and avoids CORS). Override the target with BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';

const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${BACKEND_URL}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
