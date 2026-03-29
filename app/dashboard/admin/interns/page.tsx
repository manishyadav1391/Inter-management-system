// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import { hasuraFetch } from "@/app/lib/hasura";
// import Link from "next/link";
// import InternFilters from "@/app/components/InternFilters";

// // Receive filter values from URL query params
// export default async function InternsPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ search?: string; gender?: string; department?: string }>;
// }) {
//   const session = await auth();
//   if (!session) redirect("/login");

//   const params      = await searchParams;
//   const hasuraToken = (session as any).hasuraToken;
//   const search      = params.search     ?? "";
//   const gender      = params.gender     ?? "";
//   const deptId      = params.department ?? "";

//   // Build dynamic where clause
//   const where: any = { _and: [] };
//   if (search)  where._and.push({ _or: [
//     { full_name: { _ilike: `%${search}%` } },
//     { email:     { _ilike: `%${search}%` } },
//   ]});
//   if (gender)  where._and.push({ gender:        { _eq: gender } });
//   if (deptId)  where._and.push({ department_id: { _eq: deptId } });

//   const data = await hasuraFetch({
//     hasuraToken,
//    query: `
//   query GetInterns($where: interns_bool_exp) {
//     interns(where: $where, order_by: { created_at: desc }) {
//       id name gender phone start_date end_date
//       internship_status{ status }          ← was: status (text)
//       department { name }
//       institute  { name }
//        user       { email  }
//     }
//     departments { id name }
//   }
// `,
//     variables: { where },
//   });

//   const interns     = data.interns;
//   const departments = data.departments;

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">Interns</h1>
//         <Link
//           href="/dashboard/admin/interns/new"
//           className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
//         >
//           + Add Intern
//         </Link>
//       </div>

//       {/* Filters — client component */}
//       <InternFilters departments={departments} />

//       {/* Table */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               {["Name", "Email", "Department", "Gender", "Status", "Actions"].map(h => (
//                 <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {interns.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-8 text-gray-400">
//                   No interns found
//                 </td>
//               </tr>
//             ) : (
//               interns.map((intern: any) => (
//                 <tr key={intern.id} className="hover:bg-gray-50">
//                   <td className="px-4 py-3 font-medium text-gray-800">
//                     {intern.name}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">{intern.email}</td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {intern.department?.name ?? "—"}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600 capitalize">
//                     {intern.gender ?? "—"}
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                       intern.internship_status?.status === "active"
//                         ? "bg-green-100 text-green-700"
//                         : intern.status?.status === "completed"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-gray-100 text-gray-600"
//                     }`}>
//                       {intern.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <Link
//                       href={`/dashboard/admin/interns/${intern.id}`}
//                       className="text-blue-600 hover:underline mr-3"
//                     >
//                       Edit
//                     </Link>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }





// // import { auth } from "@/auth";
// // import { redirect } from "next/navigation";
// // import { hasuraFetch } from "@/app/lib/hasura";
// // import Link from "next/link";
// // import InternFilters from "@/app/components/InternFilters";

// // export default async function InternsPage({
// //   searchParams,
// // }: {
// //   searchParams: Promise<{ search?: string; gender?: string; department?: string }>;
// // }) {
// //   const session = await auth();
// //   if (!session) redirect("/login");

// //   const params      = await searchParams;
// //   const hasuraToken = (session as any).hasuraToken;
// //   const search      = params.search     ?? "";
// //   const gender      = params.gender     ?? "";
// //   const deptId      = params.department ?? "";

// //   // Build dynamic where clause — only add conditions that exist
// //   const conditions: any[] = [];
// //   if (search) conditions.push({
// //     _or: [{ name: { _ilike: `%${search}%` } }]
// //   });
// //   if (gender) conditions.push({ gender:        { _eq: gender } });
// //   if (deptId) conditions.push({ department_id: { _eq: deptId } });

// //   const where = conditions.length > 0 ? { _and: conditions } : {};

// //   const data = await hasuraFetch({
// //     hasuraToken,
// //     query: `
// //       query GetInterns($where: interns_bool_exp) {
// //         interns(where: $where, order_by: { created_at: desc }) {
// //           id name gender phone start_date end_date
// //           internship_status { status }
// //           department        { name   }
// //           institute         { name   }
// //         }
// //         departments { id name }
// //       }
// //     `,
// //     variables: { where },
// //   });

