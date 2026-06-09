// Jest env mocks: Next.js + trading-ui stubs.
// Reused by moduleNameMapper for `next/*` and `@obsidian/trading-ui`.

const nextNavigation = {
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/trading',
  useParams: () => ({}),
};

const nextDynamic = { default: (c: unknown) => c };

const nextFont = {
  IBM_Plex_Mono: () => 'IBM Plex Mono',
  Syne: () => 'Syne',
};

const tradingUiStub = {
  TradingWorkstation: function Stub() {
    return null;
  },
  OrderEntry: function Stub() {
    return null;
  },
};

// Default export = the next/navigation mock so `import { useRouter } from 'next/navigation'` works
module.exports = nextNavigation;
module.exports.useRouter = nextNavigation.useRouter;
module.exports.useSearchParams = nextNavigation.useSearchParams;
module.exports.usePathname = nextNavigation.usePathname;
module.exports.useParams = nextNavigation.useParams;
module.exports.default = nextNavigation;
module.exports.TradingWorkstation = tradingUiStub.TradingWorkstation;
module.exports.OrderEntry = tradingUiStub.OrderEntry;
module.exports.IBM_Plex_Mono = nextFont.IBM_Plex_Mono;
module.exports.Syne = nextFont.Syne;