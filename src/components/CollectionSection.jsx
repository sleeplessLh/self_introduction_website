import { useState } from 'react';
import Reveal from './Reveal.jsx';
import CollectionCard from './CollectionCard.jsx';
import DetailModal from './DetailModal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function CollectionSection({ type }) {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const sectionKey = type === 'competition' ? 'competitions' : 'projects';
  const collection = content[sectionKey];
  const copy = content.sections[sectionKey];
  const singular = type === 'competition' ? 'Competition' : 'Project';
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, [sectionKey]: { ...current.sections[sectionKey], [key]: value } } }));
  const visible = expanded ? collection : collection.slice(0, 3);
  return <section className="projects-section compact-collection" id={sectionKey}><div className="projects-inner"><div className="section-label"><EditableText value={copy.label} onChange={value => setCopy('label', value)} /></div><Reveal className="projects-heading"><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><p><EditableText value={copy.description} multiline onChange={value => setCopy('description', value)} /></p></Reveal>{collection.length ? <><div className="compact-list">{visible.map(item => <Reveal key={item.id}><CollectionCard item={item} type={type} detailLabel={copy.detailLabel} onOpen={() => setSelected(item)} /></Reveal>)}</div>{collection.length > 3 && <button className="collection-toggle" onClick={() => setExpanded(value => !value)}><EditableText value={expanded ? copy.collapseLabel : copy.expandLabel} onChange={value => setCopy(expanded ? 'collapseLabel' : 'expandLabel', value)} /> <b>{expanded ? '↑' : '↓'}</b></button>}</> : <div className="empty-collection"><EditableText value={copy.emptyLabel} onChange={value => setCopy('emptyLabel', value)} />{hostMode && <button className="editor-add collection-add" onClick={() => requestEditor({ kind: type, id: null })}>+ Add {singular}</button>}</div>}</div>{selected && <DetailModal item={selected} type={type} onClose={() => setSelected(null)} />}</section>;
}
