const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

const numberFormatter = new Intl.NumberFormat("en-IN")

export function safeParseFloat(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const parsed = Number.parseFloat(String(value).trim())
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatINR(value: unknown) {
  return inrFormatter.format(safeParseFloat(value))
}

export function formatNumber(value: unknown) {
  return numberFormatter.format(safeParseFloat(value))
}
