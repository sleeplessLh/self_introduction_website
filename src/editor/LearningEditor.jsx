import { useState } from 'react';
import { TextField } from './EditorField.jsx';

const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export default function LearningEditor({ items, create, updateItems, activeId, onActiveChange }) {
  const [pendingRemove, setPendingRemove] = useState(null);
  const updateItem = (id, key, value) => updateItems(items.map(item => item.id === id ? { ...item, [key]: value } : item));
  const add = () => { const item = create(); updateItems([...items, item]); onActiveChange(item.id); };
  const remove = (id, index) => { const next = items.filter(item => item.id !== id); updateItems(next); onActiveChange(next[Math.max(0, index - 1)]?.id || null); setPendingRemove(null); };

  return <div className="collection-editor learning-editor"><p className="editor-help">Each item is one simple learning record with a Title and Description. Hidden items stay saved but are not published.</p><button className="editor-add" onClick={add}>+ Add Learning Item</button>{items.map((item, index) => {
    const expanded = activeId === item.id || (!activeId && index === 0);
    return <article className={`editor-item ${expanded ? 'is-active' : ''} ${item.hidden ? 'is-hidden' : ''}`} key={item.id} data-learning-id={item.id}><div className="editor-item-top"><button className="editor-item-select" onClick={() => onActiveChange(expanded ? null : item.id)}><strong>Learning Item {index + 1}</strong><span>{item.title}</span></button><span><button onClick={() => updateItems(move(items, index, -1))} disabled={index === 0}>↑</button><button onClick={() => updateItems(move(items, index, 1))} disabled={index === items.length - 1}>↓</button><button onClick={() => updateItem(item.id, 'hidden', !item.hidden)}>{item.hidden ? 'Show' : 'Hide'}</button>{pendingRemove === item.id ? <><button className="danger" onClick={() => remove(item.id, index)}>Confirm delete</button><button onClick={() => setPendingRemove(null)}>Keep</button></> : <button className="danger" onClick={() => setPendingRemove(item.id)}>Delete</button>}</span></div>{expanded && <div className="editor-item-fields"><TextField label="Title" value={item.title || ''} onChange={value => updateItem(item.id, 'title', value)} /><TextField label="Description" value={item.description || ''} multiline onChange={value => updateItem(item.id, 'description', value)} /></div>}</article>;
  })}</div>;
}
