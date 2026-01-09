"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import StockForm from "@/components/forms/StockForm";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { getProductsPage, getStock, getStores, updateStock } from "@/lib/api";
import { hasAdminRole } from "@/lib/auth";
import type { Product, StockItem, Store } from "@/types";

const PAGE_SIZE = 500;

export default function StockPage() {
  const { token } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [quantity, setQuantity] = useState("");

  const [filterProduct, setFilterProduct] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const isAdmin = useMemo(() => hasAdminRole(token), [token]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stockData, storesData, productsData] = await Promise.all([
          getStock(),
          getStores(),
          getProductsPage(1, PAGE_SIZE)
        ]);
        setItems(stockData);
        setStores(storesData);
        setProducts(productsData.items);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load stock";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const productOptions = useMemo(
    () =>
      products
        .filter((product) => product.id !== undefined && product.id !== null)
        .map((product) => ({
          value: String(product.id),
          label: `${product.name ?? "Product"} - ${product.sku ?? ""}`.trim()
        })),
    [products]
  );

  const storeOptions = useMemo(
    () =>
      stores
        .filter((store) => store.id !== undefined && store.id !== null)
        .map((store) => ({
          value: String(store.id),
          label: store.name ?? `Store #${store.id}`
        })),
    [stores]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterProduct && String(item.productId) !== filterProduct) {
        return false;
      }
      if (filterStore && String(item.storeId) !== filterStore) {
        return false;
      }
      return true;
    });
  }, [items, filterProduct, filterStore]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aQty = a.quantity ?? 0;
      const bQty = b.quantity ?? 0;
      return sortDirection === "asc" ? aQty - bQty : bQty - aQty;
    });
  }, [filteredItems, sortDirection]);

  const onUpdate = async () => {
    const parsedQuantity = Number(quantity);
    if (!selectedProduct || !selectedStore || !Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setUpdateError("Select product, store, and a valid quantity.");
      return;
    }
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateStock({
        productId: selectedProduct,
        storeId: selectedStore,
        quantity: parsedQuantity
      });
      const data = await getStock();
      setItems(data);
      setQuantity("");
      push({ title: "Stock updated", type: "success" });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to update stock";
      setUpdateError(message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <PageHeader title="Stock" subtitle="Track inventory levels across stores." />

      {isAdmin ? (
        <Card>
          <StockForm
            products={productOptions}
            stores={storeOptions}
            productId={selectedProduct}
            storeId={selectedStore}
            quantity={quantity}
            onProductChange={setSelectedProduct}
            onStoreChange={setSelectedStore}
            onQuantityChange={setQuantity}
            onSubmit={onUpdate}
            loading={updating}
            error={updateError}
          />
        </Card>
      ) : (
        <Card>You have read-only access to stock levels.</Card>
      )}

      <Card>
        <div className="card-row">
          <label className="field">
            <span className="label">Product</span>
            <select
              value={filterProduct}
              onChange={(event) => setFilterProduct(event.target.value)}
              className="input"
            >
              <option value="">All products</option>
              {productOptions.map((product) => (
                <option key={product.value} value={product.value}>
                  {product.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Store</span>
            <select
              value={filterStore}
              onChange={(event) => setFilterStore(event.target.value)}
              className="input"
            >
              <option value="">All stores</option>
              {storeOptions.map((store) => (
                <option key={store.value} value={store.value}>
                  {store.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">Quantity</span>
            <Button
              variant="secondary"
              onClick={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
            >
              {sortDirection === "asc" ? "Lowest to highest" : "Highest to lowest"}
            </Button>
          </label>
          <Button variant="secondary" onClick={() => { setFilterProduct(""); setFilterStore(""); }}>
            Clear filters
          </Button>
        </div>
      </Card>

      {error ? <Card className="error-text">{error}</Card> : null}

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
          rows={sortedItems}
          rowKey={(row, index) => {
            const item = row as StockItem;
            return String(item.id ?? `${item.productId}-${item.storeId}-${index}`);
          }}
          loading={loading}
          emptyMessage="No stock entries found."
        />
      </div>

      <div className="table-mobile">
        {loading ? (
          <Card>Loading...</Card>
        ) : sortedItems.length === 0 ? (
          <Card>No stock entries found.</Card>
        ) : (
          sortedItems.map((item, index) => (
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
  );
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

