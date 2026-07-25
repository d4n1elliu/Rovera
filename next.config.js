/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Next holds a dynamic page's payload in the client router for 30s, so
    // navigating back to search results after booking would still show the car
    // as available. Availability has to be read fresh on every visit.
    staleTimes: { dynamic: 0 },
  },
};

module.exports = nextConfig;
