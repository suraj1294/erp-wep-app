import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

function masterKey(companySlug: string) {
  return queryKeys.company(companySlug).masters;
}

export function useAccountGroups(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("account-groups"),
    queryFn: () => api.getAccountGroups(companySlug),
  });
}

export function useCreateAccountGroup(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createAccountGroup>[1]) =>
      api.createAccountGroup(companySlug, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: masterKey(companySlug).resource("account-groups"),
      }),
  });
}

export function useUpdateAccountGroup(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateAccountGroup>[2] }) =>
      api.updateAccountGroup(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: masterKey(companySlug).resource("account-groups"),
      }),
  });
}

export function useDeleteAccountGroup(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAccountGroup(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: masterKey(companySlug).resource("account-groups"),
      }),
  });
}

export function useAccounts(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("accounts"),
    queryFn: async () => {
      const result = await api.getAccounts(companySlug);
      return result.accounts;
    },
  });
}

export function useAccountGroupOptions(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).options("account-groups"),
    queryFn: async () => {
      const result = await api.getAccounts(companySlug);
      return result.accountGroups;
    },
  });
}

export function useCreateAccount(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createAccount>[1]) =>
      api.createAccount(companySlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("accounts") });
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).options("account-groups") });
    },
  });
}

export function useUpdateAccount(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateAccount>[2] }) =>
      api.updateAccount(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("accounts") }),
  });
}

export function useDeleteAccount(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAccount(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("accounts") }),
  });
}

export function useVoucherTypes(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("voucher-types"),
    queryFn: () => api.getVoucherTypes(companySlug),
  });
}

export function useCreateVoucherType(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createVoucherType>[1]) =>
      api.createVoucherType(companySlug, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("voucher-types") }),
  });
}

export function useUpdateVoucherType(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateVoucherType>[2] }) =>
      api.updateVoucherType(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("voucher-types") }),
  });
}

export function useDeleteVoucherType(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVoucherType(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("voucher-types") }),
  });
}

export function useParties(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("parties"),
    queryFn: () => api.getParties(companySlug),
  });
}

export function useCreateParty(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createParty>[1]) =>
      api.createParty(companySlug, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("parties") }),
  });
}

export function useUpdateParty(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateParty>[2] }) =>
      api.updateParty(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("parties") }),
  });
}

export function useDeleteParty(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteParty(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("parties") }),
  });
}

export function useItems(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("items"),
    queryFn: async () => {
      const result = await api.getItems(companySlug);
      return result.items;
    },
  });
}

export function useUnitOptions(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).options("units"),
    queryFn: async () => {
      const result = await api.getItems(companySlug);
      return result.units;
    },
  });
}

export function useCreateItem(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createItem>[1]) =>
      api.createItem(companySlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("items") });
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).options("units") });
    },
  });
}

export function useUpdateItem(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateItem>[2] }) =>
      api.updateItem(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("items") }),
  });
}

export function useDeleteItem(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteItem(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("items") }),
  });
}

export function useUnits(companySlug: string) {
  return useQuery({
    queryKey: masterKey(companySlug).resource("units"),
    queryFn: () => api.getUnits(companySlug),
  });
}

export function useCreateUnit(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createUnit>[1]) =>
      api.createUnit(companySlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("units") });
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).options("units") });
    },
  });
}

export function useUpdateUnit(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateUnit>[2] }) =>
      api.updateUnit(companySlug, id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("units") }),
  });
}

export function useDeleteUnit(companySlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUnit(companySlug, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKey(companySlug).resource("units") }),
  });
}
