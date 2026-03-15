//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  allowedDevOrigins: ['http://localhost:4400'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
      {
        source: '/saas-control-plane/:path*',
        destination: 'http://localhost:3000/saas-control-plane/:path*',
      },
      {
        source: '/tenancy/:path*',
        destination: 'http://localhost:3000/tenancy/:path*',
      },
    ];
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
