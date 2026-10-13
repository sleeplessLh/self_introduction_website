import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ParticleField({ compact }) {
  const points = useRef();
  const positions = useMemo(() => {
    const count = compact ? 90 : 240;
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 4 + Math.random() * 9;
      const angle = Math.random() * Math.PI * 2;
      values[index * 3] = Math.cos(angle) * radius;
      values[index * 3 + 1] = (Math.random() - .5) * 11;
      values[index * 3 + 2] = Math.sin(angle) * radius - 2;
    }
    return values;
  }, [compact]);
  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * .012;
  });
  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#9bf6e4" size={compact ? .018 : .024} sizeAttenuation transparent opacity={.48} depthWrite={false} />
  </points>;
}

function OrbitalCore({ compact, reducedMotion, contentFocus, aboutFocus }) {
  const root = useRef();
  const core = useRef();
  const ringA = useRef();
  const ringB = useRef();
  const scroll = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.current = window.scrollY / maximum;
    };
    const onPointer = event => {
      pointer.current.x = (event.clientX / window.innerWidth - .5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - .5) * 2;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  useFrame((state, delta) => {
    if (!root.current || !core.current) return;
    const progress = scroll.current;
    const targetX = aboutFocus ? (compact ? 2.3 : 5.3) : contentFocus ? (compact ? 1.65 : 3.45) : compact ? .72 : 2.45 - Math.sin(progress * Math.PI * 3.2) * 1.25;
    const targetY = aboutFocus ? -2.1 : contentFocus ? .65 : compact ? 1.25 - progress * .55 : .15 + Math.sin(progress * Math.PI * 4) * .72;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, targetX, 2.2, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY, 2.2, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, reducedMotion ? .1 : pointer.current.y * .18 + progress * .28, 2.4, delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, reducedMotion ? -.25 : pointer.current.x * .26 + progress * Math.PI * 1.8, 2.4, delta);
    if (!reducedMotion) {
      core.current.rotation.x += delta * .07;
      core.current.rotation.y += delta * .11;
      if (ringA.current) ringA.current.rotation.z += delta * .09;
      if (ringB.current) ringB.current.rotation.x -= delta * .075;
    }
    const pulse = 1 + Math.sin(state.clock.elapsedTime * .7) * (reducedMotion ? 0 : .025);
    root.current.scale.setScalar((contentFocus ? .58 : compact ? .7 : 1) * pulse);
  });

  return <group ref={root} position={[compact ? .72 : 2.4, compact ? 1.25 : .15, -1.1]}>
    <Float speed={reducedMotion ? 0 : .75} rotationIntensity={reducedMotion ? 0 : .18} floatIntensity={reducedMotion ? 0 : .25}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.28, compact ? 2 : 4]} />
        <MeshDistortMaterial color="#6b57ff" emissive="#17103f" emissiveIntensity={.75} roughness={.24} metalness={.62} distort={reducedMotion ? 0 : .22} speed={1.1} transparent opacity={.86} />
      </mesh>
      <mesh ref={ringA} rotation={[1.18, .15, .24]}>
        <torusGeometry args={[1.82, .022, 12, 180]} />
        <meshBasicMaterial color="#83f5dc" transparent opacity={.82} />
      </mesh>
      <mesh ref={ringB} rotation={[.35, .85, 1.12]}>
        <torusGeometry args={[2.12, .012, 10, 180]} />
        <meshBasicMaterial color="#ff9a78" transparent opacity={.5} />
      </mesh>
      <mesh rotation={[.2, .1, 0]}>
        <torusKnotGeometry args={[1.58, .018, 220, 12, 2, 5]} />
        <meshBasicMaterial color="#e9e5ff" transparent opacity={.3} />
      </mesh>
      {[[-2.2, .7, -.4], [2.35, -.55, .3], [-1.2, -2.05, -.2], [1.15, 1.98, -.6]].map((position, index) => <mesh key={index} position={position} rotation={[index * .7, index * .5, index]}>
        <octahedronGeometry args={[index % 2 ? .12 : .08, 0]} />
        <meshStandardMaterial color={index % 2 ? '#ff9a78' : '#8ff7e1'} emissive={index % 2 ? '#7a2517' : '#13564a'} emissiveIntensity={1.2} roughness={.3} />
      </mesh>)}
    </Float>
  </group>;
}

function Scene({ compact, reducedMotion, contentFocus, aboutFocus }) {
  return <>
    <ambientLight intensity={.42} />
    <directionalLight color="#a8fff0" intensity={2.5} position={[4, 5, 6]} />
    <pointLight color="#7664ff" intensity={18} distance={9} position={[2, -1, 2]} />
    <pointLight color="#ff8d6b" intensity={10} distance={8} position={[-4, 2, 1]} />
    <ParticleField compact={compact} />
    <OrbitalCore compact={compact} reducedMotion={reducedMotion} contentFocus={contentFocus} aboutFocus={aboutFocus} />
  </>;
}

export default function SpatialExperience() {
  const reducedMotion = useReducedMotion();
  const [compact, setCompact] = useState(() => window.innerWidth <= 800);
  const [available, setAvailable] = useState(() => supportsWebGL());
  const [contentFocus, setContentFocus] = useState(false);
  const [aboutFocus, setAboutFocus] = useState(false);
  useEffect(() => {
    const resize = () => setCompact(window.innerWidth <= 800);
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    const update = () => {
      const midpoint = window.innerHeight * .5;
      const active = ['about', 'education', 'skills', 'projects', 'competitions', 'learning', 'strengths', 'contact'].find(id => {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        return rect && rect.top <= midpoint && rect.bottom >= midpoint;
      });
      setContentFocus(Boolean(active));
      setAboutFocus(active === 'about');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div className={`spatial-experience ${available ? 'is-webgl' : 'is-fallback'} ${contentFocus ? 'is-content-focus' : ''} ${aboutFocus ? 'is-about-focus' : ''}`} aria-hidden="true">
    <div className="spatial-fallback"><i /><i /><i /></div>
    {available && <SceneBoundary onFailure={() => setAvailable(false)}><Canvas
      camera={{ position: [0, 0, compact ? 9.2 : 7.4], fov: compact ? 48 : 42, near: .1, far: 50 }}
      dpr={compact ? 1 : [1, 1.5]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      gl={{ antialias: !compact, alpha: true, powerPreference: 'high-performance' }}
    ><Scene compact={compact} reducedMotion={reducedMotion} contentFocus={contentFocus} aboutFocus={aboutFocus} /></Canvas></SceneBoundary>}
  </div>;
}
