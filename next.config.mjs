/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "people.pic1.co" },
      { protocol: "https", hostname: "app-uploads-cdn.fera.ai" },
    ],
  },

  // The shop has one page for every category, /shop. The old /list address goes there for good, and the category or
  // search in the address goes with it.
  async redirects() {
    return [{ source: "/list", destination: "/shop", permanent: true }];
  },

  // async redirects() {
  //   return [
  //     {
  //       source: '/_api/:path*',
  //       destination: 'https://store.watchfusionkenya.com/_api/:path*',
  //     },
  //     {
  //       source: '/__ecom/:path*',
  //       destination: 'https://store.watchfusionkenya.com/__ecom/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;