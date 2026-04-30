"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { CreateVoucherInput, UpdateVoucherInput } from "@workspace/db"
import {
  cancelVoucher,
  createVoucher,
  updateVoucher,
} from "@/lib/api/vouchers"
import {
  getVoucherDetail,
  getVoucherFormData,
  getVoucherList,
} from "@/lib/api/voucher-data"
import { companyKeys } from "@/lib/query-keys"

export function useVoucherList<T = unknown[]>(
  companySlug: string,
  voucherClass: string
) {
  return useQuery({
    queryKey: companyKeys.voucherList(companySlug, { voucherClass }),
    queryFn: () => getVoucherList<T>(companySlug, voucherClass),
  })
}

export function useVoucherFormData(
  companySlug: string,
  voucherClass: string
) {
  return useQuery({
    queryKey: companyKeys.voucherFormData(companySlug, voucherClass),
    queryFn: () => getVoucherFormData(companySlug, voucherClass),
  })
}

export function useVoucherDetail(companySlug: string, voucherId: string) {
  return useQuery({
    queryKey: companyKeys.voucherDetail(companySlug, voucherId),
    queryFn: () => getVoucherDetail(companySlug, voucherId),
  })
}

export function useCreateVoucher(companySlug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateVoucherInput) => createVoucher(companySlug, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: companyKeys.vouchers(companySlug),
      }),
  })
}

export function useUpdateVoucher(companySlug: string, voucherId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateVoucherInput) =>
      updateVoucher(companySlug, voucherId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.vouchers(companySlug),
      })
      queryClient.invalidateQueries({
        queryKey: companyKeys.voucherDetail(companySlug, voucherId),
      })
    },
  })
}

export function useCancelVoucher(companySlug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (voucherId: string) => cancelVoucher(companySlug, voucherId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: companyKeys.vouchers(companySlug),
      }),
  })
}
