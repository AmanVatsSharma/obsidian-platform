/**
 * @file button.tsx
 * @module obsidian-ui
 * @description Primary action control (Radix Slot + CVA variants). Client component.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-obs text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-obsidian-action text-obsidian-action-fg shadow-obs-sm hover:bg-obsidian-action-hover',
        secondary:
          'bg-obsidian-muted text-obsidian-primary border border-obsidian-border hover:bg-obsidian-elevated',
        ghost: 'bg-transparent text-obsidian-primary hover:bg-obsidian-muted',
        destructive: 'bg-obsidian-danger text-white shadow-obs-sm hover:opacity-90',
        outline:
          'border border-obsidian-border bg-transparent text-obsidian-primary hover:bg-obsidian-muted',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(asChild ? {} : { type })}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
