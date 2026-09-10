import Reveal from './Reveal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function Strengths() {
  const { content, update } = usePortfolio();
  const copy = content.sections.strengths;
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, strengths: { ...current.sections.strengths, [key]: value } } }));
  const setItem = (id, key, value) => update(current => ({ ...current, strengths: current.strengths.map(item => item.id === id ? { ...item, [key]: value } : item) }));
  return <section className="section strengths" id="strengths"><div className="section-label"><EditableText value={copy.label} onChange={value => setCopy('label', value)} /></div><Reveal className="strengths-intro"><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><p><EditableText value={copy.description} multiline onChange={value => setCopy('description', value)} /></p></Reveal><div className="strength-grid">{content.strengths.map(item => <Reveal key={item.id}><article><span><EditableText value={item.number} onChange={value => setItem(item.id, 'number', value)} /></span><h3><EditableText value={item.title} onChange={value => setItem(item.id, 'title', value)} /></h3><p><EditableText value={item.description} multiline onChange={value => setItem(item.id, 'description', value)} /></p><b>↗</b></article></Reveal>)}</div></section>;
}
