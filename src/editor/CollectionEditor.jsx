import { useState } from 'react';
import { ImageField, TagField, TextField } from './EditorField.jsx';
import GalleryEditor from './GalleryEditor.jsx';

const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function CollectionEditor({ title, items, create, updateItems, kind, activeId, activePanel = 'details', onActiveChange, onPanelChange }) {
  const [pendingRemove, setPendingRemove] = useState(null);
  const updateItem = (id, key, value) => updateItems(items.map(item => item.id === id ? { ...item, [key]: value } : item));
  const saveGallery = (id, galleryDraft) => updateItems(items.map(item => item.id === id ? { ...item, ...galleryDraft } : item));
  const add = () => { const item = create(); updateItems([...items, item]); onActiveChange?.(item.id); };
  const remove = (id, index) => {
    const next = items.filter(item => item.id !== id);
    updateItems(next);
    setPendingRemove(null);
    onActiveChange?.(next[Math.max(0, index - 1)]?.id || null);
  };
  const galleryItem = activePanel === 'gallery' ? items.find(item => item.id === activeId) : null;
  if (galleryItem) return <GalleryEditor item={galleryItem} kind={kind} onSave={saveGallery} onBack={() => { onActiveChange?.(null); window.setTimeout(() => document.getElementById(`${kind}-${galleryItem.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40); }} />;

  return <div className="collection-editor">
    <p className="editor-help">Select an item below to edit it. Every update is matched by the card's permanent ID and remains a draft until Save.</p>
    <button className="editor-add" onClick={add}>+ Add {title}</button>
    {items.map((item, index) => {
      const expanded = activeId === item.id || (!activeId && index === 0);
      const labels = kind === 'project' ? item.technologies || [] : item.tags || [];
      return <article key={item.id} className={`editor-item ${expanded ? 'is-active' : ''}`} data-item-id={item.id}>
        <div className="editor-item-top"><button className="editor-item-select" onClick={() => onActiveChange?.(expanded ? null : item.id)}><strong>{title} {index + 1}</strong><span>{item.title || `Untitled ${title}`}</span></button><span><button onClick={() => updateItems(move(items, index, -1))} disabled={index === 0} aria-label={`Move ${title} ${index + 1} up`}>↑</button><button onClick={() => updateItems(move(items, index, 1))} disabled={index === items.length - 1} aria-label={`Move ${title} ${index + 1} down`}>↓</button>{pendingRemove === item.id ? <><button onClick={() => remove(item.id, index)}>Confirm delete</button><button onClick={() => setPendingRemove(null)}>Keep</button></> : <button className="danger" onClick={() => setPendingRemove(item.id)}>Delete</button>}</span></div>
        {expanded && <div className="editor-item-fields">
          <TextField label="Title" value={item.title || ''} onChange={value => updateItem(item.id, 'title', value)} />
          <TextField label="Label" value={item.label || ''} onChange={value => updateItem(item.id, 'label', value)} />
          <TextField label="Date" value={item.date || ''} onChange={value => updateItem(item.id, 'date', value)} />
          <TextField label="Short description" value={item.description || ''} multiline onChange={value => updateItem(item.id, 'description', value)} />
          <TextField label="Full detail / case study" value={item.details || ''} multiline onChange={value => updateItem(item.id, 'details', value)} />
          {kind === 'competition' && <TextField label="Achievement" value={item.achievement || ''} onChange={value => updateItem(item.id, 'achievement', value)} />}
          <ImageField label="Highlight Image (separate from Gallery)" value={item.coverImage || ''} onChange={value => updateItem(item.id, 'coverImage', value)} />
          <TextField label="Highlight Image position" value={item.coverPosition || '50% 50%'} placeholder="Example: 50% 35%" onChange={value => updateItem(item.id, 'coverPosition', value)} />
          <TagField label="Labels / Technologies" values={labels} onChange={value => updateItem(item.id, kind === 'project' ? 'technologies' : 'tags', value)} />
          {kind === 'project' && <><TextField label="GitHub URL" type="url" value={item.github || ''} onChange={value => updateItem(item.id, 'github', value)} /><TextField label="Live demo URL" type="url" value={item.liveDemo || ''} onChange={value => updateItem(item.id, 'liveDemo', value)} /></>}
          <button className="editor-add gallery-open-editor" onClick={() => onPanelChange?.(item.id, 'gallery')}>Edit this {title}'s Gallery ({(item.gallery || []).length})</button>
        </div>}
      </article>;
    })}
  </div>;
}
