"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";

type ProductData = {
  name: string;
  quantity: number;
  variantId: string;
  productId?: string;
};

type TooltipPayload = {
  value: number;
  payload: {
    name: string;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover p-3 shadow-lg text-sm">
        <p className="font-bold text-popover-foreground mb-1">
          {payload[0].payload.name}
        </p>
        <span className="text-primary font-black">
          Sold: {payload[0].value} units
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Click to view details
        </p>
      </div>
    );
  }
  return null;
};

export function TopProductsBarChart({ data }: { data: ProductData[] }) {
  const router = useRouter();

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-75 text-muted-foreground">
        No product data available.
      </div>
    );
  }

  const handleBarClick = (productData: ProductData) => {
    if (productData.productId) {
      router.push(`/admin/dashboard/inventory/${productData.productId}`);
    }
  };

  return (
    <div className="h-75 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
        >
          {/* Hide grid lines for cleaner look as requested */}
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            vertical={false}
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            width={100}
            // Add a little truncation logic if name is too long
            tickFormatter={(value) =>
              value.length > 15 ? `${value.substring(0, 15)}...` : value
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
          />
          <Bar
            dataKey="quantity"
            fill="#2563eb"
            radius={[0, 4, 4, 0]}
            barSize={24}
            style={{ cursor: "pointer" }}
            onClick={(data) => handleBarClick(data)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                className="hover:fill-blue-700 transition-colors"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
