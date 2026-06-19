"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type FilterType = "all" | "category" | "serial_number" | "color";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterValue, setFilterValue] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalSold: 0,
    inStock: 0,
    totalRevenue: 0,
    averagePrice: 0,
    averageSoldPrice: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterType, filterValue, items]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("date_added", { ascending: false });

      if (error) throw error;

      const typedItems = (data as Item[]) || [];
      setItems(typedItems);

      // Extract unique categories and colors
      const uniqueCategories = [...new Set(typedItems.map((i) => i.category).filter(Boolean))];
      const uniqueColors = [...new Set(typedItems.map((i) => i.color).filter(Boolean))];
      setCategories(uniqueCategories as string[]);
      setColors(uniqueColors as string[]);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = items;

    if (filterType === "category" && filterValue) {
      filtered = items.filter((i) => i.category === filterValue);
    } else if (filterType === "serial_number" && filterValue) {
      filtered = items.filter((i) =>
        i.serial_number.toUpperCase().includes(filterValue.toUpperCase())
      );
    } else if (filterType === "color" && filterValue) {
      filtered = items.filter((i) => i.color === filterValue);
    }

    setFilteredItems(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (data: Item[]) => {
    const sold = data.filter((i) => i.status === "sold");
    const inStock = data.filter((i) => i.status === "in_stock");
    const totalRevenue = sold.reduce((sum, i) => sum + (i.price_sold || 0), 0);
    const averagePrice =
      data.length > 0 ? data.reduce((sum, i) => sum + i.listed_price, 0) / data.length : 0;
    const averageSoldPrice = sold.length > 0 ? totalRevenue / sold.length : 0;

    setStats({
      totalItems: data.length,
      totalSold: sold.length,
      inStock: inStock.length,
      totalRevenue,
      averagePrice,
      averageSoldPrice,
    });
  };

  const getCategoryBreakdown = () => {
    const categoryMap: Record<string, { count: number; revenue: number }> = {};
    filteredItems
      .filter((i) => i.status === "sold")
      .forEach((item) => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = { count: 0, revenue: 0 };
        }
        categoryMap[item.category].count += 1;
        categoryMap[item.category].revenue += item.price_sold || 0;
      });

    return Object.entries(categoryMap).map(([category, data]) => ({
      name: category,
      ...data,
    }));
  };

  const getDailyRevenue = () => {
    const dailyMap: Record<string, number> = {};
    filteredItems
      .filter((i) => i.status === "sold")
      .forEach((item) => {
        const date = item.date_sold?.split("T")[0] || "Unknown";
        dailyMap[date] = (dailyMap[date] || 0) + (item.price_sold || 0);
      });

    return Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getStatusBreakdown = () => {
    return [
      { name: "Sold", value: stats.totalSold },
      { name: "In Stock", value: stats.inStock },
    ];
  };

  const getColorBreakdown = () => {
    const colorMap: Record<string, number> = {};
    filteredItems
      .filter((i) => i.color)
      .forEach((item) => {
        colorMap[item.color!] = (colorMap[item.color!] || 0) + 1;
      });

    return Object.entries(colorMap).map(([color, count]) => ({
      name: color,
      value: count,
    }));
  };

  if (loading) {
    return (
      <div className="page-shell">
        <Nav />
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const categoryData = getCategoryBreakdown();
  const dailyData = getDailyRevenue();
  const statusData = getStatusBreakdown();
  const colorData = getColorBreakdown();

  return (
    <div className="page-shell">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">Analytics & Insights</h1>
          <p className="mt-2 text-slate-600">Analyze profits, inventory, and sales trends</p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Filter By</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as FilterType);
                  setFilterValue("");
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Items</option>
                <option value="category">Category</option>
                <option value="serial_number">Serial Number</option>
                <option value="color">Color</option>
              </select>
            </div>

            {filterType === "category" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Select Category</label>
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === "color" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Select Color</label>
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  {colors.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === "serial_number" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700">Search Serial Number</label>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="e.g., SN-001"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Items</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">{stats.totalItems}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">In Stock</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{stats.inStock}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Sold</div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.totalSold}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">₹{stats.totalRevenue.toFixed(0)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Avg Listed Price</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">₹{stats.averagePrice.toFixed(0)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Avg Sold Price</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">₹{stats.averageSoldPrice.toFixed(0)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Daily Revenue Chart */}
          {dailyData.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Daily Revenue</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Breakdown Chart */}
          {categoryData.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Revenue by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="count" fill="#3b82f6" name="Items Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Breakdown Pie Chart */}
          {stats.totalItems > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Inventory Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Color Breakdown */}
          {colorData.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-950">Items by Color</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={colorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Detailed Table */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Detailed Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Serial #</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Name</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Category</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Color</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Listed Price</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Sold Price</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-700">Profit/Loss</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.slice(0, 50).map((item) => {
                  const profitLoss = item.price_sold ? item.price_sold - item.listed_price : null;
                  return (
                    <tr key={item.serial_number} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{item.serial_number}</td>
                      <td className="py-3 px-4 text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 text-slate-600">{item.color || "-"}</td>
                      <td className="py-3 px-4 text-slate-900">₹{item.listed_price.toFixed(0)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            item.status === "sold"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.status === "sold" ? "Sold" : "In Stock"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900">
                        {item.price_sold ? `₹${item.price_sold.toFixed(0)}` : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {profitLoss !== null && (
                          <span className={profitLoss >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                            {profitLoss >= 0 ? "+" : ""}₹{profitLoss.toFixed(0)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length > 50 && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Showing 50 of {filteredItems.length} items
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
