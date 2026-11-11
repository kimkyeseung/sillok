/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Vercel Hobby image optimization quota exhausted → new images got 402.
    // Resizing is delegated to the image host (Supabase transformations, Wikimedia thumbs).
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
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
