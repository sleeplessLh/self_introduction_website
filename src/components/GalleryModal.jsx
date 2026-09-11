import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));

export default function GalleryModal({ item, onClose }) {
  const gallery = useMemo(() => (item.gallery || []).map(image => typeof image === 'string' ? { id: image, src: image, caption: '', hidden: false } : image).filter(image => image?.src && !image.hidden), [item.gallery]);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const stage = useRef(null);
  const drag = useRef(null);
  const active = gallery[index];
  const resetView = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const select = useCallback(next => { if (!gallery.length) return; setIndex((next + gallery.length) % gallery.length); resetView(); }, [gallery.length, resetView]);
  const close = useCallback(() => { if (closing) return; setClosing(true); window.setTimeout(onClose, 180); }, [closing, onClose]);
  const setScale = value => { const next = clamp(value, 1, 3); setZoom(next); if (next === 1) setOffset({ x: 0, y: 0 }); };
  const toggleFullscreen = () => { if (!document.fullscreenElement) stage.current?.requestFullscreen?.(); else document.exitFullscreen?.(); };

  useEffect(() => {
    const keydown = event => { if (event.key === 'Escape' && !document.fullscreenElement) close(); if (event.key === 'ArrowLeft') select(index - 1); if (event.key === 'ArrowRight') select(index + 1); if (event.key === '+' || event.key === '=') setScale(zoom + .25); if (event.key === '-') setScale(zoom - .25); };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [close, index, select, zoom]);
  useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);

  return <div className={`detail-modal gallery-only-modal ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${item.title} gallery`} data-gallery-owner={item.id} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <button className="detail-close" onClick={close} aria-label="Close gallery">×</button>
    <header className="gallery-modal-header"><p>EXCLUSIVE GALLERY</p><h2>{item.title}</h2><span>{gallery.length} image{gallery.length === 1 ? '' : 's'}</span></header>
    <div className="detail-stage" ref={stage} onWheel={event => { event.preventDefault(); setScale(zoom + (event.deltaY < 0 ? .2 : -.2)); }} onPointerDown={event => { if (zoom <= 1 || event.target.closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, offset }; event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerMove={event => { if (drag.current) setOffset({ x: drag.current.offset.x + event.clientX - drag.current.x, y: drag.current.offset.y + event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }}>
      {active ? <img src={active.src} alt={active.caption || `${item.title} gallery image ${index + 1}`} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }} draggable="false" /> : <div className="gallery-empty-state"><strong>No gallery images yet.</strong><span>This Gallery is separate from the Highlight Image.</span></div>}
      {gallery.length > 1 && <><button className="gallery-previous" onClick={() => select(index - 1)} aria-label="Previous image">←</button><button className="gallery-next" onClick={() => select(index + 1)} aria-label="Next image">→</button></>}
      {active && <div className="gallery-controls"><button onClick={() => setScale(zoom - .25)} aria-label="Zoom out">−</button><button onClick={() => setScale(zoom + .25)} aria-label="Zoom in">+</button><button onClick={resetView}>Reset</button><button onClick={toggleFullscreen}>Fullscreen</button></div>}
    </div>
    <div className="gallery-modal-strip"><p>{active?.caption || (active ? `Image ${index + 1} of ${gallery.length}` : 'No published images')}</p>{gallery.length > 0 && <div className="gallery">{gallery.map((image, imageIndex) => <button className={imageIndex === index ? 'is-selected' : ''} key={image.id} onClick={() => select(imageIndex)}><img src={image.src} alt={image.caption || `Thumbnail ${imageIndex + 1}`} /></button>)}</div>}{item.galleryUrl && <a href={item.galleryUrl} target="_blank" rel="noreferrer">Open external gallery ↗</a>}</div>
  </div>;
}
