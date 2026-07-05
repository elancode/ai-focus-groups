/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Native/binary packages must not be bundled by the server build.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'mongodb'],
  // Force the Chromium binary into the analyze function's trace; otherwise
  // Next's tracing misses it (loaded via a computed path) and executablePath()
  // fails at runtime on Vercel.
  outputFileTracingIncludes: {
    '/api/analyze': ['./node_modules/@sparticuz/chromium/**'],
  },
}

export default nextConfig
