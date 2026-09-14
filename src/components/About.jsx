import Reveal from './Reveal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { blankAboutItem } from '../data/portfolio.js';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';

const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function About() {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const { profile, about } = content;
  const visibility = useSectionVisibility('about');
  const items = hostMode ? about.items : about.items.filter(item => !item.hidden);
  const setProfile = (key, value) => update(current => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const setAbout = (key, value) => update(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const setItems = value => setAbout('items', value);
  const setItem = (id, key, value) => setItems(about.items.map(item => item.id === id ? { ...item, [key]: value } : item));
  const addItem = () => { const item = blankAboutItem(); setItems([...about.items, item]); requestEditor({ kind: 'about', id: item.id }); };

  if (!visibility.shouldRender) return null;
  return <section className={`section about ${visibility.hidden ? 'is-module-hidden-host' : ''}`} id="about"><SectionVisibilityToggle sectionKey="about" />
    <div className="section-label"><EditableText value={about.label} onChange={value => setAbout('label', value)} /></div>
    <Reveal className="about-intro"><p className="kicker"><EditableText value={about.kicker} onChange={value => setAbout('kicker', value)} /></p><h2><EditableText value={about.title} onChange={value => setAbout('title', value)} /><br /><em><EditableText value={about.emphasis} onChange={value => setAbout('emphasis', value)} /></em></h2><p><EditableText value={profile.bio} multiline onChange={value => setProfile('bio', value)} /></p></Reveal>
    {hostMode && <div className="collection-host-bar"><span>{about.items.length} About items</span><button className="editor-add collection-add" onClick={addItem}>+ Add About Item</button></div>}
    <div className="about-item-list">{items.map((item, visibleIndex) => {
      const sourceIndex = about.items.findIndex(entry => entry.id === item.id);
      return <Reveal key={item.id}><article className={item.hidden ? 'is-hidden-host' : ''} data-about-id={item.id}><span>{String(visibleIndex + 1).padStart(2, '0')}</span><div><h3><EditableText value={item.title} onChange={value => setItem(item.id, 'title', value)} /></h3><p><EditableText value={item.description} multiline onChange={value => setItem(item.id, 'description', value)} /></p></div>{hostMode && <div className="about-inline-actions"><button onClick={() => requestEditor({ kind: 'about', id: item.id })}>Edit ↗</button><button onClick={() => setItems(move(about.items, sourceIndex, -1))} disabled={sourceIndex === 0}>↑</button><button onClick={() => setItems(move(about.items, sourceIndex, 1))} disabled={sourceIndex === about.items.length - 1}>↓</button><button onClick={() => setItem(item.id, 'hidden', !item.hidden)}>{item.hidden ? 'Show' : 'Hide'}</button></div>}</article></Reveal>;
    })}</div>
  </section>;
}
