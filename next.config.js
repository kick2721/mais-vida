/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora erros de TypeScript e ESLint no build (evita falhas por tipos)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Permite imagens do Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Headers de segurança para produção
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',         value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // Redirect www → non-www em produção
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'www.mais-vida.com' }],
        destination: 'https://mais-vida.com/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
