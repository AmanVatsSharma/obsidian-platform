/**
 * path-register.js — workspace root
 * Loaded via --require before the compiled NestJS backend starts.
 * Maps @obsidian/backend-* path aliases to their compiled locations in dist/.
 * Required because TypeScript path aliases are compile-time only; Node.js
 * needs a runtime resolver to find the actual .js files.
 */
const { register } = require('tsconfig-paths');
const path = require('path');

register({
  baseUrl: path.join(__dirname, 'dist/apps/backend/src'),
  paths: {
    '@obsidian/backend-auth':              ['modules/auth/index'],
    '@obsidian/backend-users':             ['modules/users/index'],
    '@obsidian/backend-rbac':              ['modules/rbac/index'],
    '@obsidian/backend-tenancy':           ['modules/tenancy/index'],
    '@obsidian/backend-market':            ['modules/market/index'],
    '@obsidian/backend-accounts':          ['modules/accounts/index'],
    '@obsidian/backend-demo-accounts':     ['modules/demo-accounts/index'],
    '@obsidian/backend-oms':               ['modules/oms/index'],
    '@obsidian/backend-realtime':          ['modules/realtime/prana-stream/index'],
    '@obsidian/backend-notifications':     ['modules/notifications/index'],
    '@obsidian/backend-admin':             ['modules/admin/index'],
    '@obsidian/backend-execution-gateway': ['modules/execution-gateway/index'],
    '@obsidian/backend-broker-hierarchy':  ['modules/broker-hierarchy/index'],
    '@obsidian/backend-compliance':        ['modules/compliance/index'],
    '@obsidian/backend-onboarding':        ['modules/onboarding/index'],
    '@obsidian/backend-risk-policy':       ['modules/risk-policy/index'],
    '@obsidian/backend-settlement':        ['modules/settlement/index'],
    '@obsidian/backend-reconciliation':    ['modules/reconciliation/index'],
    '@obsidian/backend-corporate-actions': ['modules/corporate-actions/index'],
    '@obsidian/backend-limits-controls':   ['modules/limits-and-controls/index'],
    '@obsidian/backend-saas-control-plane':['modules/saas-control-plane/index'],
    '@obsidian/backend-dealing':           ['modules/dealing/index'],
    '@obsidian/backend-support':           ['modules/support/index'],
    '@obsidian/backend-partners':          ['modules/partners/index'],
    '@obsidian/backend-developer-platform':['modules/developer-platform/index'],
    '@obsidian/backend/*':                 ['*'],
  }
});
