import { ImageField, TagField, TextField } from './EditorField.jsx';

const move = (list, index, direction) => {
  const next = [...list];
  const target = index + direction;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function CollectionEditor({ title, items, create, updateItems, kind, activeId, onActiveChange }) {
  const select = id => onActiveChange?.(id);
  const updateItem = (index, key, value) => updateItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const add = () => { const item = create(); updateItems([...items, item]); select(item.id); };
  const remove = index => {
    if (!window.confirm(`Delete this ${kind}?`)) return;
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    updateItems(next);
    select(next[Math.max(0, index - 1)]?.id || null);
  };

  return <div className="collection-editor">
    <p className="editor-help">Select an item below to edit it. Changes remain a draft until you press Save.</p>
    <button className="editor-add" onClick={add}>+ Add {title}</button>
    {items.map((item, index) => {
      const expanded = activeId === item.id || (!activeId && index === 0);
      return <article key={item.id} className={`editor-item ${expanded ? 'is-active' : ''}`}>
        <div className="editor-item-top"><button className="editor-item-select" onClick={() => select(expanded ? null : item.id)}><strong>{title} {index + 1}</strong><span>{item.title || `Untitled ${title}`}</span></button><span><button onClick={() => updateItems(move(items, index, -1))} aria-label={`Move ${title} ${index + 1} up`}>↑</button><button onClick={() => updateItems(move(items, index, 1))} aria-label={`Move ${title} ${index + 1} down`}>↓</button><button className="danger" onClick={() => remove(index)}>Delete</button></span></div>
        {expanded && <div className="editor-item-fields">
          <TextField label="Title" value={item.title} onChange={value => updateItem(index, 'title', value)} />
          <TextField label="Label" value={item.label || item.category} onChange={value => updateItem(index, kind === 'learning experience' ? 'category' : 'label', value)} />
          <TextField label={kind === 'learning experience' ? 'Period' : 'Date'} value={item.period || item.date} onChange={value => updateItem(index, kind === 'learning experience' ? 'period' : 'date', value)} />
          {kind === 'learning experience' ? <><TextField label="Learning status" value={item.status} onChange={value => updateItem(index, 'status', value)} /><TextField label="Summary" value={item.summary} multiline onChange={value => updateItem(index, 'summary', value)} /><TagField label="Topics" values={item.topics} onChange={value => updateItem(index, 'topics', value)} /><TagField label="Technologies" values={item.technologies} onChange={value => updateItem(index, 'technologies', value)} /><TagField label="Resources" values={item.resources} onChange={value => updateItem(index, 'resources', value)} /><TextField label="Notes" value={item.notes} multiline onChange={value => updateItem(index, 'notes', value)} /></> : <><TextField label="Description" value={item.description} multiline onChange={value => updateItem(index, 'description', value)} />{kind === 'competition' && <TextField label="Achievement" value={item.achievement || ''} onChange={value => updateItem(index, 'achievement', value)} />}<ImageField label="Replace highlight image" value={item.coverImage} onChange={value => value && updateItem(index, 'coverImage', value)} /><TagField label="Labels / knowledge points" values={kind === 'project' ? item.technologies : item.tags} onChange={value => updateItem(index, kind === 'project' ? 'technologies' : 'tags', value)} />{kind === 'project' && <><TextField label="GitHub URL" type="url" value={item.github} onChange={value => updateItem(index, 'github', value)} /><TextField label="Live demo URL" type="url" value={item.liveDemo} onChange={value => updateItem(index, 'liveDemo', value)} /></>}<ImageField label="Add gallery images" multiple onChange={images => updateItem(index, 'gallery', [...(item.gallery || []), ...images])} /><div className="gallery-editor">{(item.gallery || []).map((image, imageIndex) => <figure key={`${imageIndex}-${image.slice(0, 16)}`}><img src={image} alt="Gallery preview" /><figcaption><button onClick={() => updateItem(index, 'gallery', move(item.gallery, imageIndex, -1))}>←</button><button onClick={() => updateItem(index, 'gallery', move(item.gallery, imageIndex, 1))}>→</button><button className="danger" onClick={() => updateItem(index, 'gallery', item.gallery.filter((_, galleryIndex) => galleryIndex !== imageIndex))}>Remove</button></figcaption></figure>)}</div></>}</div>}
      </article>;
    })}
  </div>;
}
