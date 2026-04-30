import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
      <div className="flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-3xl shadow-lg">
          T
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Tally ERP</h1>
          <p className="mt-3 text-lg text-gray-600">
            A comprehensive web-based ERP solution for financial management,
            inventory control, sales, and purchases.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 shadow-sm"
          >
            Sign In
          </a>
          <a
            href="/app/acme-corp?demo=1"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Try Demo
          </a>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-teal-600">Masters</div>
            <p className="mt-1 text-sm text-gray-500">Account groups, ledgers, parties</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-600">Vouchers</div>
            <p className="mt-1 text-sm text-gray-500">Sales, purchases, payments</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-600">Reports</div>
            <p className="mt-1 text-sm text-gray-500">Chart of accounts, balances</p>
          </div>
        </div>
      </div>
    </div>
  );
}