import {
  FilmIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
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
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {cardConfig.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-xl shadow-md p-6 text-white bg-gradient-to-r ${card.gradient} transition transform hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <Icon className="w-8 h-8 opacity-90" />
            </div>

            <div className="mt-6">
              <h3 className="text-3xl font-bold">
                {card.key === "totalRevenue"
                  ? `₹${data?.[card.key]?.toLocaleString() || 0}`
                  : data?.[card.key] ?? 0}
              </h3>
              <p className="text-sm opacity-90 mt-1">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
