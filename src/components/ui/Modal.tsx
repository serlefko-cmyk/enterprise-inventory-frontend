"use client";

import type { CSSProperties } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            {subtitle ? (
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            x
          </button>
        </div>
        <div style={{ marginTop: 16 }}>{children}</div>
        {footer ? <div style={footerStyle}>{footer}</div> : null}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 50
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "white",
  borderRadius: 14,
  border: "1px solid var(--line)",
  padding: 20,
  boxShadow: "0 18px 32px rgba(15, 23, 42, 0.18)"
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12
};

const closeButtonStyle: CSSProperties = {
  border: "1px solid var(--line)",
  background: "white",
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 18,
  lineHeight: "28px",
  cursor: "pointer"
};

const footerStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 20
};
