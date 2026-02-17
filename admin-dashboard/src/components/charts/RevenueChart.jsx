import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const RevenueChart = ({ data = [], title = "Revenue Overview" }) => {
  return (
    <div className="card-surface rounded-xl p-6 transition-colors">
      <h3 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#64748b", fontSize: 12 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            />

            <Legend wrapperStyle={{ fontSize: 13 }} />

            <Bar
              dataKey="revenue"
              fill="#6366F1"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
