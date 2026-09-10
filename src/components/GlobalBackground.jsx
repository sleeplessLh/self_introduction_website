import stargazing from '../assets/images/hero-stargazing.png';
const flowers = ['a', 'b', 'c', 'd', 'e'];
export default function GlobalBackground() { return <div className="global-background" aria-hidden="true"><div className="global-scene" style={{ backgroundImage: `url(${stargazing})` }} /><div className="global-stars" /><div className="global-atmosphere" /><div className="wind-flowers">{flowers.map(name => <i key={name} className={`wind-flower flower-${name}`}><b /><em /><strong /></i>)}</div></div>; }
