/**
 * File:        apps/public-site/src/components/sections/OrderBookSection.tsx
 * Module:      public-site · Sections
 * Purpose:     Tier-adaptive 3D order book visualization. Tier 1: Three.js
 *              InstancedMesh bars with camera orbit and glow effects. Tier 2/3:
 *              SVG animated bar chart with live bid/ask ticks.
 *
 * Exports:
 *   - OrderBookSection()  — the order book section
 *
 * Depends on:
 *   - @/lib/device-tier   — DeviceTier
 *   - @/lib/three-loader  — loadThree()
 *
 * Side-effects:
 *   - Three.js renderer (Tier 1): rAF loop, resize listener, disposed on unmount
 *   - setInterval (1.4s) for SVG bar animation and book data ticking
 *   - IntersectionObserver lazy-loads the scene on scroll
 *
 * Key invariants:
 *   - InstancedMesh draws all 24 bars in 2 GPU draw calls (bid + ask each)
 *   - Must be 'use client' — uses browser APIs (IntersectionObserver, canvas)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { DeviceTier } from '@/lib/device-tier';
import { loadThree } from '@/lib/three-loader';
import { RevealDiv } from '@/components/ui/RevealDiv';

interface BookEntry { price: number; vol: number; }
interface BookData { bids: BookEntry[]; asks: BookEntry[]; mid: number; }

function generateOrderBook(): BookData {
  const mid = 1.08452;
  return {
    bids: Array.from({ length: 12 }, (_, i) => ({ price: +(mid - (i + 1) * 0.0001).toFixed(5), vol: Math.random() * 8 + 1 })),
    asks: Array.from({ length: 12 }, (_, i) => ({ price: +(mid + (i + 1) * 0.0001).toFixed(5), vol: Math.random() * 8 + 1 })),
    mid,
  };
}

function OrderBookSVG({ book }: { book: BookData }) {
  const maxVol = Math.max(...book.bids.map((b) => b.vol), ...book.asks.map((a) => a.vol));
  const W = 640, H = 260, barW = 22, gap = 3, barCount = 12;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {[0, 65, 130, 195, 260].map((y) => <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="#1C2028" strokeWidth=".5" />)}
      <line x1={W / 2} y1="0" x2={W / 2} y2={H} stroke="#F59E0B" strokeWidth="1" strokeOpacity=".6" />
      <text x={W / 2} y="14" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="var(--font-data)">{book.mid.toFixed(5)} MID</text>

      {book.bids.slice(0, barCount).map((bid, i) => {
        const barH = Math.max(4, (bid.vol / maxVol) * (H - 40));
        const x = W / 2 - (i + 1) * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={H - barH - 20} width={barW} height={barH} className="ob-bar ob-bid" rx="2"
              style={{ filter: 'drop-shadow(0 0 4px var(--bull))', transition: 'height .4s ease, y .4s ease' }} />
            {i < 3 && <text x={x + barW / 2} y={H - 12} textAnchor="middle" fill="var(--fg3)" fontSize="8" fontFamily="var(--font-data)">{bid.price.toFixed(4).slice(-3)}</text>}
          </g>
        );
      })}

      {book.asks.slice(0, barCount).map((ask, i) => {
        const barH = Math.max(4, (ask.vol / maxVol) * (H - 40));
        const x = W / 2 + i * (barW + gap) + gap;
        return (
          <g key={i}>
            <rect x={x} y={H - barH - 20} width={barW} height={barH} className="ob-bar ob-ask" rx="2"
              style={{ filter: 'drop-shadow(0 0 4px var(--bear))', transition: 'height .4s ease, y .4s ease' }} />
            {i < 3 && <text x={x + barW / 2} y={H - 12} textAnchor="middle" fill="var(--fg3)" fontSize="8" fontFamily="var(--font-data)">{ask.price.toFixed(4).slice(-3)}</text>}
          </g>
        );
      })}

      <circle cx="40" cy="20" r="4" fill="var(--bull)" /><text x="50" y="24" fill="var(--fg2)" fontSize="10" fontFamily="var(--font-ui)">BID depth</text>
      <circle cx="140" cy="20" r="4" fill="var(--bear)" /><text x="150" y="24" fill="var(--fg2)" fontSize="10" fontFamily="var(--font-ui)">ASK depth</text>
    </svg>
  );
}

function OrderBook3D({ book }: { book: BookData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = DeviceTier.get();

  useEffect(() => {
    let animId: number;
    let cleanup: (() => void) | undefined;

    void loadThree().then((THREE) => {
      if (!THREE || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const w = canvas.parentElement?.offsetWidth || 640;
      const h = w * (9 / 16);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: tier === 1, powerPreference: 'low-power' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.set(0, 18, 38);
      camera.lookAt(0, 0, 0);

      const grid = new THREE.GridHelper(48, 24, 0x1C2028, 0x1C2028);
      (grid.material as THREE.Material).opacity = 0.5;
      (grid.material as THREE.Material).transparent = true;
      scene.add(grid);

      const barCount = 12, barW = 1.4, barGap = 0.5;

      const bidMat = new THREE.MeshBasicMaterial({ color: 0x10D996, transparent: true, opacity: 0.85 });
      const askMat = new THREE.MeshBasicMaterial({ color: 0xFF3B5C, transparent: true, opacity: 0.85 });
      const bidMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(barW, 1, barW * 0.7), bidMat, barCount);
      const askMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(barW, 1, barW * 0.7), askMat, barCount);
      scene.add(bidMesh);
      scene.add(askMesh);

      const bidGlowMat = new THREE.MeshBasicMaterial({ color: 0x10D996, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
      const askGlowMat = new THREE.MeshBasicMaterial({ color: 0xFF3B5C, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
      const totalW = (barW + barGap) * barCount;
      const bidGlow = new THREE.Mesh(new THREE.PlaneGeometry(totalW / 2, barW * 0.8), bidGlowMat);
      bidGlow.rotation.x = -Math.PI / 2; bidGlow.position.set(-totalW / 4, 0.01, 0);
      const askGlow = new THREE.Mesh(new THREE.PlaneGeometry(totalW / 2, barW * 0.8), askGlowMat);
      askGlow.rotation.x = -Math.PI / 2; askGlow.position.set(totalW / 4, 0.01, 0);
      scene.add(bidGlow); scene.add(askGlow);

      const midLine = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
      midLine.rotation.x = -Math.PI / 2; midLine.position.set(0, 0.02, 0);
      scene.add(midLine);

      const dummy = new THREE.Object3D();
      const updateBars = (bids: BookEntry[], asks: BookEntry[]) => {
        const maxVol = Math.max(...bids.map((b) => b.vol), ...asks.map((a) => a.vol));
        bids.forEach((bid, i) => {
          const barH = Math.max(0.2, (bid.vol / maxVol) * 14);
          dummy.position.set(-(i + 0.5) * (barW + barGap), barH / 2, 0);
          dummy.scale.set(1, barH, 1); dummy.updateMatrix();
          bidMesh.setMatrixAt(i, dummy.matrix);
        });
        asks.forEach((ask, i) => {
          const barH = Math.max(0.2, (ask.vol / maxVol) * 14);
          dummy.position.set((i + 0.5) * (barW + barGap), barH / 2, 0);
          dummy.scale.set(1, barH, 1); dummy.updateMatrix();
          askMesh.setMatrixAt(i, dummy.matrix);
        });
        bidMesh.instanceMatrix.needsUpdate = true;
        askMesh.instanceMatrix.needsUpdate = true;
      };
      updateBars(book.bids, book.asks);

      let camAngle = 0, t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.005; camAngle += 0.003;
        camera.position.x = Math.sin(camAngle) * 12;
        camera.position.z = Math.cos(camAngle) * 38 + 8;
        camera.lookAt(0, 5, 0);
        bidGlowMat.opacity = 0.05 + Math.sin(t * 1.2) * 0.04;
        askGlowMat.opacity = 0.05 + Math.sin(t * 1.2 + 1) * 0.04;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const nw = canvas.parentElement?.offsetWidth || 640;
        camera.aspect = nw / (nw * 9 / 16);
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nw * 9 / 16);
      };
      window.addEventListener('resize', onResize, { passive: true });

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    });

    return () => cleanup?.();
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}

const FEATURES = ['10-level depth of market, live', 'Cumulative volume visualization', 'Price impact before you click', 'Integrates with 12+ liquidity providers'];

export function OrderBookSection() {
  const [book, setBook]     = useState<BookData>(generateOrderBook);
  const [loaded, setLoaded] = useState(false);
  const [tier, setTier]     = useState(3);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTier(DeviceTier.get()); }, []);

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

  useEffect(() => {
    if (!loaded) return;
    const iv = setInterval(() => {
      setBook((prev) => ({
        bids: prev.bids.map((b) => ({ ...b, vol: Math.max(0.3, b.vol + (Math.random() - 0.48) * 1.8) })),
        asks: prev.asks.map((a) => ({ ...a, vol: Math.max(0.3, a.vol + (Math.random() - 0.48) * 1.8) })),
        mid: +(prev.mid + (Math.random() - 0.5) * 0.00005).toFixed(5),
      }));
    }, 1400);
    return () => clearInterval(iv);
  }, [loaded]);

  return (
    <section style={{ position: 'relative', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '100px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div ref={sectionRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'center' }} className="tab-col">

          {/* Text */}
          <div>
            <RevealDiv style={{ marginBottom: 16 }}><span className="sec-eye">MARKET DEPTH</span></RevealDiv>
            <RevealDiv delay={80}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', lineHeight: 1.08, marginTop: 12, marginBottom: 20 }}>
                The depth,<br /><span style={{ color: 'var(--bull)' }}>live.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={160}>
              <p style={{ fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7, marginBottom: 28, fontFamily: 'var(--font-ui)' }}>
                10-level bid/ask ladder. Updated on every tick. See exactly where the market is sitting before you trade.
              </p>
            </RevealDiv>
            <RevealDiv delay={240} className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--bull)', fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: 15, color: 'var(--fg2)', lineHeight: 1.5, fontFamily: 'var(--font-ui)' }}>{f}</span>
                </div>
              ))}
            </RevealDiv>

            {/* Live bid/ask display */}
            <RevealDiv delay={360} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', padding: 16, borderRadius: 10, background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', letterSpacing: '.08em', marginBottom: 4 }}>BID</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 20, fontWeight: 600, color: 'var(--bull)', fontVariantNumeric: 'tabular-nums' }}>{book.mid.toFixed(5)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--warn)' }}>SPREAD</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--warn)', fontVariantNumeric: 'tabular-nums' }}>0.2</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', letterSpacing: '.08em', marginBottom: 4 }}>ASK</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 20, fontWeight: 600, color: 'var(--bear)', fontVariantNumeric: 'tabular-nums' }}>{(book.mid + 0.00002).toFixed(5)}</div>
              </div>
            </RevealDiv>
          </div>

          {/* Order book viz */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 640, margin: '0 auto', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-panel)', aspectRatio: tier === 1 ? '16/9' : undefined }}>
            {loaded ? (
              tier === 1 ? <OrderBook3D book={book} /> : <div style={{ padding: 16 }}><OrderBookSVG book={book} /></div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)' }}>Loading order book...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
