import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 카카오 프로필 이미지
      { protocol: 'http',  hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 'img1.kakaocdn.net' },
      { protocol: 'https', hostname: 'img2.kakaocdn.net' },
      { protocol: 'https', hostname: 'img3.kakaocdn.net' },
      { protocol: 'https', hostname: 'blogstorage.kakaocdn.net' },
      { protocol: 'https', hostname: 'profile.kakao.com' },
    ],
    // WebP 자동 변환 + 브라우저 캐시 1주일
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
  },
};

export default nextConfig;
