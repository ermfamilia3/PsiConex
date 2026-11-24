import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, close, children }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
