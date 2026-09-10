import stargazing from '../assets/images/hero-stargazing.png';
export default function GlobalBackground() { const scene = { backgroundImage: `url(${stargazing})` }; return <div className="global-background" aria-hidden="true"><div className="global-sky" style={scene} /><div className="global-flora" style={scene} /><div className="global-atmosphere" /></div>; }
