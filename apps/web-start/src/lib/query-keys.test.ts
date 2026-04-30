import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("keeps company queries scoped by slug", () => {
    const acme = queryKeys.company("acme-corp-ltd");
    const beta = queryKeys.company("beta-industries");

    expect(acme.dashboard()).toEqual(["company", "acme-corp-ltd", "dashboard"]);
    expect(beta.dashboard()).toEqual(["company", "beta-industries", "dashboard"]);
  });

  it("uses stable resource and option keys for master data", () => {
    const masters = queryKeys.company("acme-corp-ltd").masters;

    expect(masters.all()).toEqual(["company", "acme-corp-ltd", "masters"]);
    expect(masters.resource("parties")).toEqual([
      "company",
      "acme-corp-ltd",
      "masters",
      "parties",
    ]);
    expect(masters.options("units")).toEqual([
      "company",
      "acme-corp-ltd",
      "masters",
      "units",
      "options",
    ]);
  });

  it("keeps workspace-level company keys separate from company-scoped data", () => {
    expect(queryKeys.companies.accessible()).toEqual(["companies", "accessible"]);
    expect(queryKeys.companies.active()).toEqual(["companies", "active"]);
  });
});
