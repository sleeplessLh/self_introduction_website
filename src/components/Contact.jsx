import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { gmailComposeUrl, openEmail } from '../utils/contactLinks.js';
import SectionVisibilityToggle, { useSectionVisibility } from '../editor/SectionVisibilityToggle.jsx';

export default function Contact() {
  const { content, update } = usePortfolio();
  const { profile, contact, sections } = content;
  const copy = sections.contact;
  const visibility = useSectionVisibility('contact');
  const setProfile = (key, value) => update(current => ({ ...current, profile: { ...current.profile, [key]: value } }));
  const setCopy = (key, value) => update(current => ({ ...current, sections: { ...current.sections, contact: { ...current.sections.contact, [key]: value } } }));
  const setContact = (key, value) => update(current => ({ ...current, contact: { ...current.contact, [key]: value } }));
  const social = (link, index) => link.url
    ? <a key={link.id} href={link.url} target="_blank" rel="noreferrer"><EditableText value={link.label} onChange={value => setContact('socialLinks', contact.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item))} /> ↗</a>
    : <span className="unconfigured-link" key={link.id}><EditableText value={link.label} onChange={value => setContact('socialLinks', contact.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item))} /></span>;

  if (!visibility.shouldRender) return null;
  return <section className={`contact ${visibility.hidden ? 'is-module-hidden-host' : ''}`} id="contact"><SectionVisibilityToggle sectionKey="contact" />
    <div className="contact-inner">
      <p className="eyebrow"><EditableText value={copy.eyebrow} onChange={value => setCopy('eyebrow', value)} /></p>
      <h2><EditableText value={copy.title} onChange={value => setCopy('title', value)} /><br /><em><EditableText value={copy.emphasis} onChange={value => setCopy('emphasis', value)} /></em></h2>
      <div className="contact-actions"><a className="button contact-button" href={gmailComposeUrl(profile.email)} onClick={event => openEmail(event, profile.email)}><EditableText value={copy.ctaLabel} onChange={value => setCopy('ctaLabel', value)} /> <b>↗</b></a></div>
    </div>
    <footer>
      <div><span><EditableText value={contact.footerPrefix || '©'} onChange={value => setContact('footerPrefix', value)} /> {new Date().getFullYear()} <EditableText value={profile.name} onChange={value => setProfile('name', value)} /></span><span><EditableText value={profile.location} onChange={value => setProfile('location', value)} /></span></div>
      <div className="socials"><a href={gmailComposeUrl(profile.email)} onClick={event => openEmail(event, profile.email)}>Email ↗</a>{contact.socialLinks.map(social)}{profile.resumeUrl && profile.resumeUrl !== '#' ? <a href={profile.resumeUrl} target="_blank" rel="noreferrer"><EditableText value={contact.resumeLabel || 'Resume'} onChange={value => setContact('resumeLabel', value)} /> ↗</a> : <span className="unconfigured-link"><EditableText value={contact.resumeLabel || 'Resume'} onChange={value => setContact('resumeLabel', value)} /></span>}</div>
    </footer>
  </section>;
}
