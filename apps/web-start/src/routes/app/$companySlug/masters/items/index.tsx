import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem, useUnitOptions } from "@/lib/masters-hooks";
import type { Item } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/items/")({
  component: ItemsPage,
});

function ItemsPage() {
  const { companySlug } = Route.useParams();
  const { data: items = [], isLoading, error } = useItems(companySlug);
  const { data: unitOptions = [] } = useUnitOptions(companySlug);
  const createMutation = useCreateItem(companySlug);
  const updateMutation = useUpdateItem(companySlug);
  const deleteMutation = useDeleteItem(companySlug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: "", code: "", unitId: "", hsnCode: "", salesRate: "", taxRate: "" });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function getUnitSymbol(unitId: string | null) {
    if (!unitId) return "—";
    const unit = unitOptions.find((u) => u.id === unitId);
    return unit ? unit.symbol : unitId;
  }

  function formatCurrency(value: string | null) {
    if (!value) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `₹${num.toFixed(2)}`;
  }

  function formatPercent(value: string | null) {
    if (!value) return "—";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num}%`;
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: "", code: "", unitId: "", hsnCode: "", salesRate: "", taxRate: "" });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: Item) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code ?? "",
      unitId: row.unitId ?? "",
      hsnCode: row.hsnCode ?? "",
      salesRate: row.salesRate ?? "",
      taxRate: row.taxRate ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: Item) {
    setDeleting(row);
    setDeleteOpen(true);
  }

  function validate(): boolean {
    const newErrors: { name?: string } = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = { name: form.name, code: form.code, hsnCode: form.hsnCode, salesRate: form.salesRate, unitId: form.unitId };
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        payload,
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleteOpen(false) });
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Items</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <svg className="size-8 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Items</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load items: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <button onClick={openAdd} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Add Item
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Sales Rate</th>
              <th className="px-4 py-3">HSN Code</th>
              <th className="px-4 py-3">Tax Rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="text-sm">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">{item.code}</td>
                <td className="px-4 py-3">{getUnitSymbol(item.unitId)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.salesRate)}</td>
                <td className="px-4 py-3">{item.hsnCode}</td>
                <td className="px-4 py-3">{formatPercent(item.taxRate)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="rounded p-1 hover:bg-gray-200" title="Edit">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => openDelete(item)} className="rounded p-1 hover:bg-gray-200 text-red-600" title="Delete">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Item" : "Add Item"} onSubmit={handleSubmit} isPending={isPending}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
          <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Unit</label>
          <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select unit</option>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sales Rate</label>
          <input type="text" value={form.salesRate} onChange={(e) => setForm({ ...form, salesRate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">HSN Code</label>
          <input type="text" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tax Rate (%)</label>
          <input type="text" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Item" description={`Are you sure you want to delete "${deleting?.name}"?`} onConfirm={handleDelete} isPending={isPending} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