// //   const interns     = data.interns;
// //   const departments = data.departments;

// //   return (
// //     <div>
// //       <div className="flex items-center justify-between mb-6">
// //         <h1 className="text-2xl font-bold text-gray-800">Interns</h1>
// //         <Link
// //           href="/dashboard/admin/interns/new"
// //           className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
// //         >
// //           + Add Intern
// //         </Link>
// //       </div>

// //       <InternFilters departments={departments} />

// //       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
// //         <table className="w-full text-sm">
// //           <thead className="bg-gray-50 border-b border-gray-200">
// //             <tr>
// //               {["Name", "Department", "Gender", "Status", "Actions"].map(h => (
// //                 <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
// //                   {h}
// //                 </th>
// //               ))}
// //             </tr>
// //           </thead>
// //           <tbody className="divide-y divide-gray-100">
// //             {interns.length === 0 ? (
// //               <tr>
// //                 <td colSpan={5} className="text-center py-8 text-gray-400">
// //                   No interns found
// //                 </td>
// //               </tr>
// //             ) : (
// //               interns.map((intern: any) => (
// //                 <tr key={intern.id} className="hover:bg-gray-50">
// //                   <td className="px-4 py-3 font-medium text-gray-800">
// //                     {intern.name}
// //                   </td>
// //                   <td className="px-4 py-3 text-gray-600">
// //                     {intern.department?.name ?? "—"}
// //                   </td>
// //                   <td className="px-4 py-3 text-gray-600 capitalize">
// //                     {intern.gender ?? "—"}
// //                   </td>
// //                   <td className="px-4 py-3">
// //                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
// //                       intern.internship_status?.status === "active"
// //                         ? "bg-green-100 text-green-700"
// //                         : intern.internship_status?.status === "completed"
// //                         ? "bg-blue-100 text-blue-700"
// //                         : "bg-gray-100 text-gray-600"
// //                     }`}>
// //                       {intern.internship_status?.status ?? "—"}
// //                     </span>
// //                   </td>
// //                   <td className="px-4 py-3">
// //                     <Link
// //                       href={`/dashboard/admin/interns/${intern.id}`}
// //                       className="text-blue-600 hover:underline"
// //                     >
// //                       Edit
// //                     </Link>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>
// //     </div>
// //   );
// // }








import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";
import InternFilters from "@/app/components/InternFilters";

type SearchParams = {
  search?: string;
  gender?: string;
  department?: string;
  institute?: string; // 🆕 Added institute filter type
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
  const instId = params.institute ?? ""; // 🆕 Extract institute param

  // ✅ Build dynamic where clause (safe)
  const andConditions: any[] = [];

  // Always hide soft-deleted interns from UI listings.
  andConditions.push({ deleted_at: { _is_null: true } });

  if (search) {
    andConditions.push({
      _or: [
        { name: { _ilike: `%${search}%` } },
        { user: { email: { _ilike: `%${search}%` } } },
      ],
    });
  }

  if (gender) {
    andConditions.push({ gender: { _eq: gender } });
  }

  if (deptId) {
    andConditions.push({ department_id: { _eq: deptId } });
  }

  // 🆕 Add institute condition
  if (instId) {
    andConditions.push({ institute_id: { _eq: instId } });
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
        # 🆕 Fetch institutes for the filter dropdown
        institutes(where: { deleted_at: { _is_null: true } }) {
          id
          name
        }
      }
    `,
    variables: { where },
  });

  const interns = data?.interns ?? [];
  const departments = data?.departments ?? [];
  const institutes = data?.institutes ?? []; // 🆕

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
      {/* 🆕 Pass institutes to the filter component */}
      <InternFilters departments={departments} institutes={institutes} />

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* 🆕 Added "Institute" to headers */}
              {["Name", "Email", "Department", "Institute", "Gender", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {interns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No interns found
                </td>
              </tr>
            ) : (
              interns.map((intern: any) => {
                const status = intern.internship_status?.status;

                return (
                  <tr key={intern.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {intern.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {intern.user?.email ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {intern.department?.name ?? "—"}
                    </td>

                    {/* 🆕 Institute Cell */}
                    <td className="px-4 py-3 text-gray-600">
                      {intern.institute?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {intern.gender ?? "—"}
                    </td>

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

