"use client";

import type { CSSProperties } from "react";
import Modal from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={confirmButtonStyle}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading} style={cancelStyle}>
            {cancelLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--muted)" }}>{message}</p>
    </Modal>
  );
}

const confirmButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #f4c7c3",
  background: "#fef2f2",
  color: "#b42318",
  fontWeight: 600
};

const cancelStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "white"
};
