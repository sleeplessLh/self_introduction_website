import { useState } from 'react';
import Reveal from './Reveal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { blankLearning } from '../data/portfolio.js';

export default function LearningJourney() {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const [expanded, setExpanded] = useState(false);
  const copy = content.sections.learning;
  const publishedEntries = content.learningJourney.filter(item => !item.hidden);
  const entries = hostMode ? content.learningJourney : (expanded ? publishedEntries : publishedEntries.slice(0, 3));
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, learning: { ...current.sections.learning, [key]: value } } }));
  const setItem = (id, key, value) => update(current => ({ ...current, learningJourney: current.learningJourney.map(item => item.id === id ? { ...item, [key]: value } : item) }));
  const addItem = () => { const item = blankLearning(); update(current => ({ ...current, learningJourney: [...current.learningJourney, item] })); requestEditor({ kind: 'learning', id: item.id }); };

  return <section className="learning-section" id="learning"><div className="section">
    <div className="section-label"><EditableText value={copy.label} onChange={value => setCopy('label', value)} /></div>
    <Reveal className="projects-heading"><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><p><EditableText value={copy.description} multiline onChange={value => setCopy('description', value)} /></p></Reveal>
    {hostMode && <div className="collection-host-bar"><span>{content.learningJourney.length} learning items</span><button className="editor-add collection-add" onClick={addItem}>+ Add Learning Item</button></div>}
    {entries.length ? <>
      <div className={`learning-list ${expanded ? 'is-expanded' : ''}`}>{entries.map(item => <Reveal key={item.id}><article className={`learning-item ${item.hidden ? 'is-hidden-host' : ''}`}><div className="learning-copy"><h3><EditableText value={item.title} onChange={value => setItem(item.id, 'title', value)} /></h3><p><EditableText value={item.description || ''} multiline onChange={value => setItem(item.id, 'description', value)} /></p></div>{hostMode && <button onClick={() => requestEditor({ kind: 'learning', id: item.id })}>Edit item ↗</button>}</article></Reveal>)}</div>
      {!hostMode && publishedEntries.length > 3 && <button className="learning-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? 'Show Less ↑' : `View All (${publishedEntries.length}) ↓`}</button>}
    </> : <p className="empty-collection"><EditableText value={copy.emptyLabel} onChange={value => setCopy('emptyLabel', value)} />{hostMode && <button className="editor-add collection-add" onClick={addItem}>+ Add Learning Item</button>}</p>}
  </div></section>;
}
