import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function Contact() {
  const { content, update } = usePortfolio();
  const { profile, contact, sections } = content;
  const copy = sections.contact;
  const setProfile = (key, value) => update(current => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, contact: { ...current.sections.contact, [key]: value } } }));
  const setContact = (key, value) => update(current => ({ ...current, contact: { ...current.contact, [key]: value } }));
  return <section className="contact" id="contact"><div><p className="eyebrow"><EditableText value={copy.eyebrow} onChange={value => setCopy('eyebrow', value)} /></p><h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2><a className="button" href={`mailto:${profile.email}`}><EditableText value={copy.ctaLabel} onChange={value => setCopy('ctaLabel', value)} /> <b>↗</b></a></div><footer><div><span><EditableText value={contact.footerPrefix || '©'} onChange={value => setContact('footerPrefix', value)} /> {new Date().getFullYear()} <EditableText value={profile.name} onChange={value => setProfile('name', value)} /></span><span><EditableText value={profile.location} onChange={value => setProfile('location', value)} /></span></div><div className="socials"><a href={`mailto:${profile.email}`}><EditableText value={profile.email} onChange={value => setProfile('email', value)} /></a>{contact.socialLinks.map((link, index) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer"><EditableText value={link.label} onChange={value => setContact('socialLinks', contact.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item))} /> ↗</a>)}<a href={profile.resumeUrl}><EditableText value={contact.resumeLabel || 'Resume'} onChange={value => setContact('resumeLabel', value)} /> ↗</a></div></footer></section>;
}
