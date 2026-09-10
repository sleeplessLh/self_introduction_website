import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const toGalleryItem = image => typeof image === 'string' ? { src: image, caption: '', hidden: false } : image;
const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));

export default function DetailModal({ item, type, initialView = 'cover', achievementLabel = 'Achievement', onClose }) {
  const gallery = useMemo(() => (item.gallery || []).map(toGalleryItem).filter(image => image?.src && !image.hidden), [item.gallery]);
  const [view, setView] = useState(initialView === 'gallery' && gallery.length ? 'gallery' : 'cover');
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const drag = useRef(null);
  const stage = useRef(null);
  const cover = { src: item.coverImage, caption: 'Highlight image' };
  const active = view === 'gallery' ? gallery[index] : cover;
  const tags = item.technologies || item.tags || [];
  const resetView = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);
  const selectGallery = useCallback(nextIndex => { if (!gallery.length) return; setView('gallery'); setIndex(nextIndex); resetView(); }, [gallery.length, resetView]);
  const moveImage = useCallback(direction => {
    if (!gallery.length) return;
    setView('gallery');
    setIndex(current => (current + direction + gallery.length) % gallery.length);
    resetView();
  }, [gallery.length, resetView]);
  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 180);
  }, [closing, onClose]);
  const setScale = value => {
    const next = clamp(value, 1, 3);
    setZoom(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) stage.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const keydown = event => {
      if (event.key === 'Escape' && !document.fullscreenElement) close();
      if (event.key === 'ArrowLeft') moveImage(-1);
      if (event.key === 'ArrowRight') moveImage(1);
      if (event.key === '+' || event.key === '=') setScale(zoom + 0.25);
      if (event.key === '-') setScale(zoom - 0.25);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [close, moveImage, zoom]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const onWheel = event => { event.preventDefault(); setScale(zoom + (event.deltaY < 0 ? 0.2 : -0.2)); };
  const onPointerDown = event => {
    if (zoom <= 1 || event.target.closest('button')) return;
    drag.current = { x: event.clientX, y: event.clientY, offset };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = event => {
    if (!drag.current) return;
    setOffset({ x: drag.current.offset.x + event.clientX - drag.current.x, y: drag.current.offset.y + event.clientY - drag.current.y });
  };
  const onPointerUp = () => { drag.current = null; };

  return <div className={`detail-modal ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <button className="detail-close" onClick={close} aria-label="Close detail">×</button>
    <div className="detail-stage" ref={stage} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {active?.src ? <img src={active.src} alt={active.caption || item.title} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }} draggable="false" /> : <p className="gallery-empty">No image has been published.</p>}
      {view === 'gallery' && gallery.length > 1 && <><button className="gallery-previous" onClick={() => moveImage(-1)} aria-label="Previous image">←</button><button className="gallery-next" onClick={() => moveImage(1)} aria-label="Next image">→</button></>}
      <div className="gallery-controls"><button onClick={() => setScale(zoom - .25)} aria-label="Zoom out">−</button><button onClick={() => setScale(zoom + .25)} aria-label="Zoom in">+</button><button onClick={resetView}>Reset</button><button onClick={toggleFullscreen}>Fullscreen</button></div>
    </div>
    <div className="detail-copy"><p className="kicker">{item.label} · {item.date}</p><h2>{item.title}</h2><p>{item.description}</p>{item.details && <p className="detail-long-copy">{item.details}</p>}{type === 'competition' && <p className="achievement achievement-badge"><b>{achievementLabel}</b><span>{item.achievement || 'Add achievement or participation result'}</span></p>}<div className="detail-tags">{tags.map((tag, tagIndex) => <span key={`${tag}-${tagIndex}`}>{tag}</span>)}</div>{type === 'project' && <div className="detail-links">{item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{item.liveDemo && <a href={item.liveDemo} target="_blank" rel="noreferrer">Live demo ↗</a>}</div>}{item.galleryUrl && <div className="detail-links"><a href={item.galleryUrl} target="_blank" rel="noreferrer">External gallery ↗</a></div>}<div className="gallery-heading"><button className={view === 'cover' ? 'is-selected' : ''} onClick={() => { setView('cover'); resetView(); }}>Highlight</button><span>Gallery · {gallery.length}</span></div>{gallery.length ? <><p className="gallery-caption">{view === 'gallery' ? (active?.caption || `Image ${index + 1} of ${gallery.length}`) : 'Highlight image is managed separately from this gallery.'}</p><div className="gallery">{gallery.map((image, imageIndex) => <button className={view === 'gallery' && imageIndex === index ? 'is-selected' : ''} key={`${image.src}-${imageIndex}`} onClick={() => selectGallery(imageIndex)}><img src={image.src} alt={image.caption || `${item.title} gallery ${imageIndex + 1}`} /></button>)}</div></> : <p className="gallery-caption">No gallery images published yet. The highlight image remains separate.</p>}</div>
  </div>;
}
