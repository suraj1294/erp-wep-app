import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$companySlug/masters/")({
  component: MastersIndex,
});

function MastersIndex() {
  Route.useParams();
  return (
    <div>
      <h1 className="text-xl font-semibold">Masters</h1>
      <p className="text-gray-600">Select a master to manage</p>
    </div>
  );
}
