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
    // Hindari konflik dengan transpilePackages
    // serverComponentsExternalPackages: ['recharts'],
    missingSuspenseWithCSRBailout: false,
  },
  // Menjamin recharts ditranspilasi dengan benar
  transpilePackages: ['recharts', 'recharts-scale', 'd3-scale', 'd3-shape', 'd3-path', 'd3-interpolate'],
  // Konfigurasi output yang lebih stabil untuk Vercel
  output: 'standalone',
  // Konfigurasi untuk meningkatkan stabilitas halaman
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
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
          },
          // Chunk terpisah untuk auth
          auth: {
            name: 'auth',
            chunks: 'all',
            test: /[\\/]components[\\/]auth[\\/]/,
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
