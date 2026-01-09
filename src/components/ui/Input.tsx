"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
};

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input
        {...props}
        className={["input", error ? "input-error" : "", className ?? ""].join(" ").trim()}
      />
      {error ? <span className="helper error-text">{error}</span> : null}
    </label>
  );
}
