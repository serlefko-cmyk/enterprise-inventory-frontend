import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  width?: number | string;
  align?: "left" | "right" | "center";
  render?: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: keyof T | ((row: T, index: number) => string);
  loading?: boolean;
  emptyMessage?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = "No data available."
}: DataTableProps<T>) {
  const getRowKey =
    typeof rowKey === "function"
      ? rowKey
      : (row: T, index: number) =>
          String((row as Record<string, unknown>)[String(rowKey)] ?? index);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflowX: "auto"
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: column.align ?? "left",
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--line)",
                  fontSize: 12,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  width: column.width
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 16, color: "var(--muted)" }}
              >
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 16, color: "var(--muted)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 14,
                      textAlign: column.align ?? "left"
                    }}
                  >
                    {column.render ? column.render(row) : formatValue(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatValue<T>(row: T, column: Column<T>) {
  const value = (row as Record<string, unknown>)[column.key];
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}
