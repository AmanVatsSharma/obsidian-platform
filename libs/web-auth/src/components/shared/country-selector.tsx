/**
 * File:        libs/web-auth/src/components/shared/country-selector.tsx
 * Module:      web-auth · CountrySelector
 * Purpose:     Enterprise-grade country selector with flag, dial code, search, and keyboard navigation.
 *              Designed for login/signup flows in a multi-broker trading platform.
 *
 * Exports:
 *   - CountrySelector({ selectedCountry, onCountryChange, className? })
 *     selectedCountry: { code: string, name: string, dialCode: string } | null
 *     onCountryChange: (country: { code: string, name: string, dialCode: string }) => void
 *
 * Depends on:
 *   - React state (useState, useRef, useEffect) for UI state and keyboard navigation
 *   - Obsidian design tokens via CSS variables
 *
 * Key invariants:
 *   - Renders as compact dropdown (height: 52px) with search input
 *   - Shows flag emoji, country name, dial code
 *   - Keyboard navigation (↑/↓ to navigate, Enter/Space to select)
 *   - Filterable by country name or dial code
 *   - Maximum 10 visible countries in dropdown
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  // Priority countries for trading platform
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { code: 'AE', name: 'UAE', dialCode: '+971' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', dialCode: '+52' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'SE', name: 'Sweden', dialCode: '+46' },
  { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' },
  { code: 'FI', name: 'Finland', dialCode: '+358' },
  { code: 'PL', name: 'Poland', dialCode: '+48' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41' },
  { code: 'AT', name: 'Austria', dialCode: '+43' },
  { code: 'BE', name: 'Belgium', dialCode: '+32' },
  { code: 'IE', name: 'Ireland', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GR', name: 'Greece', dialCode: '+30' },
  { code: 'TR', name: 'Turkey', dialCode: '+90' },
  { code: 'IL', name: 'Israel', dialCode: '+972' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'EG', name: 'Egypt', dialCode: '+20' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'GH', name: 'Ghana', dialCode: '+233' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', dialCode: '+977' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679' },
  { code: 'VU', name: 'Vanuatu', dialCode: '+678' },
  { code: 'WS', name: 'Samoa', dialCode: '+685' },
  { code: 'TO', name: 'Tonga', dialCode: '+676' },
  { code: 'TV', name: 'Tuvalu', dialCode: '+688' },
  { code: 'NR', name: 'Nauru', dialCode: '+674' },
  { code: 'KI', name: 'Kiribati', dialCode: '+686' },
  { code: 'MH', name: 'Marshall Islands', dialCode: '+692' },
  { code: 'FM', name: 'Federated States of Micronesia', dialCode: '+691' },
  { code: 'PW', name: 'Palau', dialCode: '+680' },
  { code: 'NR', name: 'Nauru', dialCode: '+674' },
];

interface CountrySelectorProps {
  selectedCountry: Country | null;
  onCountryChange: (country: Country) => void;
  className?: string;
  showRecent?: boolean;
}

export function CountrySelector({ selectedCountry, onCountryChange, className, showRecent = true }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>(COUNTRIES);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Get recent countries from localStorage
  const getRecentCountries = (): Country[] => {
    try {
      const recentStr = localStorage.getItem('recent-countries');
      if (!recentStr) return [];

      const recentCodes = JSON.parse(recentStr) as string[];
      return recentCodes
        .slice(0, 3) // Show top 3 recent
        .map(code => COUNTRIES.find(c => c.code === code))
        .filter(Boolean) as Country[];
    } catch {
      return [];
    }
  };

  // Add country to recent list
  const addToRecent = (country: Country) => {
    try {
      const existing = localStorage.getItem('recent-countries');
      const codes = existing ? JSON.parse(existing) as string[] : [];

      // Remove if exists and add to front
      const filtered = codes.filter(c => c !== country.code);
      filtered.unshift(country.code);

      // Keep only 5 recent
      localStorage.setItem('recent-countries', JSON.stringify(filtered.slice(0, 5)));
    } catch {
      // localStorage unavailable
    }
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCountries(COUNTRIES);
      setHighlightedIndex(-1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = COUNTRIES.filter(
      country =>
        country.name.toLowerCase().includes(term) ||
        country.dialCode.includes(term) ||
        country.code.toLowerCase().includes(term)
    );

    setFilteredCountries(filtered.slice(0, 10)); // Limit to 10 results
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredCountries.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
            onCountryChange(filteredCountries[highlightedIndex]);
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredCountries, onCountryChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleCountryClick = (country: Country) => {
    onCountryChange(country);
    addToRecent(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  const recentCountries = showRecent ? getRecentCountries() : [];

  return (
    <div
      className={`country-selector-wrapper ${className || ''}`}
      style={{ position: 'relative', width: '100%' }}
      ref={dropdownRef}
    >
      <div
        onClick={() => setIsOpen(true)}
        ref={selectedRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 52,
          padding: '0 16px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          transition: 'all 150ms var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>
            {selectedCountry ? (
              getFlagEmoji(selectedCountry.code)
            ) : '🌍'}
          </span>
          <div>
            {selectedCountry ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--fg1)',
                }}>
                  {selectedCountry.dialCode}
                </div>
                <div style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--fg3)',
                  textTransform: 'uppercase',
                }}>
                  {selectedCountry.code}
                </div>
              </>
            ) : (
              <div style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 14,
                color: 'var(--fg3)',
              }}>
                Select country
              </div>
            )}
          </div>
        </div>
        <span style={{ color: 'var(--fg3)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: '0 0 0 1px var(--border), 0 8px 40px rgba(0,0,0,0.6)',
            maxHeight: '300px',
            overflow: 'hidden',
            zIndex: 1000,
          }}
        >
          {showRecent && recentCountries.length > 0 && !searchTerm && (
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{
                padding: '8px 16px',
                fontFamily: 'var(--font-data)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: 'var(--fg3)',
                textTransform: 'uppercase',
              }}>
                RECENTLY USED
              </div>
              {recentCountries.map((country, index) => (
                <div
                  key={`recent-${country.code}`}
                  onClick={() => handleCountryClick(country)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: index === 0 ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background 150ms var(--ease)',
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span style={{ fontSize: 20, marginRight: 12 }}>
                    {getFlagEmoji(country.code)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--fg1)',
                    }}>
                      {country.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: 'var(--fg3)',
                      textTransform: 'uppercase',
                    }}>
                      {country.dialCode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search country or dial code..."
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              color: 'var(--fg1)',
            }}
            onClick={e => e.stopPropagation()}
          />

          {filteredCountries.length > 0 ? (
            <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
              {filteredCountries.map((country, index) => (
                <div
                  key={country.code}
                  onClick={() => handleCountryClick(country)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: index === highlightedIndex ? 'var(--bg-hover)' : 'transparent',
                    transition: 'background 150ms var(--ease)',
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span style={{ fontSize: 20, marginRight: 12 }}>
                    {getFlagEmoji(country.code)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--fg1)',
                    }}>
                      {country.name}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      color: 'var(--fg3)',
                      textTransform: 'uppercase',
                    }}>
                      {country.dialCode}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              color: 'var(--fg3)',
            }}>
              No countries found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get flag emoji
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}