import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, useAccountGroupOptions } from "@/lib/masters-hooks";
import type { Account } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/accounts/")({
  component: AccountsPage,
});

interface FormState {
  name: string;
  code: string;
  groupId: string;
  openingBalance: string;
}

interface FormErrors {
  name?: string;
  groupId?: string;
}

const defaultForm: FormState = {
  name: "",
  code: "",
  groupId: "",
  openingBalance: "",
};

function AccountsPage() {
  const { companySlug } = Route.useParams();
  const { data: accounts = [], isLoading, error } = useAccounts(companySlug);
  const { data: groupOptions = [] } = useAccountGroupOptions(companySlug);
  const createMutation = useCreateAccount(companySlug);
  const updateMutation = useUpdateAccount(companySlug);
  const deleteMutation = useDeleteAccount(companySlug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openAdd() {
    setEditing(null);
    setForm(defaultForm);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: Account) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code ?? "",
      groupId: row.groupId ?? "",
      openingBalance: row.openingBalance,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: Account) {
    setDeleting(row);
    setDeleteOpen(true);
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.groupId) newErrors.groupId = "Group is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = { name: form.name, code: form.code || null, groupId: form.groupId, openingBalance: form.openingBalance };
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
          <h1 className="text-2xl font-bold">Accounts</h1>
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
          <h1 className="text-2xl font-bold">Accounts</h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load accounts: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={openAdd}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add Account
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Opening Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {accounts.map((account) => {
              const group = groupOptions.find((g) => g.id === account.groupId);
              return (
                <tr key={account.id} className="text-sm">
                  <td className="px-4 py-3 font-medium">{account.name}</td>
                  <td className="px-4 py-3 text-gray-600">{account.code}</td>
                  <td className="px-4 py-3">{group?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {parseFloat(account.openingBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      account.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {account.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(account)}
                        className="rounded p-1 hover:bg-gray-200"
                        title="Edit"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDelete(account)}
                        className="rounded p-1 hover:bg-gray-200 text-red-600"
                        title="Delete"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Account" : "Add Account"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cash - Main"
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.name ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CASH001"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Group <span className="text-red-500">*</span>
          </label>
          <select
            value={form.groupId}
            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.groupId ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select group</option>
            {groupOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {errors.groupId && <p className="mt-1 text-xs text-red-500">{errors.groupId}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Opening Balance</label>
          <input
            type="number"
            value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}