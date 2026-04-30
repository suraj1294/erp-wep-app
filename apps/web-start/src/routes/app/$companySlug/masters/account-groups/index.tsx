import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";
import { useAccountGroups, useCreateAccountGroup, useUpdateAccountGroup, useDeleteAccountGroup } from "@/lib/masters-hooks";
import type { AccountGroup } from "@/lib/api";

export const Route = createFileRoute("/app/$companySlug/masters/account-groups/")({
  component: AccountGroupsPage,
});

interface FormState {
  name: string;
  code: string;
  accountType: string;
  nature: string;
}

interface FormErrors {
  name?: string;
  accountType?: string;
  nature?: string;
}

const defaultForm: FormState = {
  name: "",
  code: "",
  accountType: "",
  nature: "",
};

function AccountGroupsPage() {
  const { companySlug } = Route.useParams();
  const { data: groups = [], isLoading, error } = useAccountGroups(companySlug);
  const createMutation = useCreateAccountGroup(companySlug);
  const updateMutation = useUpdateAccountGroup(companySlug);
  const deleteMutation = useDeleteAccountGroup(companySlug);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<AccountGroup | null>(null);
  const [deleting, setDeleting] = useState<AccountGroup | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function openAdd() {
    setEditing(null);
    setForm(defaultForm);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(row: AccountGroup) {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code ?? "",
      accountType: row.accountType,
      nature: row.nature,
    });
    setErrors({});
    setDialogOpen(true);
  }

  function openDelete(row: AccountGroup) {
    setDeleting(row);
    setDeleteOpen(true);
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.accountType) newErrors.accountType = "Account type is required";
    if (!form.nature) newErrors.nature = "Nature is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: form.name, code: form.code || null, accountType: form.accountType, nature: form.nature } },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(
        { name: form.name, code: form.code || null, accountType: form.accountType, nature: form.nature },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  }

  function handleDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleteOpen(false) });
  }

  const accountTypes = ["asset", "liability", "equity", "income", "expense"];
  const natures = ["debit", "credit"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load account groups: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account Groups</h1>
        <button
          onClick={openAdd}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add Group
        </button>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Account Type</th>
              <th className="px-4 py-3">Nature</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {groups.map((group) => (
              <tr key={group.id} className="text-sm">
                <td className="px-4 py-3 font-medium">{group.name}</td>
                <td className="px-4 py-3 text-gray-600">{group.code}</td>
                <td className="px-4 py-3 capitalize">{group.accountType}</td>
                <td className="px-4 py-3 capitalize">{group.nature}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    group.isSystem
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {group.isSystem ? "System" : "Custom"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    group.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {group.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(group)}
                      className="rounded p-1 hover:bg-gray-200"
                      title="Edit"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDelete(group)}
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
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Account Group" : "Add Account Group"}
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
            placeholder="e.g. Current Assets"
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
            placeholder="e.g. CA"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Account Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.accountType}
            onValueChange={(v) => setForm({ ...form, accountType: v })}
            placeholder="Select account type"
          >
            {accountTypes.map((type) => (
              <SelectItem key={type} value={type} onSelect={(v) => setForm({ ...form, accountType: v })}>
                <span className="capitalize">{type}</span>
              </SelectItem>
            ))}
          </Select>
          {errors.accountType && <p className="mt-1 text-xs text-red-500">{errors.accountType}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nature <span className="text-red-500">*</span>
          </label>
          <Select
            value={form.nature}
            onValueChange={(v) => setForm({ ...form, nature: v })}
            placeholder="Select nature"
          >
            {natures.map((nature) => (
              <SelectItem key={nature} value={nature} onSelect={(v) => setForm({ ...form, nature: v })}>
                <span className="capitalize">{nature}</span>
              </SelectItem>
            ))}
          </Select>
          {errors.nature && <p className="mt-1 text-xs text-red-500">{errors.nature}</p>}
        </div>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Account Group"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}