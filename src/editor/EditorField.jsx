import { useState } from 'react';

export function TextField({ label, value = '', onChange, multiline = false, type = 'text', placeholder = '' }) { const Input = multiline ? 'textarea' : 'input'; return <label className="editor-field"><span>{label}</span><Input type={multiline ? undefined : type} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></label>; }
export function TagField({ label, values = [], onChange }) {
  const move = (index, direction) => {
    const destination = index + direction;
    if (destination < 0 || destination >= values.length) return;
    const next = [...values];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  };
  return <div className="tag-field"><strong>{label}</strong>{values.map((value, index) => {
    const item = typeof value === 'string' ? { id: `${index}-${value}`, label: value } : value;
    return <div className="tag-edit-row" key={item.id}><input aria-label={`${label} ${index + 1}`} value={item.label} onChange={event => onChange(values.map((entry, entryIndex) => entryIndex === index ? { ...(typeof entry === 'string' ? { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}` } : entry), label: event.target.value } : entry))} /><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.label} left`}>←</button><button type="button" onClick={() => move(index, 1)} disabled={index === values.length - 1} aria-label={`Move ${item.label} right`}>→</button><button type="button" className="danger" onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))} aria-label={`Remove ${item.label}`}>×</button></div>;
  })}<button type="button" className="tag-add" onClick={() => onChange([...values, { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, label: 'New label' }])}>+ Add Label</button></div>;
}
const readImage = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const optimiseImage = async file => {
  const source = await readImage(file);
  if (file.type === 'image/svg+xml') return source;
  const image = new Image();
  image.src = source;
  await image.decode();
  const limit = 1600;
  const scale = Math.min(1, limit / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.86);
};

export function ImageField({ label, value, onChange, multiple = false }) {
  const [error, setError] = useState('');
  const select = async event => {
    setError('');
    const selected = [...(event.target.files || [])];
    const files = selected.filter(file => /image\/(jpeg|png|webp|svg\+xml)/.test(file.type));
    if (selected.length && !files.length) setError('Unsupported file. Choose JPG, JPEG, PNG, WebP, or SVG.');
    try { const images = await Promise.all(files.map(optimiseImage)); if (images.length) onChange(multiple ? images : images[0]); } catch (imageError) { setError(`Upload failed: ${imageError.message || 'the image could not be processed.'}`); }
    event.target.value = '';
  };
  return <div className="editor-image"><span>{label}</span><label className="image-picker"><input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple={multiple} onChange={select} />{multiple ? 'Add images' : value ? 'Replace image' : 'Upload image'}</label>{error && <small className="image-error" role="alert">{error}</small>}{!multiple && value && <div className="image-preview"><img src={value} alt="Preview" /><button type="button" className="danger" onClick={() => onChange('')}>Remove image</button></div>}</div>;
}
