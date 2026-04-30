"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as masterApi from "@/lib/api/masters"
import { getMasterResource } from "@/lib/api/master-data"
import { companyKeys, type MasterResource } from "@/lib/query-keys"

type MasterMutation = {
  id?: string
  data?: unknown
}

function getCreateMutation(resource: MasterResource) {
  const api = {
    "account-groups": masterApi.createAccountGroup,
    accounts: masterApi.createAccount,
    items: masterApi.createItem,
    locations: masterApi.createLocation,
    parties: masterApi.createParty,
    units: masterApi.createUnit,
    "voucher-types": masterApi.createVoucherType,
  }

  return api[resource] as (companySlug: string, data: unknown) => Promise<unknown>
}

function getUpdateMutation(resource: MasterResource) {
  const api = {
    "account-groups": masterApi.updateAccountGroup,
    accounts: masterApi.updateAccount,
    items: masterApi.updateItem,
    locations: masterApi.updateLocation,
    parties: masterApi.updateParty,
    units: masterApi.updateUnit,
    "voucher-types": masterApi.updateVoucherType,
  }

  return api[resource] as (
    companySlug: string,
    id: string,
    data: unknown
  ) => Promise<unknown>
}

function getDeleteMutation(resource: MasterResource) {
  const api = {
    "account-groups": masterApi.deleteAccountGroup,
    accounts: masterApi.deleteAccount,
    items: masterApi.deleteItem,
    locations: masterApi.deleteLocation,
    parties: masterApi.deleteParty,
    units: masterApi.deleteUnit,
    "voucher-types": masterApi.deleteVoucherType,
  }

  return api[resource] as (companySlug: string, id: string) => Promise<unknown>
}

export function useMasterResource<T = unknown[]>(
  companySlug: string,
  resource: MasterResource
) {
  return useQuery({
    queryKey: companyKeys.master(companySlug, resource),
    queryFn: () => getMasterResource<T>(companySlug, resource),
  })
}

export function useCreateMaster(companySlug: string, resource: MasterResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data }: MasterMutation) => {
      if (!data) {
        throw new Error("Master data is required.")
      }

      return getCreateMutation(resource)(companySlug, data)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: companyKeys.master(companySlug, resource),
      }),
  })
}

export function useUpdateMaster(companySlug: string, resource: MasterResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: MasterMutation) => {
      if (!id || !data) {
        throw new Error("Master id and data are required.")
      }

      return getUpdateMutation(resource)(companySlug, id, data)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: companyKeys.master(companySlug, resource),
      }),
  })
}

export function useDeleteMaster(companySlug: string, resource: MasterResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: MasterMutation) => {
      if (!id) {
        throw new Error("Master id is required.")
      }

      return getDeleteMutation(resource)(companySlug, id)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: companyKeys.master(companySlug, resource),
      }),
  })
}
