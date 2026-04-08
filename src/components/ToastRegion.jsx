import React from 'react';

export default function ToastRegion({ toasts, onDismiss }) {
  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.type || 'info'}`}>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  );
}
