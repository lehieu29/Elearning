/*@type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "randomuser.me"],
  },
  experimental: {
    reactRoot: true,
    suppressHydrationWarning: true,
  },
  // Thêm cấu hình cho biến môi trường
  env: {
    NEXT_PUBLIC_SERVER_URI: process.env.NEXT_PUBLIC_SERVER_URI || 'https://api.studynow.space/api/v1/',
  },
  // Phục vụ tệp tin /public/env-config.js trong build
  // và đảm bảo nó được phục vụ như một tệp tin tĩnh
  async headers() {
    return [
      {
        source: '/env-config.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
