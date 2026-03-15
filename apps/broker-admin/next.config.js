//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  allowedDevOrigins: ['http://localhost:4300'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
      {
        source: '/broker-hierarchy/:path*',
        destination: 'http://localhost:3000/broker-hierarchy/:path*',
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
