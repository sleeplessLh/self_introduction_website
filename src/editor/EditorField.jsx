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
export function ImageField({ label, value, onChange, multiple = false }) { const read = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); const select = async event => { const files = [...(event.target.files || [])].filter(file => file.type.startsWith('image/') && file.size <= 1800000); const images = await Promise.all(files.map(read)); onChange(multiple ? images : images[0]); }; return <label className="editor-image"><span>{label}</span><input type="file" accept="image/*" multiple={multiple} onChange={select} />{!multiple && value && <img src={value} alt="Preview" />}</label>; }
