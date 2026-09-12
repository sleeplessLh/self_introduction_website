import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));

export default function GalleryModal({ item, onClose }) {
  const gallery = useMemo(() => (item.gallery || []).map(image => typeof image === 'string' ? { id: image, src: image, caption: '', hidden: false } : image).filter(image => image?.src && !image.hidden), [item.gallery]);
  const [index, setIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const stage = useRef(null);
  const drag = useRef(null);
  const active = index === null ? null : gallery[index];
  const resetView = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const select = useCallback(next => { if (!gallery.length) return; setIndex((next + gallery.length) % gallery.length); resetView(); }, [gallery.length, resetView]);
  const closeViewer = useCallback(() => { setIndex(null); resetView(); }, [resetView]);
  const close = useCallback(() => { if (closing) return; setClosing(true); window.setTimeout(onClose, 180); }, [closing, onClose]);
  const setScale = value => { const next = clamp(value, 1, 4); setZoom(next); if (next === 1) setOffset({ x: 0, y: 0 }); };
  const toggleFullscreen = () => { if (!document.fullscreenElement) stage.current?.requestFullscreen?.(); else document.exitFullscreen?.(); };

  useEffect(() => {
    const keydown = event => {
      if (event.key === 'Escape') { if (document.fullscreenElement) document.exitFullscreen?.(); else if (index !== null) closeViewer(); else close(); }
      if (index !== null && event.key === 'ArrowLeft') select(index - 1);
      if (index !== null && event.key === 'ArrowRight') select(index + 1);
      if (index !== null && (event.key === '+' || event.key === '=')) setScale(zoom + .25);
      if (index !== null && event.key === '-') setScale(zoom - .25);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [close, closeViewer, index, select, zoom]);
  useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);

  return <div className={`detail-modal gallery-grid-modal ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${item.title} gallery`} data-gallery-owner={item.id} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <button className="detail-close" onClick={close} aria-label="Close gallery">×</button>
    <header className="gallery-modal-header"><div><p>EXCLUSIVE GALLERY</p><h2>{item.title}</h2></div><span>{gallery.length} image{gallery.length === 1 ? '' : 's'}</span></header>
    {gallery.length ? <div className="gallery-photo-grid">{gallery.map((image, imageIndex) => <figure key={image.id}><button onClick={() => { setIndex(imageIndex); resetView(); }} aria-label={`Open image ${imageIndex + 1}${image.caption ? `: ${image.caption}` : ''}`}><img src={image.src} alt={image.caption || `${item.title} gallery image ${imageIndex + 1}`} loading="lazy" /></button>{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div> : <div className="gallery-empty-state"><strong>No gallery images yet.</strong><span>This Gallery is separate from the Highlight Image.</span></div>}
    {item.galleryUrl && <a className="gallery-external-link" href={item.galleryUrl} target="_blank" rel="noreferrer">Open external gallery ↗</a>}
    {active && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`${item.title} image viewer`} onMouseDown={event => { if (event.target === event.currentTarget) closeViewer(); }}>
      <button className="gallery-lightbox-close" onClick={closeViewer} aria-label="Close image viewer">×</button>
      <div className="detail-stage" ref={stage} onWheel={event => { event.preventDefault(); setScale(zoom + (event.deltaY < 0 ? .2 : -.2)); }} onPointerDown={event => { if (zoom <= 1 || event.target.closest('button')) return; drag.current = { x: event.clientX, y: event.clientY, offset }; event.currentTarget.setPointerCapture?.(event.pointerId); }} onPointerMove={event => { if (drag.current) setOffset({ x: drag.current.offset.x + event.clientX - drag.current.x, y: drag.current.offset.y + event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }}>
        <img src={active.src} alt={active.caption || `${item.title} gallery image ${index + 1}`} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }} draggable="false" />
        {gallery.length > 1 && <><button className="gallery-previous" onClick={() => select(index - 1)} aria-label="Previous image">←</button><button className="gallery-next" onClick={() => select(index + 1)} aria-label="Next image">→</button></>}
        <div className="gallery-controls"><button onClick={() => setScale(zoom - .25)} aria-label="Zoom out">−</button><button onClick={() => setScale(zoom + .25)} aria-label="Zoom in">+</button><button onClick={resetView}>Reset</button><button onClick={toggleFullscreen}>Fullscreen</button></div>
      </div>
      <div className="gallery-viewer-footer"><p>{active.caption || `Image ${index + 1} of ${gallery.length}`}</p><div className="gallery-viewer-thumbnails">{gallery.map((image, imageIndex) => <button className={imageIndex === index ? 'is-selected' : ''} key={image.id} onClick={() => select(imageIndex)} aria-label={`Select image ${imageIndex + 1}`}><img src={image.src} alt="" /></button>)}</div></div>
    </div>}
  </div>;
}
