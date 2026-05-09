/**
 * File:        apps/ib-portal/src/shared/sidebar/nav-config.ts
 * Module:      ib-portal · Sidebar Navigation Config
 * Purpose:     Static nav group / item definitions for the IB portal sidebar
 *
 * Exports:
 *   - NAV_GROUPS: NavGroup[] — 4 sections: OVERVIEW, MY NETWORK, MARKETING, SUPPORT
 *   - ICON_MAP: Record<string, LucideIcon> — maps nav item keys to Lucide icon components
 *
 * Depends on:
 *   - lucide-react — Lucide icon components
 *   - ../../lib/types — NavGroup
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import {
  BarChart2,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavGroup } from '../../lib/types';

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { key: 'dashboard',    label: 'Dashboard',            href: '/dashboard',      icon: 'dashboard'    },
      { key: 'earnings',     label: 'Earnings',             href: '/earnings',       icon: 'earnings'     },
    ],
  },
  {
    label: 'MY NETWORK',
    items: [
      { key: 'clients',      label: 'My Clients',           href: '/clients',        icon: 'clients'      },
      { key: 'sub-ibs',      label: 'Sub-IBs',              href: '/sub-ibs',        icon: 'subIBs'       },
      { key: 'referral-links', label: 'Referral Links',     href: '/referral-links', icon: 'links'        },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { key: 'marketing',    label: 'Marketing Materials',  href: '/marketing',      icon: 'marketing'    },
      { key: 'landing-pages', label: 'Landing Pages',       href: '/landing-pages',  icon: 'landingPages' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { key: 'announcements', label: 'Announcements',       href: '/announcements',  icon: 'announcements' },
      { key: 'faq',           label: 'FAQ',                 href: '/faq',            icon: 'faq'           },
      { key: 'contact',       label: 'Contact Manager',     href: '/contact',        icon: 'contact'       },
    ],
  },
];

export const ICON_MAP: Record<string, LucideIcon> = {
  dashboard:     LayoutDashboard,
  earnings:      DollarSign,
  clients:       Users,
  subIBs:        Layers,
  links:         ExternalLink,
  marketing:     BarChart2,
  landingPages:  Globe,
  announcements: Megaphone,
  faq:           HelpCircle,
  contact:       MessageSquare,
  reports:       FileText,
};
