import { useEffect, useRef, useState } from 'react';

export default function Reveal({ children, className = '' }) {
  const ref = useRef(null); const [shown, setShown] = useState(false);
  useEffect(() => { const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), { threshold: 0.12 }); observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return <div ref={ref} className={`reveal ${shown ? 'is-visible' : ''} ${className}`}>{children}</div>;
}
