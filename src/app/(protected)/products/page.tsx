"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { createProduct, deleteProduct, getProductsPage, updateProduct } from "@/lib/api";
import { hasAdminRole } from "@/lib/auth";
import type { Product } from "@/types";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const { token } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [skuFilter, setSkuFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const isAdmin = useMemo(() => hasAdminRole(token), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: data, totalCount: count } = await getProductsPage(
        page,
        PAGE_SIZE
      );
      setItems(data);
      setTotalCount(count);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const min = Number(minPrice);
    const max = Number(maxPrice);
    return items.filter((product) => {
      if (skuFilter && !String(product.sku ?? "").toLowerCase().includes(skuFilter.toLowerCase())) {
        return false;
      }
      if (nameFilter && !String(product.name ?? "").toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      if (minPrice && (Number.isNaN(min) || (product.price ?? 0) < min)) {
        return false;
      }
      if (maxPrice && (Number.isNaN(max) || (product.price ?? 0) > max)) {
        return false;
      }
      return true;
    });
  }, [items, skuFilter, nameFilter, minPrice, maxPrice]);

  const openCreate = () => {
    setActiveProduct(null);
    setFormSku("");
    setFormName("");
    setFormPrice("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (product: Product) => {
    if (!product.id) {
      return;
    }
    setActiveProduct(product);
    setFormSku(product.sku ?? "");
    setFormName(product.name ?? "");
    setFormPrice(typeof product.price === "number" ? product.price.toString() : "");
    setFormError(null);
    setIsEditOpen(true);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setFormError(null);
  };

  const onSubmit = async () => {
    const trimmedSku = formSku.trim();
    const trimmedName = formName.trim();
    const parsedPrice = Number(formPrice);
    if (!trimmedSku || !trimmedName || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError("SKU, name, and price are required.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      if (activeProduct?.id) {
        await updateProduct(activeProduct.id, {
          sku: trimmedSku,
          name: trimmedName,
          price: parsedPrice
        });
        push({ title: "Product updated", type: "success" });
      } else {
        await createProduct({
          sku: trimmedSku,
          name: trimmedName,
          price: parsedPrice
        });
        push({ title: "Product created", type: "success" });
      }
      await load();
      closeModal();
    } catch (err) {
      console.error(err);
      setFormError(getErrorMessage(err, "Failed to save product"));
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (product: Product) => {
    setProductToDelete(product);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!productToDelete?.id) {
      setConfirmOpen(false);
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id as number);
      setItems((prev) => prev.filter((item) => item.id !== productToDelete.id));
      push({ title: "Product deleted", type: "success" });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Failed to delete product"));
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : undefined;
  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : items.length === PAGE_SIZE;

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Track catalog items and pricing."
        actions={
          <Button onClick={openCreate} disabled={!isAdmin}>
            Create product
          </Button>
        }
      />

      <Card>
        <div className="card-row">
          <Input label="SKU" value={skuFilter} onChange={(e) => setSkuFilter(e.target.value)} />
          <Input label="Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          <Input label="Min price" type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input label="Max price" type="number" min="0" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </Card>

      {error ? (
        <Card className="error-text">{error}</Card>
      ) : null}

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
            },
            {
              key: "createdAt",
              header: "Created",
              render: (row) => formatDate((row as Product).createdAt)
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => {
                const product = row as Product;
                const disabled = !isAdmin || !product.id;
                return (
                  <div className="row-actions">
                    <Button variant="secondary" size="sm" disabled={disabled} onClick={() => openEdit(product)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" disabled={disabled} onClick={() => openDelete(product)}>
                      Delete
                    </Button>
                    {!isAdmin ? <span className="helper">Admin only</span> : null}
                  </div>
                );
              }
            }
          ]}
          rows={filteredItems}
          rowKey={(row, index) => String((row as Product).id ?? index)}
          loading={loading}
          emptyMessage="No products found."
        />
      </div>

      <div className="table-mobile">
        {loading ? (
          <Card>Loading...</Card>
        ) : filteredItems.length === 0 ? (
          <Card>No products found.</Card>
        ) : (
          filteredItems.map((product) => (
            <div key={String(product.id ?? product.sku)} className="row-card">
              <div className="row-title">{product.name ?? "Untitled"}</div>
              <div className="helper">SKU: {product.sku ?? "-"}</div>
              <div className="helper">Price: {typeof product.price === "number" ? product.price.toFixed(2) : "-"}</div>
              <div className="helper">Created: {formatDate(product.createdAt)}</div>
              <div className="row-actions">
                <Button variant="secondary" size="sm" disabled={!isAdmin || !product.id} onClick={() => openEdit(product)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" disabled={!isAdmin || !product.id} onClick={() => openDelete(product)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card-row pagination-row">
        <Button variant="secondary" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={!canPrev || loading}>
          Prev
        </Button>
        <div className="helper">
          Page {page}
          {totalPages ? ` of ${totalPages}` : ""}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setPage((prev) => prev + 1)} disabled={!canNext || loading}>
          Next
        </Button>
      </div>

      <Modal
        open={isCreateOpen || isEditOpen}
        title={isEditOpen ? "Edit product" : "Create product"}
        subtitle="Keep SKU and pricing aligned with your catalog."
        onClose={closeModal}
        footer={
          <>
            <Button onClick={onSubmit} disabled={formLoading}>
              {formLoading ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>
              Cancel
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="SKU" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Price" type="number" min="0" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
        </div>
        {formError ? <div className="helper error-text" style={{ marginTop: 12 }}>{formError}</div> : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product"
        message="This will permanently remove the product."
        confirmLabel="Delete"
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
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

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
