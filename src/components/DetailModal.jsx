import { useCallback, useEffect, useRef, useState } from 'react';

const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));

export default function DetailModal({ item, type, achievementLabel = 'Achievement', onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const drag = useRef(null);
  const stage = useRef(null);
  const tags = (item.technologies || item.tags || []).map(entry => typeof entry === 'string' ? { id: entry, label: entry } : entry);
  const resetView = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const close = useCallback(() => { if (closing) return; setClosing(true); window.setTimeout(onClose, 180); }, [closing, onClose]);
  const setScale = value => { const next = clamp(value, 1, 3); setZoom(next); if (next === 1) setOffset({ x: 0, y: 0 }); };
  const toggleFullscreen = () => { if (!document.fullscreenElement) stage.current?.requestFullscreen?.(); else document.exitFullscreen?.(); };

  useEffect(() => {
    const keydown = event => { if (event.key === 'Escape' && !document.fullscreenElement) close(); if (event.key === '+' || event.key === '=') setScale(zoom + .25); if (event.key === '-') setScale(zoom - .25); };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [close, zoom]);
  useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);

  return <div className={`detail-modal detail-only-modal ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${item.title} details`} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <button className="detail-close" onClick={close} aria-label="Close details">×</button>
    <div className="detail-stage" ref={stage} onWheel={event => { event.preventDefault(); setScale(zoom + (event.deltaY < 0 ? .2 : -.2)); }} onPointerDown={event => { if (zoom <= 1 || event.target.closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, offset }; event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerMove={event => { if (drag.current) setOffset({ x: drag.current.offset.x + event.clientX - drag.current.x, y: drag.current.offset.y + event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }}>
      {item.coverImage ? <img src={item.coverImage} alt={`${item.title} highlight`} style={{ objectPosition: item.coverPosition || '50% 50%', transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }} draggable="false" /> : <p className="gallery-empty">No highlight image has been published.</p>}
      <div className="gallery-controls"><button onClick={() => setScale(zoom - .25)} aria-label="Zoom out">−</button><button onClick={() => setScale(zoom + .25)} aria-label="Zoom in">+</button><button onClick={resetView}>Reset</button><button onClick={toggleFullscreen}>Fullscreen</button></div>
    </div>
    <div className="detail-copy"><p className="kicker">{item.label} · {item.date}</p><h2>{item.title}</h2><p>{item.description}</p>{item.details && <p className="detail-long-copy">{item.details}</p>}{type === 'competition' && <p className="achievement achievement-badge"><b>{achievementLabel}</b><span>{item.achievement || 'Add achievement or participation result'}</span></p>}<div className="detail-tags">{tags.map(tag => <span key={tag.id}>{tag.label}</span>)}</div>{type === 'project' && <div className="detail-links">{item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{item.liveDemo && <a href={item.liveDemo} target="_blank" rel="noreferrer">Live demo ↗</a>}</div>}</div>
  </div>;
}
