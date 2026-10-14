import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CollectionCard from './CollectionCard.jsx';
import { galleryCount, ringRadius, signedDistance, wrapIndex } from '../utils/ringCarousel.js';

const canRenderWebGL = () => {
  try { return Boolean(document.createElement('canvas').getContext('webgl2')); }
  catch { return false; }
};

function RingCard({ item, index, count, radius, angle, activeIndex, type, compact, onFocus }) {
  const group = useRef();
  const [texture, setTexture] = useState(null);
  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 224;
    const context = canvas.getContext('2d');
    context.fillStyle = type === 'competition' ? '#241b23' : '#0b1622';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = type === 'competition' ? '#ffad91' : '#9af3e2';
    context.font = '600 27px monospace';
    context.fillText(String(item.date || '').slice(0, 22), 38, 53);
    context.fillStyle = '#f1f2ed';
    context.font = '600 56px Arial, sans-serif';
    let title = String(item.title || 'Untitled');
    while (context.measureText(title).width > 690 && title.length > 4) title = `${title.slice(0, -2)}…`;
    context.fillText(title, 38, 145);
    context.fillStyle = '#a6b3ba';
    context.font = '400 23px monospace';
    context.fillText(String(item.label || '').slice(0, 42), 38, 193);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [item.title, item.date, item.label, type]);
  const distance = signedDistance(index, activeIndex, count);
  const visible = Math.abs(distance) <= Math.min(3, Math.floor(count / 2));
  useEffect(() => {
    if (!item.coverImage || !visible || compact) { setTexture(null); return undefined; }
    let live = true;
    const loader = new THREE.TextureLoader();
    loader.load(item.coverImage, loaded => {
      if (!live) { loaded.dispose(); return; }
      loaded.colorSpace = THREE.SRGBColorSpace;
      const imageRatio = loaded.image.width / loaded.image.height;
      const planeRatio = 1.72 / 2.3;
      if (imageRatio > planeRatio) {
        loaded.repeat.x = planeRatio / imageRatio;
        loaded.offset.x = (1 - loaded.repeat.x) / 2;
      } else {
        loaded.repeat.y = imageRatio / planeRatio;
        loaded.offset.y = (1 - loaded.repeat.y) / 2;
      }
      setTexture(loaded);
    }, undefined, () => { if (live) setTexture(null); });
    return () => { live = false; };
  }, [item.coverImage, visible, compact]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useEffect(() => () => labelTexture.dispose(), [labelTexture]);
  useFrame(() => {
    if (group.current) group.current.rotation.y = -angle.current;
  });
  const theta = index * Math.PI * 2 / Math.max(count, 1);
  const focused = distance === 0;
  const depthScale = compact ? .55 : Math.abs(distance) === 1 ? .82 : .68;
  const sideTexture = compact ? null : texture;
  return <group ref={group} position={[Math.sin(theta) * radius, 0, Math.cos(theta) * radius]} scale={depthScale} visible={visible && !focused}>
    <mesh position={[0, .15, -.035]} onClick={event => { event.stopPropagation(); onFocus(index); }}>
      <planeGeometry args={[1.78, 2.36]} />
      <meshBasicMaterial color={type === 'competition' ? '#ff9473' : '#86f5df'} transparent opacity={.75} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, .15, 0]} onClick={event => { event.stopPropagation(); onFocus(index); }}>
      <planeGeometry args={[1.72, 2.3]} />
      <meshBasicMaterial color={sideTexture ? '#858f9c' : type === 'competition' ? '#2d2630' : '#1a2735'} map={sideTexture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
    <mesh position={[0, -.75, .012]} onClick={event => { event.stopPropagation(); onFocus(index); }}>
      <planeGeometry args={[1.72, .5]} />
      <meshBasicMaterial map={labelTexture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  </group>;
}

function RingScene({ items, activeIndex, type, onFocus, reducedMotion }) {
  const root = useRef();
  const compact = useThree(state => state.size.width < 600);
  const angle = useRef(0);
  const count = items.length;
  const radius = useMemo(() => ringRadius(count), [count]);
  const target = -activeIndex * Math.PI * 2 / Math.max(count, 1);
  useFrame((state, delta) => {
    const shortest = Math.atan2(Math.sin(target - angle.current), Math.cos(target - angle.current));
    angle.current = reducedMotion ? angle.current + shortest : THREE.MathUtils.damp(angle.current, angle.current + shortest, 5.5, delta);
    if (root.current) root.current.rotation.y = angle.current;
    if (Math.abs(shortest) > .001) state.invalidate();
  });
  return <>
    <ambientLight intensity={1.35} />
    <pointLight position={[0, 5, 5]} intensity={24} color={type === 'competition' ? '#ff9473' : '#86f5df'} />
    <group ref={root}>
      {count > 2 && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.84, 0]}>
        <torusGeometry args={[radius, .012, 4, Math.max(64, count * 12)]} />
        <meshBasicMaterial color={type === 'competition' ? '#ff9473' : '#86f5df'} transparent opacity={.5} />
      </mesh>}
      {items.map((item, index) => <RingCard key={item.id} item={item} index={index} count={count} radius={radius} angle={angle} activeIndex={activeIndex} type={type} compact={compact} onFocus={onFocus} />)}
    </group>
  </>;
}

