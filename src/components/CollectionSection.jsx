import { useRef, useState } from 'react';
import Reveal from './Reveal.jsx';
import CollectionCard from './CollectionCard.jsx';
import DetailModal from './DetailModal.jsx';
import GalleryModal from './GalleryModal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { blankCompetition, blankProject } from '../data/portfolio.js';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';
import { prependItem } from '../utils/collectionOrder.js';

export default function CollectionSection({ type }) {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const section = useRef(null);
  const opener = useRef(null);
  const sectionKey = type === 'competition' ? 'competitions' : 'projects';
  const visibility = useSectionVisibility(sectionKey);
  const collection = content[sectionKey];
  const copy = content.sections[sectionKey];
  const singular = type === 'competition' ? 'Competition' : 'Project';
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, [sectionKey]: { ...current.sections[sectionKey], [key]: value } } }));
  const addItem = () => {
    const item = type === 'competition' ? blankCompetition() : blankProject();
    update(current => ({ ...current, [sectionKey]: prependItem(current[sectionKey], item) }));
    requestEditor({ kind: type, id: item.id, panel: 'details' });
  };
  const toggle = () => {
    if (expanded) window.setTimeout(() => section.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    setExpanded(value => !value);
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
  return <section ref={section} className={`projects-section compact-collection ${visibility.hidden ? 'is-module-hidden-host' : ''}`} id={sectionKey}><SectionVisibilityToggle sectionKey={sectionKey} /><div className="projects-inner"><div className="section-label"><EditableText value={copy.label} onChange={value => setCopy('label', value)} /></div><Reveal className="projects-heading"><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><p><EditableText value={copy.description} multiline onChange={value => setCopy('description', value)} /></p></Reveal><div className="section-content-inset">{hostMode && <div className="collection-host-bar"><span>{collection.length} {sectionKey}</span><button className="editor-add collection-add" onClick={addItem}>+ Add {singular}</button></div>}{collection.length ? <><div className="compact-list">{collection.map((item, index) => <Reveal className={`collection-entry ${!hostMode && !expanded && index >= 3 ? 'is-collapsed' : ''}`} key={item.id}><CollectionCard item={item} type={type} detailLabel={copy.detailLabel} galleryLabel={copy.galleryLabel || 'View Gallery'} achievementLabel={copy.achievementLabel || 'Achievement'} onOpen={initialView => openSelection(item, initialView)} /></Reveal>)}</div>{!hostMode && collection.length > 3 && <button className="collection-toggle" onClick={toggle} aria-expanded={expanded}>{expanded ? copy.collapseLabel : copy.expandLabel} <b>{expanded ? '↑' : '↓'}</b></button>}</> : <div className="empty-collection"><EditableText value={copy.emptyLabel} onChange={value => setCopy('emptyLabel', value)} /></div>}</div></div>{selected?.initialView === 'gallery' ? <GalleryModal item={selected.item} onClose={closeGallery} onBack={selected.returnToDetail ? closeGallery : null} /> : selected && <DetailModal item={selected.item} type={type} achievementLabel={copy.achievementLabel || 'Achievement'} onClose={closeSelection} onOpenGallery={() => setSelected(current => current ? { ...current, initialView: 'gallery', returnToDetail: true } : current)} />}</section>;
}
