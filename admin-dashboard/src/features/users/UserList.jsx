import { useEffect, useMemo, useState } from "react";
import { usersAPI } from "./usersAPI";

const ITEMS_PER_PAGE = 8;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SEARCH + SORT
  ========================= */
  const filteredUsers = useMemo(() => {
    let data = [...users];

    // Search
    if (search) {
      data = data.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    data.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === "createdAt") {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [users, search, sortKey, sortOrder]);

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="h-40 animate-pulse bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-white shadow-md rounded-xl px-6 py-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-800">
            {filteredUsers.length}
          </p>
        </div>

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-gray-900 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {paginatedUsers.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    Email
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    Role
                  </th>
                  <th
                    className="p-4 cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {user.name}
                    </td>
                    <td className="p-4 text-gray-600">
                      {user.email}
                    </td>
                    <td className="p-4 capitalize">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end gap-2 p-4 border-t">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  currentPage === i + 1
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;
