import { useEffect, useMemo, useState } from "react";
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
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await purchasesAPI.getAll();

      if (!res.success) {
        throw new Error(res.message);
      }

      setPurchases(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch purchases"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FILTERING + SEARCH
  ========================= */
  const filteredPurchases = useMemo(() => {
    let data = [...purchases];

    if (search) {
      data = data.filter(
        (item) =>
          item.user?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          item.movie?.title
            ?.toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (item) =>
          item.paymentStatus?.toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    return data;
  }, [purchases, search, statusFilter]);

  /* =========================
     REVENUE SUMMARY
  ========================= */
  const totalRevenue = filteredPurchases
    .filter((p) => p.paymentStatus === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const paidTransactions = filteredPurchases.filter(
    (p) => p.paymentStatus === "paid"
  ).length;

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.ceil(
    filteredPurchases.length / ITEMS_PER_PAGE
  );

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="h-40 bg-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6">
          <p className="text-sm text-gray-500">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-gray-800">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <p className="text-sm text-gray-500">
            Paid Transactions
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {paidTransactions}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <input
          type="text"
          placeholder="Search by user or movie..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-4 py-2 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-4 py-2 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        {paginatedPurchases.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No purchases found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Movie</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Purchase Date</th>
                  <th className="p-4">Expiry Date</th>
                </tr>
              </thead>

              <tbody>
                {paginatedPurchases.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {item.user?.name}
                    </td>
                    <td className="p-4 text-gray-600">
                      {item.movie?.title}
                    </td>
                    <td className="p-4">
                      ₹{item.amount}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(
                        item.purchasedAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(
                        item.expiryDate
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
            {Array.from({ length: totalPages }).map(
              (_, i) => (
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
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseList;
