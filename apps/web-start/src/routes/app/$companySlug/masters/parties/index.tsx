import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useParties, useCreateParty, useUpdateParty, useDeleteParty } from "@/lib/masters-hooks";
import type { Party } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/parties/")({
  component: PartiesPage,
});

function PartiesPage() {
  const { companySlug } = Route.useParams();
  const { data: parties = [], isLoading, error } = useParties(companySlug);
  const createMutation = useCreateParty(companySlug);
  const updateMutation = useUpdateParty(companySlug);
  const deleteMutation = useDeleteParty(companySlug);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [deleting, setDeleting] = useState<Party | null>(null);
  const [form, setForm] = useState({ name: "", type: "customer" as string, phone: "", email: "", gstin: "" });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openAdd() {
    setEditing(null);
    setForm({ name: "", type: "customer", phone: "", email: "", gstin: "" });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: Party) {
    setEditing(row);
    setForm({
      name: row.name,
      type: row.type,
      phone: row.phone ?? "",
      email: row.email ?? "",
      gstin: row.gstin ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: Party) {
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
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: form.name, type: form.type, phone: form.phone || null, email: form.email || null, gstin: form.gstin || null } },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: form.name, type: form.type, phone: form.phone || null, email: form.email || null, gstin: form.gstin || null },
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
      <div className="flex items-center justify-center py-12">
        <svg className="size-6 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load parties: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parties</h1>
        <button onClick={openAdd} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Add Party
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
               <th className="px-4 py-3">Name</th>
               <th className="px-4 py-3">Type</th>
               <th className="px-4 py-3">Phone</th>
               <th className="px-4 py-3">Email</th>
               <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {parties.map((party) => (
              <tr key={party.id} className="text-sm">
                 <td className="px-4 py-3 font-medium">{party.name}</td>
                 <td className="px-4 py-3">
                   <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${party.type === "customer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                     {party.type === "customer" ? "Customer" : "Vendor"}
                  </span>
                </td>
                 <td className="px-4 py-3">{party.phone || "-"}</td>
                 <td className="px-4 py-3">{party.email || "-"}</td>
                 <td className="px-4 py-3">{party.gstin || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${party.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {party.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(party)} className="rounded p-1 hover:bg-gray-200" title="Edit">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => openDelete(party)} className="rounded p-1 hover:bg-gray-200 text-red-600" title="Delete">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Party" : "Add Party"} onSubmit={handleSubmit} isPending={isPending}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full rounded-md border px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
           <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
           <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">GSTIN</label>
          <input type="text" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Party" description={`Are you sure you want to delete "${deleting?.name}"?`} onConfirm={handleDelete} isPending={isPending} confirmLabel="Delete" variant="danger" />
    </div>
  );
}