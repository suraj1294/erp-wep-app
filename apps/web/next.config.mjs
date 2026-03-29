/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db"],
  serverExternalPackages: ["postgres"],
}

export default nextConfig
