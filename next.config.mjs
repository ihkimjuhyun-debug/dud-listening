/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 시 ESLint(문법검사)와 TypeScript 에러가 있어도 무시하고 배포 진행
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
