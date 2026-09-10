/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/welcome", destination: "/marketing/index.html" }];
  },
};
export default nextConfig;
