import { useEffect } from 'react';

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useDialogFocus(dialogRef, active = true) {
  useEffect(() => {
    if (!active || !dialogRef.current) return undefined;
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const first = dialog.querySelector(focusable);
    first?.focus({ preventScroll: true });

    const keepFocus = event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll(focusable)].filter(element => element.getClientRects().length);
      if (!controls.length) { event.preventDefault(); return; }
      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === firstControl || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && (document.activeElement === lastControl || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    document.addEventListener('keydown', keepFocus);
    return () => {
      document.removeEventListener('keydown', keepFocus);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [dialogRef, active]);
}
