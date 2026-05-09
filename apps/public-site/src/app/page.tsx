/**
 * File:        apps/public-site/src/app/page.tsx
 * Module:      public-site · Pages
 * Purpose:     Marketing site home page — assembles all section components in order.
 *              This file is the composition root; all design logic lives in sections/.
 *
 * Exports:
 *   - default IndexPage()  — the "/" route component
 *
 * Depends on:
 *   - @/components/sections/*  — all section components (17 total)
 *
 * Side-effects:
 *   - none (server component; interactive sections self-declare 'use client')
 *
 * Key invariants:
 *   - Nav is rendered outside <main> so it overlays all sections
 *   - Footer is rendered outside <main> (below it)
 *   - Three.js sections lazy-load on scroll-into-view internally
 *   - Sections assembled in marketing funnel order (awareness → value → proof → price → trust → CTA)
 *
 * Read order:
 *   1. Section imports — understand what's assembled
 *   2. IndexPage render — composition order
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { Nav }             from '@/components/sections/Nav';
import { Hero }            from '@/components/sections/Hero';
import { Ecosystem }       from '@/components/sections/Ecosystem';
import { DualAudience }    from '@/components/sections/DualAudience';
import { ProofStrip }      from '@/components/sections/ProofStrip';
import { GlobeSection }    from '@/components/sections/GlobeSection';
import { OrderBookSection }from '@/components/sections/OrderBookSection';
import { ScrollStories }   from '@/components/sections/ScrollStories';
import { IBMirror }        from '@/components/sections/IBMirror';
import { Social }          from '@/components/sections/Social';
import { PricingSection }  from '@/components/sections/PricingSection';
import { TechStack }       from '@/components/sections/TechStack';
import { Compliance }      from '@/components/sections/Compliance';
import { Onboarding }      from '@/components/sections/Onboarding';
import { FinalCTA }        from '@/components/sections/FinalCTA';
import { Footer }          from '@/components/sections/Footer';

export default function IndexPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ecosystem />
        <DualAudience />
        <ProofStrip />
        <GlobeSection />
        <OrderBookSection />
        <ScrollStories />
        <IBMirror />
        <Social />
        <PricingSection />
        <TechStack />
        <Compliance />
        <Onboarding />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
