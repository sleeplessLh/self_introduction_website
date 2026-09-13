import { useEffect, useRef, useState } from 'react';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenu = useRef(null);
  const { content, update, hostMode, setHostMode } = usePortfolio();
  const setInitials = value => update(current => ({ ...current, profile: { ...current.profile, initials: value } }));
  const setNav = (index, value) => update(current => ({ ...current, navigation: current.navigation.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) }));
  const setHero = (key, value) => update(current => ({ ...current, hero: { ...current.hero, [key]: value } }));
  const openHost = () => { setMoreOpen(false); window.dispatchEvent(new CustomEvent('portfolio:host-access')); };
  const exitHost = () => { setMoreOpen(false); setHostMode(false); window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`); };
  useEffect(() => {
    const close = event => { if (event.key === 'Escape' || (moreMenu.current && !moreMenu.current.contains(event.target))) setMoreOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  return <header className="navbar"><a className="brand" href="#home" aria-label="Home"><EditableText value={content.profile.initials} onChange={setInitials} /><i>.</i></a><nav className={open ? 'open' : ''} aria-label="Main navigation">{content.navigation.map((link, index) => <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}><EditableText value={link.label} onChange={value => setNav(index, value)} /></a>)}</nav><a className="nav-contact" href={`mailto:${content.profile.email}`}><EditableText value={content.hero.primaryLabel} onChange={value => setHero('primaryLabel', value)} /> <span>↗</span></a><div className="nav-more" ref={moreMenu}><button className="more-button" onClick={() => setMoreOpen(value => !value)} aria-label="More options" aria-expanded={moreOpen} aria-haspopup="menu">⋯</button>{moreOpen && <div className="more-menu" role="menu"><button role="menuitem" onClick={hostMode ? exitHost : openHost}>{hostMode ? '↪ Exit Host Mode' : '▣ Host Access'}</button></div>}</div><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><span /><span /></button></header>;
}
