export type MasterResource =
  | "account-groups"
  | "accounts"
  | "voucher-types"
  | "parties"
  | "items"
  | "units";

export const queryKeys = {
  companies: {
    all: ["companies"] as const,
    accessible: () => [...queryKeys.companies.all, "accessible"] as const,
    active: () => [...queryKeys.companies.all, "active"] as const,
  },
  company: (companySlug: string) => {
    const root = ["company", companySlug] as const;

    return {
      root,
      dashboard: () => [...root, "dashboard"] as const,
      masters: {
        all: () => [...root, "masters"] as const,
        resource: (resource: MasterResource) =>
          [...root, "masters", resource] as const,
        options: (resource: "account-groups" | "units") =>
          [...root, "masters", resource, "options"] as const,
      },
    };
  },
};
