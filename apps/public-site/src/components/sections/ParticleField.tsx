/**
 * File:        apps/public-site/src/components/sections/ParticleField.tsx
 * Module:      public-site · Sections
 * Purpose:     Tier-adaptive background particle system for the Hero section.
 *              Tier 1/2: Three.js BufferGeometry Points (single GPU draw call,
 *              1800 / 420 particles respectively, with mouse parallax on Tier 1).
 *              Tier 3: 60 CSS animated divs with zero JS overhead.
 *
 * Exports:
 *   - ParticleField({ containerRef })  — renders into the Hero section's absolute layer
 *
 * Depends on:
 *   - @/lib/device-tier   — DeviceTier singleton
 *   - @/lib/three-loader  — loadThree() lazy import
 *   - three               — npm package (dynamic import, not SSR)
 *
 * Side-effects:
 *   - WebGL renderer creation (Tier 1/2)
 *   - requestAnimationFrame loop (Tier 1/2)
 *   - window.addEventListener: mousemove, resize (Tier 1/2)
 *   - All resources disposed on unmount: geo.dispose(), mat.dispose(), renderer.dispose()
 *
 * Key invariants:
 *   - This component must be wrapped in next/dynamic({ ssr: false }) — never import directly
 *     in a server component. The Hero section handles the dynamic() wrapper.
 *   - containerRef.current must be available when the effect runs (Hero mounts before children)
 *   - CSS particle fallback uses CSS custom properties (--dur, --delay, --dx) for zero-JS animation
 *
 * Read order:
 *   1. CSS fallback branch (tier === 3) — understand the simpler path first
 *   2. Three.js branch — particle setup, animation loop, cleanup
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DeviceTier } from '@/lib/device-tier';
import { loadThree } from '@/lib/three-loader';

interface ParticleFieldProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

interface CssParticle {
  id: number;
  left: number;
  bottom: number;
  dur: number;
  delay: number;
  dx: number;
  type: string;
}

export function ParticleField({ containerRef }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const tier = DeviceTier.get();

  useEffect(() => {
    if (tier === 3) { setReady(true); return; }

    let animId: number;
    let cleanup: (() => void) | undefined;

    void loadThree().then((THREE) => {
      if (!THREE || !canvasRef.current) { setReady(true); return; }

      const container = containerRef.current;
      const w = container?.offsetWidth  || window.innerWidth;
      const h = container?.offsetHeight || window.innerHeight;

      const scene    = new THREE.Scene();
      const camera   = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
      camera.position.z = 400;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier === 1 ? 2 : 1));
      renderer.setClearColor(0x000000, 0);

      const count = tier === 1 ? 1800 : 420;
      const positions = new Float32Array(count * 3);
      const colors    = new Float32Array(count * 3);
      const speeds    = new Float32Array(count);
      const phases    = new Float32Array(count);

      const palette = [
        new THREE.Color('#3B82F6'),
        new THREE.Color('#3B82F6'),
        new THREE.Color('#3B82F6'),
        new THREE.Color('#10D996'),
        new THREE.Color('#F59E0B'),
      ];

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 900;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 700;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
        speeds[i] = 0.08 + Math.random() * 0.12;
        phases[i] = Math.random() * Math.PI * 2;
        const col = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: tier === 1 ? 2.2 : 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);

      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / w - 0.5) * 0.3;
        mouseY = -(e.clientY / h - 0.5) * 0.3;
      };
      if (tier === 1) window.addEventListener('mousemove', onMouseMove, { passive: true });

      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.006;

        const pos = geo.attributes['position'].array as Float32Array;
        for (let i = 0; i < count; i++) {
          pos[i * 3 + 1] += speeds[i];
          if (pos[i * 3 + 1] > 350) pos[i * 3 + 1] = -350;
          pos[i * 3] += Math.sin(t + phases[i]) * 0.08;
        }
        geo.attributes['position'].needsUpdate = true;

        if (tier === 1) {
          camera.position.x += (mouseX * 80 - camera.position.x) * 0.025;
          camera.position.y += (mouseY * 60 - camera.position.y) * 0.025;
        }
        camera.lookAt(scene.position);
        mat.opacity = 0.42 + Math.sin(t * 0.7) * 0.13;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nw = container?.offsetWidth  || window.innerWidth;
        const nh = container?.offsetHeight || window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize, { passive: true });

      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
      };
    });

    return () => cleanup?.();
  }, []);

  // ── CSS fallback (Tier 3) ────────────────────────────────────────────────
  const cssParticles = useMemo<CssParticle[]>(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id:     i,
        left:   Math.random() * 100,
        bottom: Math.random() * 20,
        dur:    5 + Math.random() * 8,
        delay:  Math.random() * 8,
        dx:     (Math.random() - 0.5) * 80,
        type:   i % 5 === 0 ? 'green' : i % 7 === 0 ? 'gold' : '',
      })),
    [],
  );

  if (tier === 3) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {cssParticles.map((p) => (
          <div
            key={p.id}
            className={`css-particle ${p.type}`}
            style={{
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              ['--dur'  as string]: `${p.dur}s`,
              ['--delay'as string]: `${p.delay}s`,
              ['--dx'   as string]: `${p.dx}px`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 0,
        opacity: ready ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
