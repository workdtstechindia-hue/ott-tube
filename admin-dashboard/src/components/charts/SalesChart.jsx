import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const SalesChart = ({ data = [], title = "Sales Analytics" }) => {
  return (
    <div className="card-surface rounded-xl p-6 transition-colors">
      <h3 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>

      <div className="h-[240px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
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

            <Line
              type="monotone"
              dataKey="purchases"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
