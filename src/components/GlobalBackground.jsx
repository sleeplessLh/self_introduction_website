import stargazing from '../assets/images/hero-stargazing.png';
export default function GlobalBackground() { return <div className="global-background" aria-hidden="true"><div className="global-scene" style={{ backgroundImage: `url(${stargazing})` }} /><div className="global-stars" /><div className="global-atmosphere" /></div>; }
