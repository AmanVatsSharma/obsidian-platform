/**
 * File:        apps/public-site/src/components/sections/GlobeSection.tsx
 * Module:      public-site · Sections
 * Purpose:     Tier-adaptive global broker map. Tier 1/2: draggable Three.js
 *              IcosahedronGeometry globe with city dots and arc lines (Tier 1 only).
 *              Tier 3: SVG flat globe with animated broker dots and arc paths.
 *
 * Exports:
 *   - GlobeSection()  — the globe section wrapper
 *
 * Depends on:
 *   - @/lib/device-tier   — DeviceTier
 *   - @/lib/three-loader  — loadThree()
 *
 * Side-effects:
 *   - Three.js renderer (Tier 1/2): WebGL context, rAF loop, mousemove/resize listeners
 *   - IntersectionObserver to lazy-load the globe only when visible
 *   - All resources disposed on unmount
 *
 * Key invariants:
 *   - Globe renders only after it enters the viewport (lazy via IntersectionObserver)
 *   - Dragging is enabled on Tier 1 via pointermove events on the canvas
 *   - SVG fallback is purely CSS animated — zero JS on Tier 3
 *   - Must be wrapped in next/dynamic({ ssr: false }) by any server component import
 *
 * Read order:
 *   1. BROKER_CITIES — data
 *   2. latLonToVec3 — 3D projection math
 *   3. useGlobeThreeJS — Three.js setup hook
 *   4. GlobeSection — composition
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { DeviceTier } from '@/lib/device-tier';
import { loadThree } from '@/lib/three-loader';
import { RevealDiv } from '@/components/ui/RevealDiv';

const BROKER_CITIES: [number, number, string, number][] = [
  [-4.2,   51.5,  'London',        3],
  [55.3,   25.2,  'Dubai',         2],
  [33.4,   35.2,  'Nicosia',       3],
  [151.2, -33.9,  'Sydney',        1],
  [103.8,   1.4,  'Singapore',     2],
  [-43.2, -22.9,  'São Paulo',     1],
  [37.6,   55.8,  'Moscow',        1],
  [28.0,  -26.2,  'Johannesburg',  1],
];

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y:   radius * Math.cos(phi),
    z:   radius * Math.sin(phi) * Math.sin(theta),
  };
}

function GlobeSVGFallback() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto' }}>
      <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="70%"  stopColor="#3B82F6" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#06080A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="globe-inner" cx="40%" cy="35%" r="60%">
            <stop offset="0%"   stopColor="#0C0E12" />
            <stop offset="100%" stopColor="#06080A" />
          </radialGradient>
        </defs>
        <circle cx="250" cy="250" r="240" fill="url(#globe-glow)" />
        <circle cx="250" cy="250" r="200" fill="url(#globe-inner)" stroke="#3B82F6" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const y = 250 - (lat / 90) * 200;
          const r = Math.cos((lat * Math.PI) / 180) * 200;
          return r > 20 ? <ellipse key={lat} cx="250" cy={y} rx={r} ry={r * 0.15} fill="none" stroke="#1C2028" strokeWidth="0.8" strokeOpacity="0.6" /> : null;
        })}
        {/* Longitude lines */}
        {[0, 30, 60, 90, 120, 150].map((lon) => (
          <ellipse key={lon} cx="250" cy="250" rx={Math.abs(Math.cos((lon * Math.PI) / 180)) * 200 || 10} ry="200" fill="none" stroke="#1C2028" strokeWidth="0.8" strokeOpacity="0.5" />
        ))}

        {/* Rotating ring */}
        <g className="globe-ring-anim">
          <ellipse cx="250" cy="250" rx="220" ry="40" fill="none" stroke="#3B82F6" strokeWidth="0.6" strokeOpacity="0.25" strokeDasharray="8 6" />
        </g>

        {/* Arc connections */}
        {['M 175,215 Q 250,180 315,235', 'M 315,235 Q 340,260 295,295', 'M 175,215 Q 200,260 220,295'].map((d, i) => (
          <path key={i} d={d} className="globe-arc" style={{ animationDelay: `${i * 1.1}s`, stroke: '#3B82F6' }} strokeWidth="1.2" />
        ))}

        {/* Broker dots */}
        {([
          [175, 215, 'London',    3], [315, 235, 'Dubai',     2], [295, 295, 'Sydney',    1],
          [360, 245, 'Singapore', 2], [145, 290, 'São Paulo', 1], [205, 195, 'Nicosia',   2],
        ] as [number, number, string, number][]).map(([x, y, name, count]) => (
          <g key={name}>
            <circle cx={x} cy={y} r={count >= 2 ? 5 : 3.5} fill={count >= 2 ? '#3B82F6' : '#10D996'} className="broker-dot"
              style={{ filter: `drop-shadow(0 0 ${count >= 2 ? 6 : 4}px ${count >= 2 ? '#3B82F6' : '#10D996'})` }} />
            {count >= 2 && <circle cx={x} cy={y} r="10" fill="none" stroke={count >= 2 ? '#3B82F6' : '#10D996'} strokeWidth="1" strokeOpacity="0.4" className="broker-dot" />}
          </g>
        ))}
      </svg>
    </div>
  );
}

