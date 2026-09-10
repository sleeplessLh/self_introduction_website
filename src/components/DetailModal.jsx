import { useEffect, useMemo, useRef, useState } from 'react';

const toGalleryItem = image => typeof image === 'string' ? { src: image, caption: '' } : image;
const clamp = (number, minimum, maximum) => Math.min(maximum, Math.max(minimum, number));

export default function DetailModal({ item, type, onClose }) {
  const gallery = useMemo(() => [{ src: item.coverImage, caption: 'Highlight image' }, ...(item.gallery || []).map(toGalleryItem)].filter(image => image?.src), [item]);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const drag = useRef(null);
  const stage = useRef(null);
  const active = gallery[index] || gallery[0];
  const tags = item.technologies || item.tags || [];
  const moveImage = direction => {
    setIndex(current => (current + direction + gallery.length) % gallery.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 180);
  };
  const setScale = value => {
    setZoom(current => clamp(value ?? current, 1, 3));
    if ((value ?? zoom) <= 1) setOffset({ x: 0, y: 0 });
  };
  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) stage.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const keydown = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') moveImage(-1);
      if (event.key === 'ArrowRight') moveImage(1);
      if (event.key === '+' || event.key === '=') setScale(zoom + 0.25);
      if (event.key === '-') setScale(zoom - 0.25);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  const onWheel = event => {
    event.preventDefault();
    setScale(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
  };
  const onPointerDown = event => {
    if (zoom <= 1) return;
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
      <img src={active?.src} alt={active?.caption || item.title} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }} draggable="false" />
      {gallery.length > 1 && <><button className="gallery-previous" onClick={() => moveImage(-1)} aria-label="Previous image">←</button><button className="gallery-next" onClick={() => moveImage(1)} aria-label="Next image">→</button></>}
      <div className="gallery-controls"><button onClick={() => setScale(zoom - .25)} aria-label="Zoom out">−</button><button onClick={() => setScale(zoom + .25)} aria-label="Zoom in">+</button><button onClick={resetView}>Reset</button><button onClick={toggleFullscreen}>Fullscreen</button></div>
    </div>
    <div className="detail-copy"><p className="kicker">{item.label} · {item.date}</p><h2>{item.title}</h2><p>{item.description}</p>{item.details && <p className="detail-long-copy">{item.details}</p>}{type === 'competition' && <p className="achievement"><b>Achievement</b><span>{item.achievement || 'Add achievement or participation result'}</span></p>}<div className="detail-tags">{tags.map((tag, tagIndex) => <span key={`${tag}-${tagIndex}`}>{tag}</span>)}</div>{type === 'project' && <div className="detail-links">{item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{item.liveDemo && <a href={item.liveDemo} target="_blank" rel="noreferrer">Live demo ↗</a>}</div>}<p className="gallery-caption">{active?.caption || `Image ${index + 1} of ${gallery.length}`}</p><div className="gallery">{gallery.map((image, imageIndex) => <button className={imageIndex === index ? 'is-selected' : ''} key={`${image.src}-${imageIndex}`} onClick={() => { setIndex(imageIndex); resetView(); }}><img src={image.src} alt={image.caption || `${item.title} gallery ${imageIndex + 1}`} /></button>)}</div></div>
  </div>;
}
