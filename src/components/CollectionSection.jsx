import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal.jsx';
import CollectionCard from './CollectionCard.jsx';
import DetailModal from './DetailModal.jsx';
import GalleryModal from './GalleryModal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { blankCompetition, blankProject } from '../data/portfolio.js';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';
import { prependItem } from '../utils/collectionOrder.js';

const clamp = (value, maximum) => Math.max(0, Math.min(value, maximum));

export default function CollectionSection({ type }) {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const [selected, setSelected] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const section = useRef(null);
  const track = useRef(null);
  const opener = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const sectionKey = type === 'competition' ? 'competitions' : 'projects';
  const visibility = useSectionVisibility(sectionKey);
  const collection = content[sectionKey];
  const copy = content.sections[sectionKey];
  const singular = type === 'competition' ? 'Competition' : 'Project';
  const itemIds = collection.map(item => item.id).join('|');
  const isGrid = hostMode || viewAll;

  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, [sectionKey]: { ...current.sections[sectionKey], [key]: value } } }));
  const addItem = () => {
    const item = type === 'competition' ? blankCompetition() : blankProject();
    update(current => ({ ...current, [sectionKey]: prependItem(current[sectionKey], item) }));
    requestEditor({ kind: type, id: item.id, panel: 'details' });
  };

  const nearestIndex = element => {
    if (!element) return 0;
    const center = element.scrollLeft + element.clientWidth / 2;
    return [...element.children].reduce((nearest, child, index, children) =>
      Math.abs(child.offsetLeft + child.clientWidth / 2 - center) < Math.abs(children[nearest].offsetLeft + children[nearest].clientWidth / 2 - center) ? index : nearest, 0);
  };
  const goTo = (index, behavior = 'smooth') => {
    const element = track.current;
    const next = clamp(index, collection.length - 1);
    setActiveIndex(next);
    const card = element?.children[next];
    if (card) element.scrollTo({ left: card.offsetLeft + card.clientWidth / 2 - element.clientWidth / 2, behavior });
  };

  useEffect(() => {
    setActiveIndex(0);
    if (track.current) track.current.scrollLeft = 0;
  }, [itemIds]);
  useEffect(() => {
    if (hostMode || viewAll) return;
    const frame = requestAnimationFrame(() => goTo(activeIndex, 'instant'));
    return () => cancelAnimationFrame(frame);
  }, [hostMode, viewAll]);

  const startDrag = event => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
  };
  const moveDrag = event => {
    if (!drag.current) return;
    const distance = event.clientX - drag.current.x;
    if (Math.abs(distance) <= 6 && !drag.current.moved) return;
    event.preventDefault();
    drag.current.moved = true;
    if (!dragging) setDragging(true);
    event.currentTarget.scrollLeft = drag.current.left - distance;
  };
  const endDrag = (event, allowClickSuppression = true) => {
    if (drag.current?.moved) {
      suppressClick.current = allowClickSuppression;
      const next = nearestIndex(event.currentTarget);
      window.setTimeout(() => goTo(next), 0);
    }
    drag.current = null;
    setDragging(false);
  };

  const closeSelection = () => {
    setSelected(null);
    window.setTimeout(() => opener.current?.isConnected && opener.current.focus(), 0);
  };
  const openSelection = (item, initialView) => {
    opener.current = document.activeElement;
    setSelected({ item, initialView, returnToDetail: false });
  };
  const closeGallery = () => {
    if (selected?.returnToDetail) setSelected(current => current ? { ...current, initialView: 'cover', returnToDetail: false } : current);
    else closeSelection();
  };

  if (!visibility.shouldRender) return null;
  return <section ref={section} className={`projects-section compact-collection ${visibility.hidden ? 'is-module-hidden-host' : ''}`} id={sectionKey}>
    <SectionVisibilityToggle sectionKey={sectionKey} />
    <div className="projects-inner">
      <div className="section-label"><EditableText value={copy.label} onChange={value => setCopy('label', value)} /></div>
      <Reveal className="projects-heading"><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><p><EditableText value={copy.description} multiline onChange={value => setCopy('description', value)} /></p></Reveal>
      <div className="section-content-inset">
        {hostMode && <div className="collection-host-bar"><span>{collection.length} {sectionKey}</span><button className="editor-add collection-add" onClick={addItem}>+ Add {singular}</button></div>}
        {collection.length ? <>
          {!hostMode && <div className="carousel-toolbar">
            <div className="carousel-progress" aria-live="polite"><span>{String(activeIndex + 1).padStart(2, '0')}</span><i aria-hidden="true" /><span>{String(collection.length).padStart(2, '0')}</span><small>{isGrid ? 'Complete archive' : `${singular} in focus`}</small></div>
            <div className="carousel-toolbar-actions">
              {!isGrid && <div className="carousel-arrows"><button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label={`Previous ${singular.toLowerCase()}`}>←</button><button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === collection.length - 1} aria-label={`Next ${singular.toLowerCase()}`}>→</button></div>}
              <button type="button" className="collection-toggle collection-view-switch" onClick={() => setViewAll(value => !value)} aria-expanded={viewAll}><strong>{viewAll ? 'Carousel View' : `View All (${collection.length})`}</strong><small>{viewAll ? copy.collapseLabel : copy.expandLabel}</small></button>
            </div>
          </div>}
          <div ref={track} className={`compact-list ${isGrid ? 'is-grid-view' : 'is-carousel-view'} ${dragging ? 'is-dragging' : ''} ${collection.length === 1 ? 'is-single' : ''}`} role={!isGrid ? 'region' : undefined} aria-roledescription={!isGrid ? 'carousel' : undefined} aria-label={!isGrid ? `${singular} carousel` : undefined} tabIndex={!isGrid ? 0 : undefined}
            onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === 'ArrowRight') { event.preventDefault(); goTo(activeIndex + 1); } else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(activeIndex - 1); } else if (event.key === 'Home') { event.preventDefault(); goTo(0); } else if (event.key === 'End') { event.preventDefault(); goTo(collection.length - 1); } }}
            onScroll={!isGrid ? event => { if (!drag.current) setActiveIndex(nearestIndex(event.currentTarget)); } : undefined}
            onMouseDown={!isGrid ? startDrag : undefined} onMouseMove={!isGrid ? moveDrag : undefined} onMouseUp={!isGrid ? event => endDrag(event) : undefined} onMouseLeave={!isGrid ? event => endDrag(event, false) : undefined}
            onClickCapture={!isGrid ? event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } } : undefined}>
            {collection.map((item, index) => <Reveal className={`collection-entry ${!isGrid && index === activeIndex ? 'is-active' : ''}`} key={item.id}><CollectionCard item={item} type={type} detailLabel={copy.detailLabel} galleryLabel={copy.galleryLabel || 'View Gallery'} achievementLabel={copy.achievementLabel || 'Achievement'} onOpen={initialView => openSelection(item, initialView)} /></Reveal>)}
          </div>
          {!isGrid && collection.length > 1 && <div className="carousel-indicators" aria-label={`${singular} slides`}>{collection.map((item, index) => <button key={item.id} type="button" className={index === activeIndex ? 'is-active' : ''} onClick={() => goTo(index)} aria-label={`Go to ${singular.toLowerCase()} ${index + 1}: ${item.title}`} aria-current={index === activeIndex ? 'true' : undefined}><span /></button>)}</div>}
        </> : <div className="empty-collection"><EditableText value={copy.emptyLabel} onChange={value => setCopy('emptyLabel', value)} /></div>}
      </div>
    </div>
    {selected?.initialView === 'gallery' ? <GalleryModal item={selected.item} onClose={closeGallery} onBack={selected.returnToDetail ? closeGallery : null} /> : selected && <DetailModal item={selected.item} type={type} achievementLabel={copy.achievementLabel || 'Achievement'} onClose={closeSelection} onOpenGallery={() => setSelected(current => current ? { ...current, initialView: 'gallery', returnToDetail: true } : current)} />}
  </section>;
}
