import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Reveal from './Reveal.jsx';
import CollectionCard from './CollectionCard.jsx';
import DetailModal from './DetailModal.jsx';
import GalleryModal from './GalleryModal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { blankCompetition, blankProject } from '../data/portfolio.js';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';
import { prependItem } from '../utils/collectionOrder.js';
import { wrapIndex } from '../utils/ringCarousel.js';

const RingCarousel = lazy(() => import('./RingCarousel.jsx'));

export default function CollectionSection({ type }) {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const [selected, setSelected] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const section = useRef(null);
  const opener = useRef(null);
  const openerScroll = useRef(0);
  const sectionKey = type === 'competition' ? 'competitions' : 'projects';
  const visibility = useSectionVisibility(sectionKey);
  const collection = content[sectionKey];
  const copy = content.sections[sectionKey];
  const singular = type === 'competition' ? 'Competition' : 'Project';
  const activeId = useRef(collection[0]?.id);
  const isGrid = hostMode || viewAll;

  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, [sectionKey]: { ...current.sections[sectionKey], [key]: value } } }));
  const addItem = () => {
    const item = type === 'competition' ? blankCompetition() : blankProject();
    update(current => ({ ...current, [sectionKey]: prependItem(current[sectionKey], item) }));
    requestEditor({ kind: type, id: item.id, panel: 'details' });
  };

  const goTo = index => {
    const next = wrapIndex(index, collection.length);
    activeId.current = collection[next]?.id;
    setActiveIndex(next);
  };
  useEffect(() => {
    const matching = collection.findIndex(item => item.id === activeId.current);
    if (matching >= 0) setActiveIndex(matching);
    else { activeId.current = collection[0]?.id; setActiveIndex(0); }
  }, [collection]);

  const closeSelection = () => {
    setSelected(null);
    window.setTimeout(() => {
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
      window.scrollTo(0, openerScroll.current);
    }, 0);
  };
  const openSelection = (item, initialView) => {
    opener.current = document.activeElement;
    openerScroll.current = window.scrollY;
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
              {!isGrid && <div className="carousel-arrows"><button type="button" onClick={() => goTo(activeIndex - 1)} disabled={collection.length < 2} aria-label={`Previous ${singular.toLowerCase()}`}>←</button><button type="button" onClick={() => goTo(activeIndex + 1)} disabled={collection.length < 2} aria-label={`Next ${singular.toLowerCase()}`}>→</button></div>}
              <button type="button" className="collection-toggle collection-view-switch" onClick={() => setViewAll(value => !value)} aria-expanded={viewAll}><strong>{viewAll ? 'Carousel View' : `View All (${collection.length})`}</strong><small>{viewAll ? copy.collapseLabel : copy.expandLabel}</small></button>
            </div>
          </div>}
          {isGrid ? <div className="compact-list is-grid-view">{collection.map(item => <Reveal className="collection-entry" key={item.id}><CollectionCard item={item} type={type} detailLabel={copy.detailLabel} galleryLabel={copy.galleryLabel || 'View Gallery'} achievementLabel={copy.achievementLabel || 'Achievement'} onOpen={initialView => openSelection(item, initialView)} /></Reveal>)}</div>
            : <Suspense fallback={<div className="ring-loading" aria-live="polite">Preparing the {singular.toLowerCase()} exhibition…</div>}><RingCarousel items={collection} activeIndex={activeIndex} setActiveIndex={goTo} type={type} onOpen={openSelection} detailLabel={copy.detailLabel} galleryLabel={copy.galleryLabel || 'View Gallery'} achievementLabel={copy.achievementLabel || 'Achievement'} /></Suspense>}
          {!isGrid && collection.length > 1 && <div className="carousel-indicators" aria-label={`${singular} slides`}>{collection.map((item, index) => <button key={item.id} type="button" className={index === activeIndex ? 'is-active' : ''} onClick={() => goTo(index)} aria-label={`Go to ${singular.toLowerCase()} ${index + 1}: ${item.title}`} aria-current={index === activeIndex ? 'true' : undefined}><span /></button>)}</div>}
        </> : <div className="empty-collection"><EditableText value={copy.emptyLabel} onChange={value => setCopy('emptyLabel', value)} /></div>}
      </div>
    </div>
    {selected?.initialView === 'gallery' ? <GalleryModal item={selected.item} onClose={closeGallery} onBack={selected.returnToDetail ? closeGallery : null} /> : selected && <DetailModal item={selected.item} type={type} achievementLabel={copy.achievementLabel || 'Achievement'} onClose={closeSelection} onOpenGallery={() => setSelected(current => current ? { ...current, initialView: 'gallery', returnToDetail: true } : current)} />}
  </section>;
}
