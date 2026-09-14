import { useEffect, useRef, useState } from 'react';
import EditableText from '../editor/EditableText.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { gmailComposeUrl } from '../utils/contactLinks.js';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const moreMenu = useRef(null);
  const lastScrollY = useRef(0);
  const { content, update, hostMode, hostSession, setHostMode, requestHostAccess } = usePortfolio();
  const setInitials = value => update(current => ({ ...current, profile: { ...current.profile, initials: value } }));
  const setNav = (index, value) => update(current => ({ ...current, navigation: current.navigation.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) }));
  const setHero = (key, value) => update(current => ({ ...current, hero: { ...current.hero, [key]: value } }));
  const closeMore = () => { if (moreMenu.current) moreMenu.current.open = false; };
  const openHost = () => { closeMore(); requestHostAccess(); };
  const exitHost = async () => { closeMore(); await fetch('/api/host/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {}); setHostMode(false); window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`); };

  useEffect(() => {
    const close = event => { if (event.key === 'Escape' || (moreMenu.current?.open && !moreMenu.current.contains(event.target))) closeMore(); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);

  useEffect(() => {
    let ticking = false;
    const updateVisibility = () => {
      const nextY = Math.max(0, window.scrollY);
      const delta = nextY - lastScrollY.current;
      if (open || nextY < 28) setHidden(false);
      else if (delta > 12) setHidden(true);
      else if (delta < -12) setHidden(false);
      if (Math.abs(delta) > 12 || nextY < 28) lastScrollY.current = nextY;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(updateVisibility); } };
    const onPointerMove = event => { if (event.clientY <= 18) setHidden(false); };
    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointerMove); };
  }, [open]);

  return <header className={`navbar ${hidden ? 'is-hidden' : ''} ${open ? 'menu-open' : ''}`}>
    <a className="brand" href="#home" aria-label="Home"><EditableText value={content.profile.initials} onChange={setInitials} /><i>.</i></a>
    <nav className={open ? 'open' : ''} aria-label="Main navigation">{content.navigation.map((link, index) => <a key={link.id} href={`#${link.id}`} onClick={() => setOpen(false)}><EditableText value={link.label} onChange={value => setNav(index, value)} /></a>)}</nav>
    <a className="nav-contact" href={gmailComposeUrl(content.profile.email)} target="_blank" rel="noreferrer"><EditableText value={content.hero.primaryLabel} onChange={value => setHero('primaryLabel', value)} /> <span>↗</span></a>
    <details className="nav-more" ref={moreMenu}><summary className="more-button" role="button" aria-label="More options">⋯</summary><div className="more-menu" role="menu"><button role="menuitem" onClick={hostSession ? exitHost : openHost}>{hostSession ? '↪ Exit Host Mode' : '▣ Host Access'}</button></div></details>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><span /><span /></button>
  </header>;
}
