import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";
import InternFilters from "@/app/components/InternFilters";

type SearchParams = {
  search?: string;
  gender?: string;
  department?: string;
};

export default async function InternsPage({
  searchParams,
}: {
 searchParams: Promise<SearchParams>;
}) {
  // 🔐 Auth check
  const session = await auth();
  if (!session) redirect("/login");

  const hasuraToken = (session as any).hasuraToken;

   // ✅ IMPORTANT FIX
  const params = await searchParams;

  const search = params.search ?? "";
  const gender = params.gender ?? "";
  const deptId = params.department ?? "";
  // ✅ Build dynamic where clause (safe)
  const andConditions: any[] = [];

  // Always hide soft-deleted interns from UI listings.
  andConditions.push({ deleted_at: { _is_null: true } });

  if (search) {
    andConditions.push({
      _or: [
        { name: { _ilike: `%${search}%` } },
        { user: { email: { _ilike: `%${search}%` } } }, // nested email
      ],
    });
  }

  if (gender) {
    andConditions.push({ gender: { _eq: gender } });
  }

  if (deptId) {
    andConditions.push({ department_id: { _eq: deptId } });
  }

  const where = andConditions.length ? { _and: andConditions } : {};

  // 📡 Fetch data
  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query GetInterns($where: interns_bool_exp) {
        interns(where: $where, order_by: { created_at: desc }) {
          id
          name
          gender
          phone
          start_date
          end_date
          internship_status {
            status
          }
          department {
            name
          }
          institute {
            name
          }
          user {
            email
          }
        }
        departments(where: { deleted_at: { _is_null: true } }) {
          id
          name
        }
      }
    `,
    variables: { where },
  });

  const interns = data?.interns ?? [];
  const departments = data?.departments ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Interns</h1>

        <Link
          href="/dashboard/admin/interns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          + Add Intern
        </Link>
      </div>

      {/* Filters */}
      <InternFilters departments={departments} />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Department", "Gender", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {interns.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  No interns found
                </td>
              </tr>
            ) : (
              interns.map((intern: any) => {
                const status = intern.internship_status?.status;

                return (
                  <tr key={intern.id} className="hover:bg-gray-50">
                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {intern.name}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-gray-600">
                      {intern.user?.email ?? "—"}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-gray-600">
                      {intern.department?.name ?? "—"}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {intern.gender ?? "—"}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === "active"
                            ? "bg-green-100 text-green-700"
                            : status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status ?? "—"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/admin/interns/${intern.id}`}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        View / Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

