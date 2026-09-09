import { socialLinks } from '../data/portfolio.js';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function Contact() {
  const { profile } = usePortfolio();
  return <section className="contact" id="contact"><div><p className="eyebrow">AVAILABLE FOR THE NEXT INTERESTING PROBLEM</p><h2>Let&apos;s make<br /><em>something matter.</em></h2><a className="button" href={`mailto:${profile.email}`}>Get in touch <b>↗</b></a></div><footer><div><span>© {new Date().getFullYear()} {profile.name}</span><span>{profile.location}</span></div><div className="socials"><a href={`mailto:${profile.email}`}>{profile.email}</a>{Object.values(socialLinks).map(link => <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}<a href={profile.resumeUrl}>Resume ↗</a></div></footer></section>;
}
