import { useState } from 'react';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { content, update } = usePortfolio();
  const setInitials = value => update(current => ({ ...current, profile: { ...current.profile, initials: value } }));
  const setNav = (index, value) => update(current => ({ ...current, navigation: current.navigation.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) }));
  const setHero = (key, value) => update(current => ({ ...current, hero: { ...current.hero, [key]: value } }));
  const openHost = () => window.dispatchEvent(new CustomEvent('portfolio:host-access'));
  return <header className="navbar"><a className="brand" href="#home" aria-label="Home"><EditableText value={content.profile.initials} onChange={setInitials} /><i>.</i></a><button className="host-entry" onClick={openHost} aria-label="Open Host access" title="Host access"><span /></button><nav className={open ? 'open' : ''} aria-label="Main navigation">{content.navigation.map((link, index) => <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}><EditableText value={link.label} onChange={value => setNav(index, value)} /></a>)}</nav><a className="nav-contact" href={`mailto:${content.profile.email}`}><EditableText value={content.hero.primaryLabel} onChange={value => setHero('primaryLabel', value)} /> <span>↗</span></a><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><span /><span /></button></header>;
}
