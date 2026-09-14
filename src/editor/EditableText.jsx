import { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function EditableText({ value, onChange, as: Tag = 'span', className = '', multiline = false }) {
  const { hostMode } = usePortfolio();
  const text = String(value ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => { if (!editing) setDraft(text); }, [text, editing]);
  const startEditing = event => { event.preventDefault(); event.stopPropagation(); setDraft(text); setEditing(true); };

  if (!hostMode) return <Tag className={className}>{text}</Tag>;
  if (multiline && editing) return <textarea className={`${className} editable-inline editable-textarea-inline editing`} value={draft} autoFocus onChange={event => setDraft(event.target.value)} onBlur={() => { setEditing(false); onChange(draft.replace(/\r\n/g, '\n').trim()); }} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setDraft(text); setEditing(false); } }} />;

  return <Tag className={`${className} editable-inline ${editing ? 'editing' : ''}`} contentEditable={editing} suppressContentEditableWarning onClick={startEditing} onBlur={event => { setEditing(false); onChange(event.currentTarget.innerText.trim()); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}>{text}</Tag>;
}
