import { useState } from 'react';
import { TagField, TextField } from './EditorField.jsx';

const move = (list, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const newKnowledge = () => ({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, title: 'New knowledge point', progress: 'Exploring', description: '', resourceLabel: '', resourceUrl: '', projectLabel: '', projectUrl: '', hidden: false });

export default function LearningEditor({ items, create, updateItems, activeId, onActiveChange }) {
  const [pendingRemove, setPendingRemove] = useState(null);
  const updateCategory = (id, key, value) => updateItems(items.map(item => item.id === id ? { ...item, [key]: value } : item));
  const addCategory = () => { const item = create(); updateItems([...items, item]); onActiveChange(item.id); };
  const removeCategory = (id, index) => {
    const next = items.filter(item => item.id !== id);
    updateItems(next);
    onActiveChange(next[Math.max(0, index - 1)]?.id || null);
    setPendingRemove(null);
  };
  return <div className="collection-editor learning-editor">
    <p className="editor-help">Manage knowledge categories and the individual skills inside them. Hidden entries remain saved but are not shown to visitors.</p>
    <button className="editor-add" onClick={addCategory}>+ Add Knowledge Category</button>
    {items.map((item, index) => {
      const expanded = activeId === item.id || (!activeId && index === 0);
      const knowledge = item.knowledge || [];
      const setKnowledge = value => updateCategory(item.id, 'knowledge', value);
      const updateKnowledge = (knowledgeIndex, key, value) => setKnowledge(knowledge.map((entry, entryIndex) => entryIndex === knowledgeIndex ? { ...entry, [key]: value } : entry));
      return <article className={`editor-item ${expanded ? 'is-active' : ''} ${item.hidden ? 'is-hidden' : ''}`} key={item.id}>
        <div className="editor-item-top"><button className="editor-item-select" onClick={() => onActiveChange(expanded ? null : item.id)}><strong>Category {index + 1}</strong><span>{item.title}</span></button><span><button onClick={() => updateItems(move(items, index, -1))} disabled={index === 0}>↑</button><button onClick={() => updateItems(move(items, index, 1))} disabled={index === items.length - 1}>↓</button><button onClick={() => updateCategory(item.id, 'hidden', !item.hidden)}>{item.hidden ? 'Show' : 'Hide'}</button>{pendingRemove === item.id ? <><button className="danger" onClick={() => removeCategory(item.id, index)}>Confirm delete{knowledge.length ? ` & ${knowledge.length}` : ''}</button><button onClick={() => setPendingRemove(null)}>Keep</button></> : <button className="danger" onClick={() => setPendingRemove(item.id)}>Delete</button>}</span></div>
        {expanded && <div className="editor-item-fields"><TextField label="Category title" value={item.title} onChange={value => updateCategory(item.id, 'title', value)} /><TextField label="Learning field" value={item.category || ''} onChange={value => updateCategory(item.id, 'category', value)} /><TextField label="Overall progress" value={item.status || ''} onChange={value => updateCategory(item.id, 'status', value)} /><TextField label="Period" value={item.period || ''} onChange={value => updateCategory(item.id, 'period', value)} /><TextField label="Category summary" value={item.summary || ''} multiline onChange={value => updateCategory(item.id, 'summary', value)} /><TagField label="Category tags" values={[...(item.topics || []), ...(item.technologies || [])]} onChange={value => updateItems(items.map(entry => entry.id === item.id ? { ...entry, topics: value, technologies: [] } : entry))} /><button className="editor-add secondary-add" onClick={() => setKnowledge([...knowledge, newKnowledge()])}>+ Add Knowledge Point</button>
          <div className="knowledge-editor-list">{knowledge.map((entry, knowledgeIndex) => <section className={`knowledge-editor-item ${entry.hidden ? 'is-hidden' : ''}`} key={entry.id}><div className="editor-item-top"><strong>Knowledge point {knowledgeIndex + 1}</strong><span><button onClick={() => setKnowledge(move(knowledge, knowledgeIndex, -1))}>↑</button><button onClick={() => setKnowledge(move(knowledge, knowledgeIndex, 1))}>↓</button><button onClick={() => updateKnowledge(knowledgeIndex, 'hidden', !entry.hidden)}>{entry.hidden ? 'Show' : 'Hide'}</button><button className="danger" onClick={() => { if (window.confirm('Delete this knowledge point?')) setKnowledge(knowledge.filter((_, entryIndex) => entryIndex !== knowledgeIndex)); }}>Delete</button></span></div><TextField label="Knowledge / skill" value={entry.title} onChange={value => updateKnowledge(knowledgeIndex, 'title', value)} /><TextField label="Progress" value={entry.progress || ''} onChange={value => updateKnowledge(knowledgeIndex, 'progress', value)} /><TextField label="Short explanation" value={entry.description || ''} multiline onChange={value => updateKnowledge(knowledgeIndex, 'description', value)} /><TextField label="Course / resource label" value={entry.resourceLabel || ''} onChange={value => updateKnowledge(knowledgeIndex, 'resourceLabel', value)} /><TextField label="Course / resource URL" type="url" value={entry.resourceUrl || ''} onChange={value => updateKnowledge(knowledgeIndex, 'resourceUrl', value)} /><TextField label="Related project label" value={entry.projectLabel || ''} onChange={value => updateKnowledge(knowledgeIndex, 'projectLabel', value)} /><TextField label="Related project URL" type="url" value={entry.projectUrl || ''} onChange={value => updateKnowledge(knowledgeIndex, 'projectUrl', value)} /></section>)}</div>
        </div>}
      </article>;
    })}
  </div>;
}
