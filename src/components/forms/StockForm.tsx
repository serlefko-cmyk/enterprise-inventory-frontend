"use client";

import type { CSSProperties } from "react";

type Option = {
  value: number | string;
  label: string;
};

type StockFormProps = {
  products: Option[];
  stores: Option[];
  productId: string;
  storeId: string;
  quantity: string;
  onProductChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string | null;
};

export default function StockForm({
  products,
  stores,
  productId,
  storeId,
  quantity,
  onProductChange,
  onStoreChange,
  onQuantityChange,
  onSubmit,
  loading,
  error
}: StockFormProps) {
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Update stock</h2>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            Product
          </div>
          <select
            value={productId}
            onChange={(event) => onProductChange(event.target.value)}
            style={inputStyle}
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.value} value={product.value}>
                {product.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            Store
          </div>
          <select
            value={storeId}
            onChange={(event) => onStoreChange(event.target.value)}
            style={inputStyle}
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store.value} value={store.value}>
                {store.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            Quantity
          </div>
          <input
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            type="number"
            min="0"
            step="1"
            style={inputStyle}
          />
        </label>
      </div>
      {error ? (
        <div style={{ color: "#b42318", marginTop: 12, fontSize: 13 }}>
          {error}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "white",
            fontWeight: 600
          }}
        >
          {loading ? "Saving..." : "Update stock"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "white"
};
