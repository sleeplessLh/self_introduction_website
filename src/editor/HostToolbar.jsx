import { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function HostToolbar() {
  const { undo, redo, save, cancel, canUndo, canRedo, isDirty, status, setPreviewMode } = usePortfolio();
  const [toast, setToast] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => { if (!status) return; setToast(status); const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer); }, [status]);
  const discard = () => { cancel(); setConfirmDiscard(false); };
  const preview = () => setPreviewMode(true);
  return <div className="host-workspace-controls">
    <div className="host-action-toolbar" aria-label="Host editing toolbar">
      <button aria-label="Undo" onClick={undo} disabled={!canUndo}>Undo</button>
      <button aria-label="Redo" onClick={redo} disabled={!canRedo}>Redo</button>
      <button aria-label="Save" onClick={save} disabled={!isDirty}>Save</button>
      <button aria-label="Discard" onClick={() => setConfirmDiscard(true)} disabled={!isDirty}>Discard</button>
      <button aria-label="Preview" onClick={preview}>Preview</button>
    </div>
    {confirmDiscard && <div className="host-confirm" role="dialog" aria-label="Confirm discard"><span>Discard all unsaved changes?</span><button onClick={discard}>Discard</button><button onClick={() => setConfirmDiscard(false)}>Keep editing</button></div>}
    {toast && <div className={`host-toast ${/denied|failed|could not/i.test(toast) ? 'is-error' : ''}`} role="status">{toast}</div>}
  </div>;
}