function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = DeviceTier.get();

  useEffect(() => {
    let animId: number;
    let cleanup: (() => void) | undefined;

    void loadThree().then((THREE) => {
      if (!THREE || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const w = canvas.parentElement?.offsetWidth || 500;
      const h = w;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: tier === 1, powerPreference: 'low-power' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      camera.position.z = 280;

      const radius = 100;

      // Wireframe globe
      const globeGeo = new THREE.IcosahedronGeometry(radius, 4);
      const globeMat = new THREE.MeshBasicMaterial({ color: 0x3B82F6, wireframe: true, transparent: true, opacity: 0.1 });
      scene.add(new THREE.Mesh(globeGeo, globeMat));

      // Dark inner sphere
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(radius - 1, 32, 32), new THREE.MeshBasicMaterial({ color: 0x06080A, transparent: true, opacity: 0.92 })));

      // Atmosphere
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(radius + 6, 32, 32), new THREE.MeshBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0.04, side: THREE.BackSide })));

      // City dots + pulse rings
      const dotMeshes: { mesh: THREE.Object3D; phase: number; isRing?: boolean }[] = [];
      BROKER_CITIES.forEach(([lon, lat, , count]) => {
        const { x, y, z } = latLonToVec3(lat, lon, radius + 1);
        const size  = count >= 2 ? 2.8 : 2;
        const color = count >= 2 ? 0x3B82F6 : 0x10D996;
        const dot   = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), new THREE.MeshBasicMaterial({ color }));
        dot.position.set(x, y, z);
        scene.add(dot);
        dotMeshes.push({ mesh: dot, phase: Math.random() * Math.PI * 2 });

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(size + 0.5, size + 2, 16),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
        );
        ring.position.set(x, y, z);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(ring);
        dotMeshes.push({ mesh: ring, isRing: true, phase: Math.random() * Math.PI * 2 });
      });

      // Arc lines (Tier 1 only)
      const arcMats: THREE.LineBasicMaterial[] = [];
      if (tier === 1) {
        const pairs = [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4], [2, 0]];
        pairs.forEach(([a, b]) => {
          const cA = BROKER_CITIES[a], cB = BROKER_CITIES[b];
          if (!cA || !cB) return;
          const vA = new THREE.Vector3(...Object.values(latLonToVec3(cA[1], cA[0], radius + 2)) as [number, number, number]);
          const vB = new THREE.Vector3(...Object.values(latLonToVec3(cB[1], cB[0], radius + 2)) as [number, number, number]);
          const mid = vA.clone().add(vB).multiplyScalar(0.5).normalize().multiplyScalar(radius + vA.distanceTo(vB) * 0.22);
          const arcGeo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(vA, mid, vB).getPoints(48));
          const arcMat = new THREE.LineBasicMaterial({ color: 0x3B82F6, transparent: true, opacity: 0 });
          scene.add(new THREE.Line(arcGeo, arcMat));
          arcMats.push(arcMat);
        });
      }

      // Stars
      const starPos = new Float32Array(600 * 3);
      for (let i = 0; i < 600 * 3; i++) starPos[i] = (Math.random() - 0.5) * 800;
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.8, color: 0x8B95A3, transparent: true, opacity: 0.4 })));

      // Drag interaction
      let isDragging = false, prevX = 0, rotY = 0, targetRotY = 0;
      const onPointerDown = (e: PointerEvent) => { isDragging = true; prevX = e.clientX; canvas.style.cursor = 'grabbing'; };
      const onPointerUp   = () => { isDragging = false; canvas.style.cursor = 'grab'; };
      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        targetRotY += (e.clientX - prevX) * 0.005;
        prevX = e.clientX;
      };
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointermove', onPointerMove);

      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.005;
        if (!isDragging) targetRotY += 0.002;
        rotY += (targetRotY - rotY) * 0.08;

        scene.children.forEach((obj) => { if (obj !== scene.children[scene.children.length - 1]) obj.rotation.y = rotY; });

        // Pulse dot rings
        dotMeshes.forEach(({ mesh, phase, isRing }) => {
          if (isRing) {
            const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.opacity = 0.3 + Math.sin(t + phase) * 0.25;
          }
        });

        // Arc pulse (Tier 1)
        arcMats.forEach((m, i) => {
          m.opacity = Math.max(0, Math.sin(t * 0.8 + i * 1.2)) * 0.7;
        });

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nw = canvas.parentElement?.offsetWidth || 500;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nw);
      };
      window.addEventListener('resize', onResize, { passive: true });

      cleanup = () => {
        cancelAnimationFrame(animId);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    });

    return () => cleanup?.();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', cursor: 'grab' }}
    />
  );
}

