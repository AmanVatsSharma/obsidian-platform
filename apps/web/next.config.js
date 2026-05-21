//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  transpilePackages: ['@obsidian/obsidian-ui'],
  allowedDevOrigins: ['http://localhost:4200'],
  async rewrites(){
    return [
      { source: '/market/:path*', destination: 'http://localhost:3000/market/:path*' },
      { source: '/accounts/:path*', destination: 'http://localhost:3000/accounts/:path*' },
      { source: '/oms/:path*', destination: 'http://localhost:3000/oms/:path*' },
      { source: '/rbac/:path*', destination: 'http://localhost:3000/rbac/:path*' },
      { source: '/users/:path*', destination: 'http://localhost:3000/users/:path*' },
      { source: '/auth/:path*', destination: 'http://localhost:3000/auth/:path*' },
      { source: '/graphql', destination: 'http://localhost:3000/graphql' },
      { source: '/api/:path*', destination: 'http://localhost:3000/:path*' }
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
