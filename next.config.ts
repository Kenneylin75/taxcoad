import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 經銷商業務: /dist-xxx/dist-yyy
        source: '/:distId(dist-[^/]+)/:salesId(dist-[^/]+)',
        destination: '/dist-sales-portal/:distId/:salesId',
      },
      {
        // 經銷商: /dist-xxx
        source: '/:distId(dist-[^/]+)',
        destination: '/dist-admin-portal/:distId',
      },
    ];
  },
};

export default nextConfig;
