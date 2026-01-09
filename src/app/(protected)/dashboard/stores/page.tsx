"use client";

import { useEffect, useMemo, useState } from "react";
import DataTable from "@/components/DataTable";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { createStore, deleteStore, getStores, updateStore } from "@/lib/api";
import { hasAdminRole } from "@/lib/auth";
import type { Store } from "@/types";

export default function StoresPage() {
  const { token } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const isAdmin = useMemo(() => hasAdminRole(token), [token]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStores();
      setItems(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stores";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setActiveStore(null);
    setFormCode("");
    setFormName("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEdit = (store: Store) => {
    if (!store.id) {
      return;
    }
    setActiveStore(store);
    setFormCode(store.code ?? "");
    setFormName(store.name ?? "");
    setFormError(null);
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setFormError(null);
    setFormLoading(false);
  };

  const onSubmit = async () => {
    const trimmedCode = formCode.trim();
    const trimmedName = formName.trim();
    if (!trimmedCode || !trimmedName) {
      setFormError("Code and store name are required.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      if (activeStore?.id) {
        await updateStore(activeStore.id, {
          code: trimmedCode,
          name: trimmedName
        });
        push({ title: "Store updated", type: "success" });
      } else {
        await createStore({
          code: trimmedCode,
          name: trimmedName
        });
        push({ title: "Store created", type: "success" });
      }
      await load();
      closeModals();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to save store";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (store: Store) => {
    setStoreToDelete(store);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!storeToDelete?.id) {
      setConfirmOpen(false);
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteStore(storeToDelete.id);
      setItems((prev) => prev.filter((item) => item.id !== storeToDelete.id));
      push({ title: "Store deleted", type: "success" });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to delete store";
      setError(message);
    } finally {
      setDeleteLoading(false);
      setConfirmOpen(false);
      setStoreToDelete(null);
    }
  };

  const onCopyId = async (storeId?: number | string) => {
    if (!storeId) {
      return;
    }
    try {
      await navigator.clipboard.writeText(String(storeId));
      push({ title: "Store ID copied", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle="Manage store locations and identifiers."
        actions={
          <Button onClick={openCreate} disabled={!isAdmin}>
            Create store
          </Button>
        }
      />

      {error ? <Card className="error-text">{error}</Card> : null}

      <div className="table-desktop">
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              render: (row) => {
                const store = row as Store;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{store.name ?? "-"}</span>
                    <Button variant="secondary" size="sm" onClick={() => onCopyId(store.id)}>
                      Copy ID
                    </Button>
                  </div>
                );
              }
            },
            {
              key: "code",
              header: "Code",
              render: (row) => (row as Store).code ?? "-"
            },
            {
              key: "createdAt",
              header: "Created",
              render: (row) => formatDate((row as Store).createdAt)
            },
            {
              key: "actions",
              header: "Actions",
              render: (row) => {
                const store = row as Store;
                const disabled = !isAdmin || !store.id;
                return (
                  <div className="row-actions">
                    <Button variant="secondary" size="sm" disabled={disabled} onClick={() => openEdit(store)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" disabled={disabled} onClick={() => openDelete(store)}>
                      Delete
                    </Button>
                    {!isAdmin ? <span className="helper">Admin only</span> : null}
                  </div>
                );
              }
            }
          ]}
          rows={items}
          rowKey={(row, index) => String((row as Store).id ?? index)}
          loading={loading}
          emptyMessage="No stores found."
        />
      </div>

      <div className="table-mobile">
        {loading ? (
          <Card>Loading...</Card>
        ) : items.length === 0 ? (
          <Card>No stores found.</Card>
        ) : (
          items.map((store) => (
            <div key={String(store.id ?? store.code)} className="row-card">
              <div className="row-title">{store.name ?? "Store"}</div>
              <div className="helper">Code: {store.code ?? "-"}</div>
              <div className="helper">Created: {formatDate(store.createdAt)}</div>
              <div className="row-actions">
                <Button variant="secondary" size="sm" onClick={() => onCopyId(store.id)}>
                  Copy ID
                </Button>
                <Button variant="secondary" size="sm" disabled={!isAdmin || !store.id} onClick={() => openEdit(store)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" disabled={!isAdmin || !store.id} onClick={() => openDelete(store)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        open={isCreateOpen || isEditOpen}
        title={isEditOpen ? "Edit store" : "Create store"}
        subtitle="Store details help with inventory tracking."
        onClose={closeModals}
        footer={
          <>
            <Button onClick={onSubmit} disabled={formLoading}>
              {formLoading ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" onClick={closeModals} disabled={formLoading}>
              Cancel
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input label="Code" value={formCode} onChange={(event) => setFormCode(event.target.value)} />
          <Input label="Store name" value={formName} onChange={(event) => setFormName(event.target.value)} />
        </div>
        {formError ? <div className="helper error-text" style={{ marginTop: 12 }}>{formError}</div> : null}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete store"
        message="This will remove the store record. Continue?"
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