const INFRA_STATS = [
  { dot: 'var(--bull)',   label: 'Active broker locations', val: '14 locations'  },
  { dot: 'var(--accent)', label: 'Countries with clients',  val: '47 countries'  },
  { dot: 'var(--warn)',   label: 'Infrastructure uptime',   val: '99.97% SLA'    },
  { dot: 'var(--purple)', label: 'Avg order latency',       val: '< 12ms global' },
];

export function GlobeSection() {
  const [loaded, setLoaded]  = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tier = DeviceTier.get();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setLoaded(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="globe" style={{ position: 'relative', background: 'var(--bg-base)', padding: '120px 0', overflow: 'hidden', borderTop: '1px solid var(--border)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 700px 500px at 50% 50%, rgba(59,130,246,.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div ref={sectionRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="tab-col">

          {/* Text */}
          <div>
            <RevealDiv style={{ marginBottom: 16 }}><span className="sec-eye">LIVE INFRASTRUCTURE</span></RevealDiv>
            <RevealDiv delay={80}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', lineHeight: 1.08, marginTop: 12, marginBottom: 20 }}>
                14 brokers.<br />47 countries.<br /><span style={{ color: 'var(--accent)' }}>One infrastructure.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={160}>
              <p style={{ fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7, marginBottom: 32, fontFamily: 'var(--font-ui)' }}>
                Every Obsidian-powered broker is live on the same global infrastructure. Sub-12ms execution in every timezone. Your clients trade. We handle the rest.
              </p>
            </RevealDiv>
            <RevealDiv delay={240} className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
              {INFRA_STATS.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.dot, boxShadow: `0 0 8px ${item.dot}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--fg2)', fontFamily: 'var(--font-ui)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--fg1)', fontWeight: 500 }}>{item.val}</span>
                </div>
              ))}
            </RevealDiv>
            <RevealDiv delay={400}>
              <button className="btn-p" style={{ padding: '12px 24px', fontSize: 14 }}>
                View Infrastructure Map <span className="arr">→</span>
              </button>
            </RevealDiv>
          </div>

          {/* Globe */}
          <div>
            {loaded ? (
              tier <= 2 ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 600, margin: '0 auto', aspectRatio: '1/1' }}>
                  <GlobeCanvas />
                  {/* City labels overlay */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {BROKER_CITIES.slice(0, 4).map(([lon, lat, name, count], i) => {
                      const px = 50 + (lon / 360) * 100;
                      const py = 50 - (lat / 180) * 100;
                      return (
                        <div key={i} style={{ position: 'absolute', left: `${Math.max(5, Math.min(85, px))}%`, top: `${Math.max(5, Math.min(90, py))}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: count >= 2 ? 10 : 7, height: count >= 2 ? 10 : 7, borderRadius: '50%', background: count >= 2 ? 'var(--accent)' : 'var(--bull)', boxShadow: `0 0 ${count >= 2 ? 12 : 8}px ${count >= 2 ? 'var(--accent)' : 'var(--bull)'}` }} />
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', whiteSpace: 'nowrap', background: 'rgba(6,8,10,.7)', padding: '1px 4px', borderRadius: 2 }}>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <GlobeSVGFallback />
              )
            ) : (
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', letterSpacing: '.08em' }}>Loading globe...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
