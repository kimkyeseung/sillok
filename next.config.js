/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async redirects() {
    return [
      // Canonical host is the apex domain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.sillok.kr' }],
        destination: 'https://sillok.kr/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
