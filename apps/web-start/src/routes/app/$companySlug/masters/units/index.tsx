import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/lib/masters-hooks";
import type { Unit } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/units/")({
  component: UnitsPage,
});

function UnitsPage() {
  const { companySlug } = Route.useParams();
  const { data: units = [], isLoading, error } = useUnits(companySlug);
  const createMutation = useCreateUnit(companySlug);
  const updateMutation = useUpdateUnit(companySlug);
  const deleteMutation = useDeleteUnit(companySlug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    decimalPlaces: 0,
    isBaseUnit: false,
    conversionFactor: "1",
  });
  const [errors, setErrors] = useState<{ name?: string; symbol?: string }>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openAdd() {
    setEditing(null);
    setForm({ name: "", symbol: "", decimalPlaces: 0, isBaseUnit: false, conversionFactor: "1" });
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: Unit) {
    setEditing(row);
    setForm({
      name: row.name,
      symbol: row.symbol,
      decimalPlaces: row.decimalPlaces,
      isBaseUnit: row.isBaseUnit,
      conversionFactor: row.conversionFactor,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: Unit) {
    setDeleting(row);
    setDeleteOpen(true);
  }

  function validate(): boolean {
    const newErrors: { name?: string; symbol?: string } = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.symbol.trim()) newErrors.symbol = "Symbol is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: form.name, symbol: form.symbol, decimalPlaces: form.decimalPlaces, isBaseUnit: form.isBaseUnit, conversionFactor: form.conversionFactor } },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: form.name, symbol: form.symbol, decimalPlaces: form.decimalPlaces, isBaseUnit: form.isBaseUnit, conversionFactor: form.conversionFactor },
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
          <h1 className="text-2xl font-bold">Units of Measure</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <svg className="size-6 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Units of Measure</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load units: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Units of Measure</h1>
        <button onClick={openAdd} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Add Unit
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Decimal Places</th>
              <th className="px-4 py-3">Base Unit</th>
              <th className="px-4 py-3">Conversion Factor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {units.map((unit) => (
              <tr key={unit.id} className="text-sm">
                <td className="px-4 py-3 font-medium">{unit.name}</td>
                <td className="px-4 py-3 text-gray-600">{unit.symbol}</td>
                <td className="px-4 py-3 text-gray-600">{unit.decimalPlaces}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${unit.isBaseUnit ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {unit.isBaseUnit ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{unit.conversionFactor}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${unit.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {unit.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(unit)} className="rounded p-1 hover:bg-gray-200" title="Edit">
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => openDelete(unit)} className="rounded p-1 hover:bg-gray-200 text-red-600" title="Delete">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Unit" : "Add Unit"} onSubmit={handleSubmit} isPending={isPending}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kilograms" className={`w-full rounded-md border px-3 py-2 text-sm ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Symbol <span className="text-red-500">*</span></label>
          <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. kg" className={`w-full rounded-md border px-3 py-2 text-sm ${errors.symbol ? "border-red-500" : "border-gray-300"}`} />
          {errors.symbol && <p className="mt-1 text-xs text-red-500">{errors.symbol}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Decimal Places</label>
          <input type="number" value={form.decimalPlaces} onChange={(e) => setForm({ ...form, decimalPlaces: Number(e.target.value) })} min={0} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isBaseUnit" checked={form.isBaseUnit} onChange={(e) => setForm({ ...form, isBaseUnit: e.target.checked })} className="size-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <label htmlFor="isBaseUnit" className="text-sm font-medium text-gray-700">Base Unit</label>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Conversion Factor</label>
          <input type="text" value={form.conversionFactor} onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Unit" description={`Are you sure you want to delete "${deleting?.name}"?`} onConfirm={handleDelete} isPending={isPending} confirmLabel="Delete" variant="danger" />
    </div>
  );
}