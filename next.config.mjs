import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'clips-presenters.d-id.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/competitions', destination: '/events', permanent: false },
      { source: '/competitions/new', destination: '/events/new', permanent: false },
      { source: '/competitions/:slug', destination: '/events/:slug', permanent: false },
      { source: '/competitions/:slug/leaderboard', destination: '/events/:slug/leaderboard', permanent: false },
      { source: '/competitions/:slug/judge', destination: '/events/:slug/judge', permanent: false },
      { source: '/competitions/:slug/judge/:submissionId', destination: '/events/:slug/judge/:submissionId', permanent: false },
    ]
  },
};

export default nextConfig;
