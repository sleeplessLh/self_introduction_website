import Reveal from './Reveal.jsx';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function About() {
  const { content, update } = usePortfolio();
  const { profile, about } = content;
  const setProfile = (key, value) => update(current => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const setAbout = (key, value) => update(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const setList = (list, index, key, value) => update(current => ({ ...current, about: { ...current.about, [list]: current.about[list].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) } }));
  return <section className="section about" id="about">
    <div className="section-label"><EditableText value={about.label} onChange={value => setAbout('label', value)} /></div>
    <div className="about-layout about-without-portrait"><div className="about-copy"><Reveal><p className="kicker"><EditableText value={about.kicker} onChange={value => setAbout('kicker', value)} /></p><h2><EditableText value={about.title} onChange={value => setAbout('title', value)} /><br /><em><EditableText value={about.emphasis} onChange={value => setAbout('emphasis', value)} /></em></h2><p><EditableText value={profile.bio} multiline onChange={value => setProfile('bio', value)} /></p></Reveal><Reveal className="about-meta"><div><small><EditableText value={about.educationLabel} onChange={value => setAbout('educationLabel', value)} /></small><strong><EditableText value={profile.education} onChange={value => setProfile('education', value)} /></strong></div><div><small><EditableText value={about.contactLabel} onChange={value => setAbout('contactLabel', value)} /></small><a href={`mailto:${profile.email}`}><EditableText value={profile.email} onChange={value => setProfile('email', value)} /> ↗</a></div>{profile.languages?.length > 0 && <div><small>LANGUAGES</small><strong>{profile.languages.map((language, index) => <EditableText key={`${language}-${index}`} value={language} onChange={value => setProfile('languages', profile.languages.map((item, itemIndex) => itemIndex === index ? value : item))} />)}</strong></div>}</Reveal></div></div>
    <div className="fact-strip">{about.stats.map((item, index) => <Reveal key={item.id}><article><span><EditableText value={item.number} onChange={value => setList('stats', index, 'number', value)} /></span><small><EditableText value={item.label} onChange={value => setList('stats', index, 'label', value)} /></small><p><EditableText value={item.value} onChange={value => setList('stats', index, 'value', value)} /></p></article></Reveal>)}</div>
  </section>;
}
