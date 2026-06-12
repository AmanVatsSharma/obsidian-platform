/**
 * File:        apps/web/features/console/lib/mappers.spec.ts
 * Module:      web · Console · Mappers
 * Purpose:     Unit tests for the DTO → ConsoleUser mappers. Pure function tests
 *              only — no Apollo, no React, no browser APIs.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import {
  toTradingAccount,
  deriveKycState,
  deriveTier,
  mapProfileToConsoleUser,
  emptyConsoleUser,
  type BackendUserProfile,
  type BackendAccount,
} from './mappers';
import { type ConsoleUser } from './seed-data';

describe('mappers', () => {
  describe('toTradingAccount', () => {
    it('maps a LIVE account', () => {
      const backend: BackendAccount = {
        id: 'ML-441829',
        accountType: 'LIVE',
        status: 'ACTIVE',
        baseCurrency: 'EUR',
        createdAt: '2023-08-14',
        updatedAt: '2026-05-08',
      };
      const result = toTradingAccount(backend);

      expect(result.id).toBe('ML-441829');
      expect(result.type).toBe('Live');
      expect(result.status).toBe('active');
      expect(result.currency).toBe('EUR');
    });

    it('maps a DEMO account', () => {
      const backend: BackendAccount = {
        id: 'DM-998127',
        accountType: 'DEMO',
        status: 'ACTIVE',
        baseCurrency: 'USD',
        createdAt: '2023-08-14',
        updatedAt: '2026-05-08',
      };
      const result = toTradingAccount(backend);

      expect(result.type).toBe('Demo');
    });

    it('normalizes unknown currencies to USD', () => {
      const backend: BackendAccount = {
        id: 'X-1',
        accountType: 'LIVE',
        status: 'ACTIVE',
        baseCurrency: 'XYZ',
        createdAt: '2023-08-14',
        updatedAt: '2023-08-14',
      };
      const result = toTradingAccount(backend);

      expect(result.currency).toBe('USD');
    });

    it('maps DISABLED to archived', () => {
      const backend: BackendAccount = {
        id: 'X-2',
        accountType: 'LIVE',
        status: 'DISABLED',
        baseCurrency: 'USD',
        createdAt: '2023-08-14',
        updatedAt: '2023-08-14',
      };
      const result = toTradingAccount(backend);

      expect(result.status).toBe('archived');
    });

    it('defaults platform to MT5', () => {
      const backend: BackendAccount = {
        id: 'X-3',
        accountType: 'LIVE',
        status: 'ACTIVE',
        baseCurrency: 'USD',
        createdAt: '2023-08-14',
        updatedAt: '2023-08-14',
      };
      const result = toTradingAccount(backend);

      expect(result.platform).toBe('MT5');
    });
  });

  describe('deriveKycState', () => {
    it('returns approved when email and mobile verified', () => {
      const profile: BackendUserProfile = {
        id: 'u1',
        tenantId: 't1',
        mobileE164: '+1234567890',
        email: 'a@b.com',
        isMobileVerified: true,
        isEmailVerified: true,
        name: 'Test',
        countryCode: 'US',
        isActive: true,
        createdAt: '2023-01-01',
      };

      expect(deriveKycState(profile)).toBe('approved');
    });

    it('returns pending when only one verified', () => {
      const emailOnly: BackendUserProfile = {
        ...baseProfile(),
        isMobileVerified: false,
        isEmailVerified: true,
      };

      expect(deriveKycState(emailOnly)).toBe('pending');
    });

    it('returns todo when neither verified', () => {
      const none: BackendUserProfile = {
        ...baseProfile(),
        isMobileVerified: false,
        isEmailVerified: false,
      };

      expect(deriveKycState(none)).toBe('todo');
    });

    it('returns todo when profile null', () => {
      expect(deriveKycState(null)).toBe('todo');
    });
  });

  describe('deriveTier', () => {
    it('maps level 3 to platinum', () => {
      expect(deriveTier(3)).toBe('platinum');
    });

    it('maps level 2 to gold', () => {
      expect(deriveTier(2)).toBe('gold');
    });

    it('maps level 1 to silver', () => {
      expect(deriveTier(1)).toBe('silver');
    });

    it('maps level 0 to unverified', () => {
      expect(deriveTier(0)).toBe('unverified');
    });
  });

  describe('mapProfileToConsoleUser', () => {
    it('returns empty shape when profile and accounts are missing', () => {
      const result = mapProfileToConsoleUser(null, []);

      // Strictly empty: no fake persona, no fake IBANs, no fake devices.
      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.email).toBe('');
      expect(result.phone).toBe('');
      expect(result.country).toBe('');
      expect(result.accounts).toEqual([]);
      expect(result.apiKeys).toEqual([]);
      expect(result.devices).toEqual([]);
      expect(result.transactions).toEqual([]);
      expect(result.balanceTotal).toBe(0);
    });

    it('merges profile data with no seed fallback', () => {
      const profile: BackendUserProfile = {
        id: 'u-new',
        tenantId: 't1',
        mobileE164: '+111',
        email: 'new@test.com',
        isMobileVerified: true,
        isEmailVerified: true,
        name: 'New Name',
        countryCode: 'UK',
        isActive: true,
        createdAt: '2024-01-01',
      };

      const result = mapProfileToConsoleUser(profile, []);

      expect(result.id).toBe('u-new');
      expect(result.name).toBe('New Name');
      expect(result.email).toBe('new@test.com');
      // Phone comes from the profile (mobileE164), not the seed.
      expect(result.phone).toBe('+111');
    });

    it('maps accounts array', () => {
      const accounts: BackendAccount[] = [
        {
          id: 'ML-1',
          accountType: 'LIVE',
          status: 'ACTIVE',
          baseCurrency: 'EUR',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ];

      const result = mapProfileToConsoleUser(null, accounts);

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].id).toBe('ML-1');
    });

    it(' derives initials from name', () => {
      const singleName: BackendUserProfile = {
        ...baseProfile(),
        name: 'Alice',
      };

      const result = mapProfileToConsoleUser(singleName, []);

      expect(result.initials).toBe('AL');
    });

    it('combines first and last for two-part name', () => {
      const fullName: BackendUserProfile = {
        ...baseProfile(),
        name: 'Bob Smith',
      };

      const result = mapProfileToConsoleUser(fullName, []);

      expect(result.initials).toBe('BS');
    });

    it('derives KYC state from profile', () => {
      const verifiedProfile: BackendUserProfile = {
        ...baseProfile(),
        isEmailVerified: true,
        isMobileVerified: true,
      };

      const result = mapProfileToConsoleUser(verifiedProfile, []);

      expect(result.kycState).toBe('approved');
    });
  });

  describe('emptyConsoleUser', () => {
    it('returns a strictly empty shape', () => {
      const u = emptyConsoleUser();
      expect(u.id).toBe('');
      expect(u.name).toBe('');
      expect(u.initials).toBe('');
      expect(u.email).toBe('');
      expect(u.phone).toBe('');
      expect(u.country).toBe('');
      expect(u.city).toBe('');
      expect(u.address).toBe('');
      expect(u.dob).toBe('');
      expect(u.accounts).toEqual([]);
      expect(u.apiKeys).toEqual([]);
      expect(u.devices).toEqual([]);
      expect(u.loginHistory).toEqual([]);
      expect(u.paymentMethods).toEqual([]);
      expect(u.transactions).toEqual([]);
      expect(u.balanceTotal).toBe(0);
      expect(u.equityTotal).toBe(0);
      expect(u.pnlMTD).toBe(0);
      expect(u.pnlYTD).toBe(0);
      expect(u.tier).toBe('unverified');
      expect(u.kycState).toBe('todo');
      expect(u.kycLevel).toBe(0);
      expect(u.twoFA.app).toBe(false);
      expect(u.twoFA.sms).toBe(false);
      expect(u.twoFA.email).toBe(false);
    });
  });
});

// Helpers -------------------------------------------------------------------

function baseProfile(): BackendUserProfile {
  return {
    id: 'u1',
    tenantId: 't1',
    mobileE164: '+1234567890',
    email: 'a@b.com',
    isMobileVerified: false,
    isEmailVerified: false,
    name: 'Test User',
    countryCode: 'US',
    isActive: true,
    createdAt: '2023-01-01',
  };
}