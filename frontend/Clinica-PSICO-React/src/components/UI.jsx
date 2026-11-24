import React from 'react';

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Stat({ icon: Icon, label, value, note, tone = 'mint' }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </span>
      <small>{label}</small>
      <b>{value}</b>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

export function Heading({ title, subtitle, action, onAction }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">CLÍNICA PSICO · GESTÃO INTEGRADA</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="primary-button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
