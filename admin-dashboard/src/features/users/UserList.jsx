import { useEffect, useMemo, useState } from "react";
import SearchBar from "../../components/ui/SearchBar";
import Skeleton from "../../components/ui/Skeleton";
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
    const fetchUsers = async () => {
      try {
        const res = await usersAPI.getAll();
        if (res.success) {
          setUsers(res.data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let data = [...users];
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      data = data.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

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

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortOrder("asc");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full max-w-xs" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="card-surface rounded-xl px-6 py-4">
          <p className="text-sm text-[var(--text-muted)]">Total Users</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {filteredUsers.length}
          </p>
        </div>

        <SearchBar
          value={search}
          onSearch={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          placeholder="Search by name or email..."
        />
      </div>

      <div className="card-surface overflow-hidden rounded-2xl">
        {paginatedUsers.length === 0 ? (
          <div className="p-10 text-center text-[var(--text-muted)]">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-surface w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="cursor-pointer px-5 py-4 text-center align-middle" onClick={() => handleSort("name")}>
                    Name
                  </th>
                  <th className="cursor-pointer px-5 py-4 text-center align-middle" onClick={() => handleSort("email")}>
                    Email
                  </th>
                  <th className="cursor-pointer px-5 py-4 text-center align-middle" onClick={() => handleSort("role")}>
                    Role
                  </th>
                  <th className="cursor-pointer px-5 py-4 text-center align-middle" onClick={() => handleSort("createdAt")}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="table-row h-14 transition"
                  >
                    <td className="w-1/4 px-5 py-4 text-center align-middle font-medium text-[var(--text-primary)]">
                      {user.name}
                    </td>
                    <td className="w-1/4 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
                      <p className="truncate">{user.email}</p>
                    </td>
                    <td className="w-1/4 px-5 py-4 text-center align-middle capitalize">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-gray-900 text-white"
                            : "bg-black/10 text-[var(--text-primary)] dark:bg-white/10"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="w-1/4 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 border-t border-[var(--border-color)] p-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={`page-${index + 1}`}
                onClick={() => setCurrentPage(index + 1)}
                className={`rounded-lg px-3 py-1 text-sm ${
                  currentPage === index + 1
                    ? "bg-gray-900 text-white"
                    : "bg-black/10 text-[var(--text-primary)] dark:bg-white/10"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UserList;
