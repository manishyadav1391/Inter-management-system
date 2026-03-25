import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        departments(order_by: { name: asc }) {
          id
          name
         head_id
      head {
        id
        email
      }
          interns_aggregate {
            aggregate { count }
          }
        }
      }
    `,
  });

  const departments = data.departments;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm mt-1">
            {departments.length} department{departments.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/dashboard/admin/departments/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          + Add Department
        </Link>
      </div>

      {/* Department Cards Grid */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">No departments yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create your first department to get started
          </p>
          <Link
            href="/dashboard/admin/departments/new"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            + Add Department
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept: any) => (
            <DepartmentCard key={dept.id} dept={dept} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentCard({ dept }: { dept: any }) {
  const internCount = dept.interns_aggregate?.aggregate?.count ?? 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 transition">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">{dept.name}</h2>
          {dept.head_id ? (
            <p className="text-xs text-gray-500 mt-1">
              Head: {dept.head.email}
            </p>
          ) : (
            <p className="text-xs text-amber-500 mt-1">
              No head assigned
            </p>
          )}
        </div>
        {/* Intern count badge */}
        <div className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
          {internCount} intern{internCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <Link
          href={`/dashboard/admin/departments/${dept.id}`}
          className="flex-1 text-center text-sm text-blue-600 border border-blue-200 rounded py-1.5 hover:bg-blue-50 transition"
        >
          Assign Head
        </Link>
        <Link
          href={`/dashboard/admin/interns?department=${dept.id}`}
          className="flex-1 text-center text-sm text-gray-600 border border-gray-200 rounded py-1.5 hover:bg-gray-50 transition"
        >
          View Interns
        </Link>
      </div>
    </div>
  );
}