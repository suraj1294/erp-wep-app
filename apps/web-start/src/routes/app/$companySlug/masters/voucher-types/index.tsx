import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useVoucherTypes, useCreateVoucherType, useUpdateVoucherType, useDeleteVoucherType } from "@/lib/masters-hooks";
import type { VoucherType } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/voucher-types/")({
  component: VoucherTypesPage,
});

const VOUCHER_CLASSES = ["Sales", "Purchase", "Payment", "Receipt", "Journal", "Credit Note", "Debit Note"] as const;

function VoucherTypesPage() {
  const { companySlug } = Route.useParams();
  const { data: voucherTypes = [], isLoading, error } = useVoucherTypes(companySlug);
  const createMutation = useCreateVoucherType(companySlug);
  const updateMutation = useUpdateVoucherType(companySlug);
  const deleteMutation = useDeleteVoucherType(companySlug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<VoucherType | null>(null);
  const [deleting, setDeleting] = useState<VoucherType | null>(null);
  const [form, setForm] = useState({ name: "", code: "", voucherClass: "", prefix: "", startingNumber: "" });
  const [errors, setErrors] = useState<{ name?: string; code?: string; voucherClass?: string }>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openAdd() {
    setEditing(null);
    setForm({ name: "", code: "", voucherClass: "", prefix: "", startingNumber: "" });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: VoucherType) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      voucherClass: row.voucherClass,
      prefix: row.prefix ?? "",
      startingNumber: String(row.startingNumber),
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: VoucherType) {
    setDeleting(row);
    setDeleteOpen(true);
  }

  function validate(): boolean {
    const newErrors: { name?: string; code?: string; voucherClass?: string } = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.code.trim()) newErrors.code = "Code is required";
    if (!form.voucherClass) newErrors.voucherClass = "Voucher class is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = {
      name: form.name,
      code: form.code,
      voucherClass: form.voucherClass,
      prefix: form.prefix || null,
      startingNumber: form.startingNumber ? Number(form.startingNumber) : null,
    };
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
          <h1 className="text-2xl font-bold">Voucher Types</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <svg className="size-8 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Voucher Types</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load voucher types: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voucher Types</h1>
        <button onClick={openAdd} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Add Voucher Type
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Prefix</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {voucherTypes.map((vt) => (
              <tr key={vt.id} className="text-sm">
                <td className="px-4 py-3 font-medium">{vt.name}</td>
                <td className="px-4 py-3 text-gray-600">{vt.code}</td>
                <td className="px-4 py-3">{vt.voucherClass}</td>
                <td className="px-4 py-3 text-gray-600">{vt.prefix ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${vt.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {vt.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(vt)} className="rounded p-1 hover:bg-gray-200" title="Edit">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => openDelete(vt)} className="rounded p-1 hover:bg-gray-200 text-red-600" title="Delete">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Voucher Type" : "Add Voucher Type"} onSubmit={handleSubmit} isPending={isPending}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
          <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.code ? "border-red-500" : "border-gray-300"}`} />
          {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Voucher Class <span className="text-red-500">*</span></label>
          <select value={form.voucherClass} onChange={(e) => setForm({ ...form, voucherClass: e.target.value })} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.voucherClass ? "border-red-500" : "border-gray-300"}`}>
            <option value="">Select voucher class</option>
            {VOUCHER_CLASSES.map((vc) => (
              <option key={vc} value={vc}>{vc}</option>
            ))}
          </select>
          {errors.voucherClass && <p className="mt-1 text-xs text-red-500">{errors.voucherClass}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Prefix</label>
          <input type="text" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Starting Number</label>
          <input type="number" value={form.startingNumber} onChange={(e) => setForm({ ...form, startingNumber: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Voucher Type" description={`Are you sure you want to delete "${deleting?.name}"?`} onConfirm={handleDelete} isPending={isPending} confirmLabel="Delete" variant="danger" />
    </div>
  );
}
