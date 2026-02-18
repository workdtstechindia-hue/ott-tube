import { useEffect, useMemo, useState } from "react";
import Dropdown from "../../components/ui/Dropdown";
import SearchBar from "../../components/ui/SearchBar";
import Skeleton from "../../components/ui/Skeleton";
import { purchasesAPI } from "./purchasesAPI";

const ITEMS_PER_PAGE = 8;

const PurchaseList = () => {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await purchasesAPI.getAll();
        if (!res.success) throw new Error(res.message);
        setPurchases(res.data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch purchases");
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  const filteredPurchases = useMemo(() => {
    let data = [...purchases];
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      data = data.filter(
        (item) =>
          item.user?.name?.toLowerCase().includes(query) ||
          item.movie?.title?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (item) => item.paymentStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    return data;
  }, [purchases, search, statusFilter]);

  const totalRevenue = filteredPurchases
    .filter((item) => item.paymentStatus === "paid")
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const paidTransactions = filteredPurchases.filter(
    (item) => item.paymentStatus === "paid"
  ).length;

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
  const paginated = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card-surface rounded-xl p-6">
          <p className="text-sm text-[var(--text-muted)]">Total Revenue</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            Rs. {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="card-surface rounded-xl p-6">
          <p className="text-sm text-[var(--text-muted)]">Paid Transactions</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {paidTransactions}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <SearchBar
          value={search}
          onSearch={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          placeholder="Search by user or movie..."
        />

        <Dropdown
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          options={[
            { value: "all", label: "All Status" },
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
          ]}
        />
      </div>

      <div className="card-surface overflow-hidden rounded-2xl">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-[var(--text-muted)]">No purchases found.</div>
        ) : (
          <div className="overflow-x-auto px-2 pb-2 md:px-0 md:pb-0">
            <table className="table-surface w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-5 py-4 text-center align-middle">User</th>
                  <th className="px-5 py-4 text-center align-middle">Movie</th>
                  <th className="px-5 py-4 text-center align-middle">Amount</th>
                  <th className="px-5 py-4 text-center align-middle">Status</th>
                  <th className="px-5 py-4 text-center align-middle">Purchase Date</th>
                  <th className="px-5 py-4 text-center align-middle">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="table-row h-14 transition"
                  >
                    <td className="w-1/6 px-5 py-4 text-center align-middle font-medium text-[var(--text-primary)]">
                      {item.user?.name}
                    </td>
                    <td className="w-1/6 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
                      <p className="truncate">{item.movie?.title}</p>
                    </td>
                    <td className="w-1/6 px-5 py-4 text-center align-middle">Rs. {item.amount}</td>
                    <td className="w-1/6 px-5 py-4 text-center align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.paymentStatus === "paid"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="w-1/6 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
                      {new Date(item.purchasedAt).toLocaleDateString()}
                    </td>
                    <td className="w-1/6 px-5 py-4 text-center align-middle text-[var(--text-muted)]">
                      {new Date(item.expiryDate).toLocaleDateString()}
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

export default PurchaseList;
