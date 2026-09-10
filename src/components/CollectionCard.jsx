import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function CollectionCard({ item, type, onOpen, detailLabel }) {
  const { hostMode } = usePortfolio();
  const labels = item.technologies || item.tags || [];
  const edit = () => window.dispatchEvent(new CustomEvent('portfolio:edit', { detail: { kind: type, id: item.id } }));
  const primaryAction = hostMode ? edit : onOpen;
  return <article className={`collection-card ${hostMode ? 'is-host-editable' : ''}`}>
    <button className="collection-cover" onClick={primaryAction} aria-label={hostMode ? `Edit ${item.title}` : `Open ${item.title}`}><img src={item.coverImage} alt="" loading="lazy" /><span>{hostMode ? 'Edit' : item.date}</span></button>
    <div className="collection-info"><p className="project-category">{item.label}</p><h3>{item.title}</h3><p className="collection-description">{item.description}</p>{type === 'competition' && <p className="achievement"><b>Achievement</b><span>{item.achievement || 'Add achievement or participation result'}</span></p>}<div className="collection-meta"><button className="gallery-link" onClick={hostMode ? edit : onOpen}>{hostMode ? 'Edit gallery & labels' : `Gallery ${item.gallery?.length ? `(${item.gallery.length})` : ''} ↗`}</button><div className="collection-tags">{labels.map(label => <span key={label}>{label}</span>)}</div></div>{hostMode ? <button className="card-open host-card-edit" onClick={edit}>Edit {type} ↗</button> : type === 'project' && <div className="collection-links">{item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{item.liveDemo && <a href={item.liveDemo} target="_blank" rel="noreferrer">Demo ↗</a>}{!item.github && !item.liveDemo && <button className="card-open" onClick={onOpen}>{detailLabel} ↗</button>}</div>}</div>
  </article>;
}
