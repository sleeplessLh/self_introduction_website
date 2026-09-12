import { usePortfolio } from '../context/PortfolioContext.jsx';
import EditableText from '../editor/EditableText.jsx';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const moveEntry = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function CollectionCard({ item, type, onOpen, detailLabel, galleryLabel, achievementLabel }) {
  const { content, update, hostMode, requestEditor } = usePortfolio();
  const collectionKey = type === 'competition' ? 'competitions' : 'projects';
  const labelKey = type === 'competition' ? 'tags' : 'technologies';
  const labels = item[labelKey] || [];
  const updateItem = (key, value) => update(current => ({ ...current, [collectionKey]: current[collectionKey].map(entry => entry.id === item.id ? { ...entry, [key]: value } : entry) }));
  const edit = () => requestEditor({ kind: type, id: item.id, panel: 'details' });
  const editGallery = event => { event.preventDefault(); event.stopPropagation(); requestEditor({ kind: type, id: item.id, panel: 'gallery' }); };
  const itemIndex = content[collectionKey].findIndex(entry => entry.id === item.id);
  const move = direction => update(current => ({ ...current, [collectionKey]: moveEntry(current[collectionKey], current[collectionKey].findIndex(entry => entry.id === item.id), direction) }));
  const remove = () => { if (window.confirm(`Delete ${item.title}?`)) update(current => ({ ...current, [collectionKey]: current[collectionKey].filter(entry => entry.id !== item.id) })); };
  const primaryAction = hostMode ? edit : () => onOpen('cover');
  const visibleGalleryCount = (item.gallery || []).filter(image => typeof image === 'string' || !image.hidden).length;
  const normalisedLabels = labels.map(entry => typeof entry === 'string' ? { id: uid(), label: entry } : entry);
  const setLabels = next => updateItem(labelKey, next);

  return <article id={`${type}-${item.id}`} className={`collection-card ${hostMode ? 'is-host-editable' : ''}`}>
    <button className="collection-cover" onClick={primaryAction} aria-label={hostMode ? `Edit ${item.title}` : `Open ${item.title}`}>{item.coverImage ? <img src={item.coverImage} alt="" loading="lazy" style={{ objectPosition: item.coverPosition || '50% 50%' }} /> : <div className="collection-cover-empty">No highlight image</div>}<span>{hostMode ? 'Edit' : <EditableText value={item.date} onChange={value => updateItem('date', value)} />}</span></button>
    <div className="collection-info">
      <p className="project-category"><EditableText value={item.label} onChange={value => updateItem('label', value)} /></p>
      <h3><EditableText value={item.title} onChange={value => updateItem('title', value)} /></h3>
      <p className="collection-description"><EditableText value={item.description} multiline onChange={value => updateItem('description', value)} /></p>
      {type === 'competition' && <p className="achievement"><b>{achievementLabel}</b><span><EditableText value={item.achievement || ''} onChange={value => updateItem('achievement', value)} /></span></p>}
      <div className="collection-meta">
        {hostMode ? <button className="gallery-link" onClick={editGallery}>Edit Gallery</button> : <button className="gallery-link" onClick={() => onOpen('gallery')}>{galleryLabel} {visibleGalleryCount ? `(${visibleGalleryCount})` : ''} ↗</button>}
        <div className={`collection-tags ${hostMode ? 'host-label-manager' : ''}`}>{normalisedLabels.map((entry, index) => hostMode ? <span className="host-label-row" key={entry.id}>
          <EditableText value={entry.label} onChange={value => setLabels(normalisedLabels.map(label => label.id === entry.id ? { ...label, label: value } : label))} />
          <button onClick={() => setLabels(moveEntry(normalisedLabels, index, -1))} disabled={index === 0} aria-label={`Move ${entry.label} earlier`}>←</button>
          <button onClick={() => setLabels(moveEntry(normalisedLabels, index, 1))} disabled={index === normalisedLabels.length - 1} aria-label={`Move ${entry.label} later`}>→</button>
          <button className="danger" onClick={() => setLabels(normalisedLabels.filter(label => label.id !== entry.id))} aria-label={`Delete ${entry.label}`}>×</button>
        </span> : <span key={entry.id}>{entry.label}</span>)}{hostMode && <button className="add-inline-label" onClick={() => setLabels([...normalisedLabels, { id: uid(), label: 'New label' }])}>+ Add Label</button>}</div>
      </div>
      {hostMode ? <><button className="card-open host-card-edit" onClick={edit}>Edit {type} details ↗</button><div className="host-card-actions"><button onClick={() => move(-1)} disabled={itemIndex === 0}>Move up</button><button onClick={() => move(1)} disabled={itemIndex === content[collectionKey].length - 1}>Move down</button><button className="danger" onClick={remove}>Delete</button></div></> : <div className="collection-links">{type === 'project' && item.github && <a href={item.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{type === 'project' && item.liveDemo && <a href={item.liveDemo} target="_blank" rel="noreferrer">Demo ↗</a>}{item.galleryUrl && <a href={item.galleryUrl} target="_blank" rel="noreferrer">External gallery ↗</a>}<button className="card-open" onClick={() => onOpen('cover')}>{detailLabel} ↗</button></div>}
    </div>
  </article>;
}
