/** @type {import('next').NextConfig} */
const nextConfig = {
  // Help with hydration issues - keep strict mode disabled for now
  reactStrictMode: false,
  
  // Security and performance
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  
  // Build configuration
  eslint: {
    ignoreDuringBuilds: true, // You may want to set this to false in production
  },
  typescript: {
    ignoreBuildErrors: true, // You may want to set this to false in production
  },
  
  // Image optimization
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable TurboPack for faster builds (still experimental)
    turbo: {},
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance tuning
  staticPageGenerationTimeout: 1000,
}

export default nextConfig
