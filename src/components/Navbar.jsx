import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

const links = [['Home', 'home'], ['About', 'about'], ['Projects', 'projects'], ['Strengths', 'strengths'], ['Contact', 'contact']];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { profile } = usePortfolio();
  return <header className="navbar"><a className="brand" href="#home" aria-label="Home">{profile.initials}<i>.</i></a><nav className={open ? 'open' : ''} aria-label="Main navigation">{links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav><a className="nav-contact" href={`mailto:${profile.email}`}>Let&apos;s talk <span>↗</span></a><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}><span /><span /></button></header>;
}
