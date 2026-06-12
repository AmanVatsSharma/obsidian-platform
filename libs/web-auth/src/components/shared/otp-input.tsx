/**
 * File:        libs/web-auth/src/components/shared/otp-input.tsx
 * Module:      web-auth · OtpInput
 * Purpose:    Compact, enterprise-grade OTP input with visual validation states,
 *             paste support, keyboard navigation, and dense trading-terminal aesthetic.
 *
 * Exports:
 *   - OtpInput({ value, onChange, length?, autoFocus?, error?, disabled? })
 *     value: string — the current OTP value
 *     onChange: (value: string) => void — callback when OTP changes
 *     length: number — digit count (default: 6)
 *     autoFocus: boolean — focus first input on mount (default: true)
 *     error: boolean — show error state
 *     disabled: boolean — disable all inputs
 *
 * Depends on:
 *   - React state for digit tracking
 *   - Obsidian design tokens via CSS variables
 *
 * Key invariants:
 *   - Each input is exactly 48x56px (compact trading-terminal size)
 *   - First empty input is highlighted with accent border + glow
 *   - Full input shows success indicator (green border)
 *   - Error state shows red border + subtle red glow
 *   - Supports paste of full OTP code
 *   - Arrow key navigation between inputs
 *   - Backspace clears and moves left
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  error = false,
  disabled = false,
}: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array(length).fill('').map((_, i) => (value[i] || ''))
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isComplete = value.length === length;

  // Sync external value changes
  useEffect(() => {
    const newDigits = Array(length).fill('').map((_, i) => (value[i] || ''));
    setDigits(newDigits);
  }, [value, length]);

  // Set initial focus
  useEffect(() => {
    if (autoFocus) {
      const firstEmpty = digits.findIndex(d => !d);
      if (firstEmpty >= 0 && inputRefs.current[firstEmpty]) {
        inputRefs.current[firstEmpty]?.focus();
      }
    }
  }, []);

  const handleDigitChange = useCallback(
    (index: number, char: string) => {
      const cleaned = char.replace(/\D/g, '').slice(-1);
      const newDigits = [...digits];

      if (cleaned) {
        // If user types a digit, replace current and optionally advance
        newDigits[index] = cleaned;
        setDigits(newDigits);

        // Auto-advance to next input if not last
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      } else {
        // If empty (user cleared), just update
        newDigits[index] = '';
        setDigits(newDigits);
      }

      // Notify parent
      const newValue = newDigits.join('');
      onChange(newValue);
    },
    [digits, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (!digits[index] && index > 0) {
          // If empty, move to previous and clear it
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          setDigits(newDigits);
          inputRefs.current[index - 1]?.focus();
          inputRefs.current[index - 1]?.select();
          onChange(newDigits.join(''));
        } else if (!digits[index]) {
          // Already at first empty, just move left
          inputRefs.current[index - 1]?.focus();
        } else {
          // Clear current
          const newDigits = [...digits];
          newDigits[index] = '';
          setDigits(newDigits);
          onChange(newDigits.join(''));
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      } else if (e.key === 'a' && e.ctrlKey) {
        // Select all
        e.preventDefault();
        inputRefs.current[0]?.focus();
        inputRefs.current[length - 1]?.select();
      }
    },
    [digits, length, onChange]
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      if (disabled) return;

      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!text) return;

      const newDigits = Array(length).fill('');
      for (let i = 0; i < text.length; i++) {
        newDigits[i] = text[i];
      }
      setDigits(newDigits);
      onChange(newDigits.join(''));

      // Focus the next empty input or the last one
      const nextEmpty = newDigits.findIndex(d => !d);
      if (nextEmpty >= 0 && nextEmpty < length) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();
      }
    },
    [length, disabled, onChange]
  );

  // Common styles
  const getInputStyle = (index: number): React.CSSProperties => ({
    width: 48,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-elevated)',
    border: `1px solid ${
      error
        ? 'var(--bear)'
        : !digits[index]
        ? index === focusedIndex
          ? 'var(--accent)'
          : 'var(--border)'
        : isComplete
        ? 'var(--bull)'
        : 'var(--border)'
    }`,
    borderRadius: 'var(--r-md)',
    boxShadow: error
      ? '0 0 0 3px rgba(255,59,92,0.15)'
      : !digits[index] && index === focusedIndex
      ? '0 0 0 3px rgba(59,130,246,0.15)'
      : isComplete
      ? '0 0 0 3px rgba(16,217,150,0.15)'
      : 'none',
    textAlign: 'center',
    transition: 'all 150ms var(--ease)',
  });

  const inputInnerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    textAlign: 'center',
    fontFamily: 'var(--font-data)',
    fontSize: 24,
    fontWeight: 600,
    color: error
      ? 'var(--bear)'
      : isComplete
      ? 'var(--bull)'
      : 'var(--fg1)',
    letterSpacing: '0.12em',
    caretColor: 'var(--accent)',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '4px 0',
      }}
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <div key={index} style={getInputStyle(index)}>
          <input
            ref={el => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={e => handleDigitChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            autoFocus={autoFocus && index === 0}
            style={inputInnerStyle}
          />
        </div>
      ))}
    </div>
  );
}