/**
 * @file button.spec.tsx
 * @module obsidian-ui
 * @description Smoke + a11y checks for Button primitive
 * @author BharatERP
 * @created 2026-04-03
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Button } from './button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders a submit button label', () => {
    const { getByRole } = render(<Button type="submit">Save</Button>);
    expect(getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(<Button>Continue</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
