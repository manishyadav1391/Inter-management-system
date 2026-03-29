// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import { hasuraFetch } from "@/app/lib/hasura";
// import Link from "next/link";

// export default async function DepartmentDashboard() {
//   const session = await auth();
//   if (!session) redirect("/login");

//   const role = (session.user as any).role;
//   if (role !== "department") redirect("/dashboard/admin");

//   const hasuraToken = (session as any).hasuraToken;

//   const data = await hasuraFetch({
//     hasuraToken,
//     query: `
//       query {
//         interns(order_by: { created_at: desc }) {
//           id name gender phone start_date end_date
//           internship_status    { status }
//           institute { name   }
//         }
//         interns_aggregate {
//           aggregate { count }
//         }
//         active: interns_aggregate(
//           where: { status: { status: { _eq: "active" } } }
//         ) {
//           aggregate { count }
//         }
//         completed: interns_aggregate(
//           where: { status: { status: { _eq: "completed" } } }
//         ) {
//           aggregate { count }
//         }
//       }
//     `,
//   });

//   return (
//     <div>
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-800">
//           Department Dashboard
//         </h1>
//         <p className="text-gray-500 text-sm mt-1">
//           Manage your department's interns
//         </p>
//       </div>

//       {/* Stats row */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="bg-blue-50 rounded-lg p-4">
//           <p className="text-2xl font-bold text-blue-700">
//             {data.interns_aggregate.aggregate.count}
//           </p>
//           <p className="text-sm text-blue-600 mt-1">Total</p>
//         </div>
//         <div className="bg-green-50 rounded-lg p-4">
//           <p className="text-2xl font-bold text-green-700">
//             {data.active.aggregate.count}
//           </p>
//           <p className="text-sm text-green-600 mt-1">Active</p>
//         </div>
//         <div className="bg-purple-50 rounded-lg p-4">
//           <p className="text-2xl font-bold text-purple-700">
//             {data.completed.aggregate.count}
//           </p>
//           <p className="text-sm text-purple-600 mt-1">Completed</p>
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="font-semibold text-gray-800">Interns</h2>
//         <Link
//           href="/dashboard/department/interns/new"
//           className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
//         >
//           + Add Intern
//         </Link>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               {["Name", "Gender", "Institute", "Start Date", "Status", "Actions"].map((h) => (
//                 <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {data.interns.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-8 text-gray-400">
//                   No interns in your department yet
//                 </td>
//               </tr>
//             ) : (
//               data.interns.map((intern: any) => (
//                 <tr key={intern.id} className="hover:bg-gray-50">
//                   <td className="px-4 py-3 font-medium">{intern.name}</td>
//                   <td className="px-4 py-3 text-gray-600 capitalize">
//                     {intern.gender ?? "—"}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {intern.institute?.name ?? "—"}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {intern.start_date ?? "—"}
//                   </td>
//                   <td className="px-4 py-3">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                       intern.internship_status?.status === "active"
//                         ? "bg-green-100 text-green-700"
//                         : intern.status?.status === "completed"
//                         ? "bg-blue-100 text-blue-700"
//                         : "bg-gray-100 text-gray-600"
//                     }`}>
//                       {intern.status?.status ?? "—"}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3">
//                     <Link
//                       href={`/dashboard/department/interns/${intern.id}`}
//                       className="text-blue-600 hover:underline"
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







import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasuraFetch } from "@/app/lib/hasura";
import Link from "next/link";

export default async function DepartmentDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role !== "department") redirect("/dashboard/admin");

  const hasuraToken = (session as any).hasuraToken;

  const data = await hasuraFetch({
    hasuraToken,
    query: `
      query {
        interns(
          where: { deleted_at: { _is_null: true } }
          order_by: { created_at: desc }
        ) {
          id name gender phone start_date end_date
          internship_status { status }
          institute         { name   }
        }
        interns_aggregate(where: { deleted_at: { _is_null: true } }) {
          aggregate { count }
        }
      }
    `,
  });

  const interns      = data.interns;
  const totalInterns = data.interns_aggregate.aggregate.count;

  // Calculate stats from fetched data — no extra queries needed
  const activeInterns    = interns.filter(
    (i: any) => i.internship_status?.status === "active"
  ).length;
  const completedInterns = interns.filter(
    (i: any) => i.internship_status?.status === "completed"
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Department Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your department interns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-700">{totalInterns}</p>
          <p className="text-sm text-blue-600 mt-1">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-700">{activeInterns}</p>
          <p className="text-sm text-green-600 mt-1">Active</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-700">{completedInterns}</p>
          <p className="text-sm text-purple-600 mt-1">Completed</p>
        </div>
      </div>

      {/* Header + Add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800">Your Interns</h2>
        <Link
          href="/dashboard/department/interns/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          + Add Intern
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Gender", "Institute", "Start Date", "Status", "Actions"].map((h) => (
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
                  No interns in your department yet
                </td>
              </tr>
            ) : (
              interns.map((intern: any) => (
                <tr key={intern.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{intern.name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {intern.gender ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {intern.institute?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {intern.start_date ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      intern.internship_status?.status === "active"
                        ? "bg-green-100 text-green-700"
                        : intern.internship_status?.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {intern.internship_status?.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/department/interns/${intern.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}