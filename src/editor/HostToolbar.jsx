import { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

export default function HostToolbar() {
  const { undo, redo, save, cancel, canUndo, canRedo, isDirty, changeCount, status, setHostMode } = usePortfolio();
  const [toast, setToast] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => { if (!status) return; setToast(status); const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer); }, [status]);
  const discard = () => { cancel(); setConfirmDiscard(false); };
  return <div className="host-workspace-controls">
    <div className="host-mode-indicator"><i /><strong>HOST MODE</strong><span>{isDirty ? `${changeCount} unsaved edit${changeCount === 1 ? '' : 's'}` : 'All changes saved'}</span></div>
    <div className="host-action-toolbar" aria-label="Host editing toolbar">
      <button data-tooltip="Undo" aria-label="Undo" onClick={undo} disabled={!canUndo}>↶</button>
      <button data-tooltip="Redo" aria-label="Redo" onClick={redo} disabled={!canRedo}>↷</button>
      <button data-tooltip="Preview visitor mode" aria-label="Preview visitor mode" onClick={() => setHostMode(false)}>◉</button>
      <button data-tooltip="Save" aria-label="Save" onClick={save} disabled={!isDirty}>✓</button>
      <button data-tooltip="Discard" aria-label="Discard" onClick={() => setConfirmDiscard(true)} disabled={!isDirty}>×</button>
    </div>
    {confirmDiscard && <div className="host-confirm" role="dialog" aria-label="Confirm discard"><span>Discard all unsaved changes?</span><button onClick={discard}>Discard</button><button onClick={() => setConfirmDiscard(false)}>Keep editing</button></div>}
    {toast && <div className={`host-toast ${/denied|failed|could not/i.test(toast) ? 'is-error' : ''}`} role="status">{toast}</div>}
  </div>;
}
