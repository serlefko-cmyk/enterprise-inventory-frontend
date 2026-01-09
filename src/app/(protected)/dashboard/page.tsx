"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getProductsPage, getStock, getStores } from "@/lib/api";
import type { Product, StockItem, Store } from "@/types";

const PRODUCT_SAMPLE_SIZE = 100;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsPage, storesData, stockData] = await Promise.all([
        getProductsPage(1, PRODUCT_SAMPLE_SIZE),
        getStores(),
        getStock()
      ]);
      setProducts(productsPage.items);
      setStores(storesData);
      setStock(stockData);
      setTotalProducts(productsPage.totalCount ?? productsPage.items.length);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load overview";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const lowStock = stock.filter((item) => (item.quantity ?? 0) < 20).length;
    const topRow = stock.reduce<StockItem | null>((best, current) => {
      if (!best) {
        return current;
      }
      const bestQty = best.quantity ?? 0;
      const currentQty = current.quantity ?? 0;
      return currentQty > bestQty ? current : best;
    }, null);
    return {
      totalProducts,
      totalStores: stores.length,
      stockRows: stock.length,
      lowStock,
      topStocked: topRow
    };
  }, [stock, stores.length, totalProducts]);

  const latestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => compareDates(b.createdAt, a.createdAt))
      .slice(0, 5);
  }, [products]);

  const recentStock = useMemo(() => {
    return [...stock]
      .sort((a, b) => compareDates(b.updatedAt, a.updatedAt))
      .slice(0, 5);
  }, [stock]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's a snapshot of your inventory."
        actions={
          <>
            <div className="helper">
              Last updated {lastUpdated ? lastUpdated.toLocaleString() : "--"}
            </div>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </>
        }
      />

      {error ? (
        <Card className="error-text">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={refresh}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard title="Total products" value={stats.totalProducts} loading={loading} />
        <StatCard title="Total stores" value={stats.totalStores} loading={loading} />
        <StatCard title="Stock rows" value={stats.stockRows} loading={loading} />
        <StatCard title="Low stock items" value={stats.lowStock} loading={loading} />
        <Card>
          <div className="label">Top stocked</div>
          {loading ? (
            <div className="skeleton-line" />
          ) : stats.topStocked ? (
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {getProductLabel(stats.topStocked, products)} - {stats.topStocked.quantity ?? 0}
            </div>
          ) : (
            <div className="helper">No data</div>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Latest products</div>
              <div className="panel-subtitle">Most recent additions to your catalog.</div>
            </div>
          </div>
          <div className="table-desktop">
            <DataTable
              columns={[
                { key: "sku", header: "SKU" },
                { key: "name", header: "Name" },
                {
                  key: "price",
                  header: "Price",
                  align: "right",
                  render: (row) => {
                    const price = (row as Product).price;
                    return typeof price === "number" ? price.toFixed(2) : "-";
                  }
                }
              ]}
              rows={latestProducts}
              rowKey={(row, index) => String((row as Product).id ?? index)}
              loading={loading}
              emptyMessage="No recent products."
            />
          </div>
          <div className="table-mobile">
            {loading ? (
              <Card>Loading...</Card>
            ) : latestProducts.length === 0 ? (
              <Card>No recent products.</Card>
            ) : (
              latestProducts.map((product, index) => (
                <div key={String(product.id ?? index)} className="row-card">
                  <div className="row-title">{product.name ?? "Product"}</div>
                  <div className="helper">SKU: {product.sku ?? "-"}</div>
                  <div className="helper">
                    Price: {typeof product.price === "number" ? product.price.toFixed(2) : "-"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent stock updates</div>
              <div className="panel-subtitle">Latest inventory changes across stores.</div>
            </div>
          </div>
          <div className="table-desktop">
            <DataTable
              columns={[
                {
                  key: "product",
                  header: "Product",
                  render: (row) => getProductLabel(row as StockItem, products)
                },
                {
                  key: "store",
                  header: "Store",
                  render: (row) => getStoreLabel(row as StockItem, stores)
                },
                {
                  key: "quantity",
                  header: "Quantity",
                  align: "right",
                  render: (row) => {
                    const item = row as StockItem;
                    return typeof item.quantity === "number" ? item.quantity : "-";
                  }
                },
                {
                  key: "updatedAt",
                  header: "Updated",
                  render: (row) => formatDate((row as StockItem).updatedAt)
                }
              ]}
              rows={recentStock}
              rowKey={(row, index) => String((row as StockItem).id ?? index)}
              loading={loading}
              emptyMessage="No recent stock updates."
            />
          </div>
          <div className="table-mobile">
            {loading ? (
              <Card>Loading...</Card>
            ) : recentStock.length === 0 ? (
              <Card>No recent stock updates.</Card>
            ) : (
              recentStock.map((item, index) => (
                <div key={String(item.id ?? index)} className="row-card">
                  <div className="row-title">{getProductLabel(item, products)}</div>
                  <div className="helper">Store: {getStoreLabel(item, stores)}</div>
                  <div className="helper">Quantity: {typeof item.quantity === "number" ? item.quantity : "-"}</div>
                  <div className="helper">Updated: {formatDate(item.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <div className="label">{title}</div>
      {loading ? (
        <div className="skeleton-number" />
      ) : (
        <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      )}
    </Card>
  );
}

function compareDates(a?: string, b?: string) {
  const dateA = a ? new Date(a).getTime() : 0;
  const dateB = b ? new Date(b).getTime() : 0;
  return dateA - dateB;
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
}

function getProductLabel(item: StockItem, products: Product[]) {
  const match = products.find(
    (product) => String(product.id) === String(item.productId)
  );
  if (match) {
    return `${match.name ?? "Product"} - ${match.sku ?? ""}`.trim();
  }
  if (item.productId !== undefined && item.productId !== null) {
    return `#${item.productId}`;
  }
  return "-";
}

function getStoreLabel(item: StockItem, stores: Store[]) {
  const match = stores.find(
    (store) => String(store.id) === String(item.storeId)
  );
  if (match) {
    return match.name ?? `Store #${match.id}`;
  }
  if (item.storeId !== undefined && item.storeId !== null) {
    return `#${item.storeId}`;
  }
  return "-";
}


