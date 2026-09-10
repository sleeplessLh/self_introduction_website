export function TextField({ label, value = '', onChange, multiline = false, type = 'text', placeholder = '' }) { const Input = multiline ? 'textarea' : 'input'; return <label className="editor-field"><span>{label}</span><Input type={multiline ? undefined : type} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} /></label>; }
export function TagField({ label, values = [], onChange }) {
  const move = (index, direction) => {
    const destination = index + direction;
    if (destination < 0 || destination >= values.length) return;
    const next = [...values];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  };
  return <><TextField label={label} value={values.join(', ')} placeholder="Separate items with commas" onChange={value => onChange(value.split(',').map(item => item.trim()).filter(Boolean))} />{values.length > 0 && <div className="tag-order" aria-label={`${label} order`}>{values.map((value, index) => <span key={`${value}-${index}`}><i>{value}</i><button type="button" onClick={() => move(index, -1)} aria-label={`Move ${value} left`}>←</button><button type="button" onClick={() => move(index, 1)} aria-label={`Move ${value} right`}>→</button><button type="button" className="danger" onClick={() => onChange(values.filter((_, valueIndex) => valueIndex !== index))} aria-label={`Remove ${value}`}>×</button></span>)}</div>}</>;
}
const readImage = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const optimiseImage = async file => {
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
  const select = async event => {
    const files = [...(event.target.files || [])].filter(file => file.type.startsWith('image/'));
    const images = await Promise.all(files.map(optimiseImage));
    if (images.length) onChange(multiple ? images : images[0]);
    event.target.value = '';
  };
  return <div className="editor-image"><span>{label}</span><label className="image-picker"><input type="file" accept="image/*" multiple={multiple} onChange={select} />{multiple ? 'Add images' : value ? 'Replace image' : 'Upload image'}</label>{!multiple && value && <div className="image-preview"><img src={value} alt="Preview" /><button type="button" className="danger" onClick={() => onChange('')}>Remove image</button></div>}</div>;
}