export default function RingCarousel({ items, activeIndex, setActiveIndex, type, onOpen, detailLabel, galleryLabel, achievementLabel }) {
  const [webgl] = useState(canRenderWebGL);
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [nearViewport, setNearViewport] = useState(false);
  const stage = useRef(null);
  const gesture = useRef(null);
  const suppress = useRef(false);
  const count = items.length;
  const active = items[activeIndex] || items[0];
  useEffect(() => {
    if (!stage.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), { rootMargin: '300px 0px' });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const singular = type === 'competition' ? 'Competition' : 'Project';
  const focus = index => setActiveIndex(wrapIndex(index, count));
  const onPointerDown = event => { if (event.button !== 0 && event.pointerType === 'mouse') return; gesture.current = { x: event.clientX, y: event.clientY }; };
  const onPointerUp = event => {
    if (!gesture.current) return;
    const distance = event.clientX - gesture.current.x;
    gesture.current = null;
    if (Math.abs(distance) < 36) return;
    suppress.current = true;
    focus(activeIndex + (distance < 0 ? 1 : -1));
    window.setTimeout(() => { suppress.current = false; }, 120);
  };
  const open = (item, view) => { if (!suppress.current) onOpen(item, view); };
  if (!webgl) return <div className="ring-fallback" aria-label={`${singular} gallery`}>
    {items.map(item => <CollectionCard key={item.id} item={item} type={type} detailLabel={detailLabel} galleryLabel={galleryLabel} achievementLabel={achievementLabel} onOpen={view => open(item, view)} />)}
  </div>;
  return <div ref={stage} className="ring-carousel" role="region" aria-roledescription="carousel" aria-label={`${singular} 3D carousel`} tabIndex={0}
    onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight') { event.preventDefault(); focus(activeIndex + 1); } else if (event.key === 'ArrowLeft') { event.preventDefault(); focus(activeIndex - 1); } else if (event.key === 'Home') { event.preventDefault(); focus(0); } else if (event.key === 'End') { event.preventDefault(); focus(count - 1); } }}
    onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { gesture.current = null; }}>
    {nearViewport && <Canvas className="ring-canvas" frameloop="demand" camera={{ position: [0, 2.6, Math.max(9.4, ringRadius(count) + 6.7)], fov: 42, near: .1, far: 110 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
      <RingScene items={items} activeIndex={activeIndex} type={type} onFocus={focus} reducedMotion={reducedMotion} />
    </Canvas>}
    {count === 2 && <button type="button" className="ring-pair-preview" onClick={() => focus(1 - activeIndex)} aria-label={`Focus ${items[1 - activeIndex].title}`}>
      {items[1 - activeIndex].coverImage && <img src={items[1 - activeIndex].coverImage} alt="" draggable="false" />}
      <small>{items[1 - activeIndex].date || 'Explore'}</small><strong>{items[1 - activeIndex].title}</strong><span>Rotate to view →</span>
    </button>}
    {active && <div className="ring-active-card" data-ring-owner={active.id}>
      <article className="collection-card">
        <button type="button" className="collection-cover" onClick={() => open(active, 'cover')} aria-label={`Open ${active.title}`}>
          {active.coverImage ? <img src={active.coverImage} alt="" draggable="false" style={{ objectPosition: active.coverPosition || '50% 50%' }} /> : <div className="collection-cover-empty"><small>{String(activeIndex + 1).padStart(2, '0')} / {type}</small><strong>{active.title}</strong><em>No highlight image uploaded</em></div>}
          <span>{active.date}</span>
        </button>
        <div className="collection-info">
          <p className="project-category">{active.label}</p>
          <h3>{active.title}</h3>
          <p className="collection-description">{active.description}</p>
          {type === 'competition' && active.achievement && <p className="achievement"><b>{achievementLabel}</b><span>{active.achievement}</span></p>}
          <div className="collection-meta">
            {galleryCount(active) ? <button type="button" className="gallery-link" onClick={() => open(active, 'gallery')}>{galleryLabel} ({galleryCount(active)}) ↗</button> : <span className="gallery-empty-label">No gallery images yet</span>}
            <div className="collection-tags">{(active[type === 'competition' ? 'tags' : 'technologies'] || []).slice(0, 3).map((entry, position) => <span key={entry.id || position}>{typeof entry === 'string' ? entry : entry.label}</span>)}</div>
          </div>
          <div className="collection-links"><button type="button" className="card-open" onClick={() => open(active, 'cover')}>{detailLabel} ↗</button></div>
        </div>
      </article>
    </div>}
    <p className="ring-instruction">Drag to orbit · use arrows to explore · select a card for details</p>
    <div className="ring-accessible-list" aria-label={`All ${singular.toLowerCase()} entries`}>
      {items.map((item, index) => <button key={item.id} type="button" onClick={() => focus(index)} aria-current={index === activeIndex ? 'true' : undefined}>{String(index + 1).padStart(2, '0')} {item.title}{galleryCount(item) ? ` · ${galleryCount(item)} gallery images` : ''}</button>)}
    </div>
  </div>;
}
