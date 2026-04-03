/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SQLite (better-sqlite3) is a native module — only used server-side
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
