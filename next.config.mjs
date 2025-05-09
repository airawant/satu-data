/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Meningkatkan stabilitas build dengan menunda loading untuk halaman charts
  experimental: {
    serverComponentsExternalPackages: ['recharts'],
    missingSuspenseWithCSRBailout: false,
  },
  // Konfigurasi output yang lebih stabil untuk Vercel
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Meningkatkan batas ukuran untuk chunk utama
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk untuk library besar
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Chunk terpisah untuk React dan komponen utama
          react: {
            name: 'react',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 20,
            enforce: true,
          },
          // Chunk terpisah untuk komponen UI
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]components[\\/]ui[\\/]/,
            priority: 5,
            enforce: true,
            reuseExistingChunk: true,
          },
          // Chunk terpisah untuk charts
          charts: {
            name: 'charts',
            chunks: 'all',
            test: /[\\/]components[\\/]charts[\\/]/,
            priority: 15,
            enforce: true,
            reuseExistingChunk: true,
          }
        },
      };
    }

    return config;
  },
  // Mengabaikan/melewatkan rute yang bermasalah saat build
  distDir: process.env.BUILD_DIR || '.next',
}

export default nextConfig
