import { useState } from "react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import RevenueChart from "../../components/charts/RevenueChart";
import SalesChart from "../../components/charts/SalesChart";
import Dropdown from "../../components/ui/Dropdown";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import useAnimatedCounter from "../../hooks/useAnimatedCounter";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("7d");

  /* Simulated Data (Replace with API later) */
  const kpiData = {
    revenue: 245000,
    purchases: 1230,
  };

  const animatedRevenue = useAnimatedCounter(
    kpiData.revenue
  );
  const animatedPurchases = useAnimatedCounter(
    kpiData.purchases
  );

  const chartData = [
    { name: "Jan", revenue: 20000, purchases: 120 },
    { name: "Feb", revenue: 35000, purchases: 180 },
    { name: "Mar", revenue: 42000, purchases: 250 },
    { name: "Apr", revenue: 30000, purchases: 200 },
  ];

  const topMovies = [
    { title: "Inception", purchases: 320 },
    { title: "Avatar", purchases: 280 },
    { title: "Interstellar", purchases: 240 },
    { title: "Tenet", purchases: 200 },
    { title: "Joker", purchases: 180 },
  ];

  const recentTransactions = [
    {
      user: "John Doe",
      movie: "Inception",
      amount: 199,
      date: "2026-02-16T10:00:00.000Z",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Date Filter */}
      <div className="flex justify-end">
        <Dropdown
          value={dateRange}
          onChange={setDateRange}
          options={[
            { value: "7d", label: "Last 7 Days" },
            { value: "30d", label: "Last 30 Days" },
            { value: "1y", label: "Last 1 Year" },
          ]}
        />
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Revenue
          </p>
          <p className="text-3xl font-bold">
            {formatCurrency(animatedRevenue)}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Purchases
          </p>
          <p className="text-3xl font-bold">
            {animatedPurchases}
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={chartData}
          title="Revenue Trend"
        />
        <SalesChart
          data={chartData}
          title="Purchases Trend"
        />
      </div>

      {/* Bottom Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movies */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            Top 5 Movies
          </h3>
          <ul className="space-y-3">
            {topMovies.map((movie) => (
              <li
                key={movie.title}
                className="flex justify-between"
              >
                <span>{movie.title}</span>
                <span className="font-medium">
                  {movie.purchases}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">
            Recent Transactions
          </h3>

          <Table
            columns={[
              { key: "user", label: "User" },
              { key: "movie", label: "Movie" },
              {
                key: "amount",
                label: "Amount",
                render: (row) =>
                  formatCurrency(row.amount),
              },
              {
                key: "date",
                label: "Date",
                render: (row) =>
                  formatDate(row.date),
              },
            ]}
            data={recentTransactions}
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
