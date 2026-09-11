import { useEffect, useState } from 'react';
import { ImageField, TextField } from './EditorField.jsx';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const normaliseGallery = gallery => (gallery || []).map(image => typeof image === 'string' ? { id: uid(), src: image, caption: '', hidden: false } : { id: image.id || uid(), caption: '', hidden: false, ...image }).filter(image => image?.src);
const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function GalleryEditor({ item, kind, onSave, onBack }) {
  const [draft, setDraft] = useState(() => ({ galleryUrl: item.galleryUrl || '', gallery: normaliseGallery(item.gallery) }));
  useEffect(() => setDraft({ galleryUrl: item.galleryUrl || '', gallery: normaliseGallery(item.gallery) }), [item.id]);
  const gallery = draft.gallery;
  const setGallery = value => setDraft(current => ({ ...current, gallery: value }));
  const saveGallery = () => { onSave(item.id, draft); onBack(); };
  return <section className="dedicated-gallery-editor" data-gallery-owner={item.id}>
    <header><div><p>{kind.toUpperCase()} · EXCLUSIVE GALLERY</p><h3>{item.title}</h3><small>Owner ID: {item.id}</small></div><button onClick={onBack}>Return to card ↙</button></header>
    <p className="editor-help">Only this card is being edited. Its Highlight Image remains completely separate.</p>
    <TextField label="Gallery external URL (optional)" type="url" value={draft.galleryUrl} placeholder="https://..." onChange={value => setDraft(current => ({ ...current, galleryUrl: value }))} />
    <ImageField label="Upload one or multiple Gallery images" multiple onChange={images => setGallery([...gallery, ...images.map(src => ({ id: uid(), src, caption: '', hidden: false }))])} />
    {gallery.length === 0 && <p className="gallery-editor-empty">No Gallery images yet. Uploading here will not alter the card's Highlight Image.</p>}
    <div className="gallery-editor">{gallery.map((image, imageIndex) => <figure className={image.hidden ? 'is-hidden' : ''} key={image.id}>
      <img src={image.src} alt={image.caption || `Gallery image ${imageIndex + 1}`} />
      <span className="gallery-visibility">{image.hidden ? 'Hidden from visitors' : 'Visible to visitors'}</span>
      <TextField label={`Image ${imageIndex + 1} Caption`} value={image.caption || ''} onChange={caption => setGallery(gallery.map((entry, entryIndex) => entryIndex === imageIndex ? { ...entry, caption } : entry))} />
      <ImageField label="Replace this Gallery image" value="" onChange={src => setGallery(gallery.map((entry, entryIndex) => entryIndex === imageIndex ? { ...entry, src } : entry))} />
      <figcaption><button onClick={() => setGallery(move(gallery, imageIndex, -1))} disabled={imageIndex === 0}>← Earlier</button><button onClick={() => setGallery(move(gallery, imageIndex, 1))} disabled={imageIndex === gallery.length - 1}>Later →</button><button onClick={() => setGallery(gallery.map((entry, entryIndex) => entryIndex === imageIndex ? { ...entry, hidden: !entry.hidden } : entry))}>{image.hidden ? 'Show' : 'Hide'}</button><button className="danger" onClick={() => { if (window.confirm('Permanently remove this Gallery image?')) setGallery(gallery.filter((_, galleryIndex) => galleryIndex !== imageIndex)); }}>Remove</button></figcaption>
    </figure>)}</div>
    <footer className="gallery-draft-actions"><button onClick={onBack}>Cancel Gallery Changes</button><button className="save" onClick={saveGallery}>Save Gallery Draft</button></footer>
  </section>;
}
