import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";

export default async function InstitutesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "admin") redirect("/dashboard/department");

  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        institutes(
          where: { deleted_at: { _is_null: true } }
          order_by: { name: asc }
        ) {
          id
          name
          location
          interns_aggregate(where: { deleted_at: { _is_null: true } }) {
            aggregate { count }
          }
        }
      }
    `,
  });

  const institutes = data.institutes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Institutes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {institutes.length} institute{institutes.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/dashboard/admin/institutes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          + Add Institute
        </Link>
      </div>

      {institutes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No institutes yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create your first institute to assign interns correctly
          </p>
          <Link
            href="/dashboard/admin/institutes/new"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            + Add Institute
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutes.map((institute: any) => (
            <div
              key={institute.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg">{institute.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {institute.location || "Location not set"}
                  </p>
                </div>
                <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                  {institute.interns_aggregate?.aggregate?.count ?? 0} intern
                  {(institute.interns_aggregate?.aggregate?.count ?? 0) !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Link
                  href={`/dashboard/admin/institutes/${institute.id}`}
                  className="flex-1 text-center text-sm text-blue-600 border border-blue-200 rounded py-1.5 hover:bg-blue-50 transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/dashboard/admin/interns`}
                  className="flex-1 text-center text-sm text-gray-600 border border-gray-200 rounded py-1.5 hover:bg-gray-50 transition"
                >
                  View Interns
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
