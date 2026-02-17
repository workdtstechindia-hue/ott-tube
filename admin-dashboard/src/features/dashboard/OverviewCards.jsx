import {
  CheckBadgeIcon,
  CurrencyRupeeIcon,
  FilmIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const cardConfig = [
  {
    key: "totalMovies",
    label: "Total Movies",
    icon: FilmIcon,
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    key: "totalUsers",
    label: "Total Users",
    icon: UsersIcon,
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    key: "totalPurchases",
    label: "Total Purchases",
    icon: ShoppingCartIcon,
    gradient: "from-amber-500 to-amber-600",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: CurrencyRupeeIcon,
    gradient: "from-rose-500 to-rose-600",
  },
  {
    key: "paidTransactions",
    label: "Paid Transactions",
    icon: CheckBadgeIcon,
    gradient: "from-sky-500 to-sky-600",
  },
];

const OverviewCards = ({ data }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {cardConfig.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-r p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-lg ${card.gradient}`}
          >
            <div className="flex items-center justify-between">
              <Icon className="h-8 w-8 opacity-90" />
            </div>
            <div className="mt-6">
              <h3 className="text-3xl font-bold">
                {card.key === "totalRevenue"
                  ? `Rs. ${data?.[card.key]?.toLocaleString() || 0}`
                  : data?.[card.key] ?? 0}
              </h3>
              <p className="mt-1 text-sm opacity-90">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
