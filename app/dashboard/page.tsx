"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { Item, CategoryBreakdown, DailyRevenue } from "@/lib/types";
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
} from "recharts";

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAdded: 0,
    inStock: 0,
    totalSold: 0,
    totalRevenue: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("date_added", { ascending: false });

      if (error) throw error;

      const typedItems = (data as Item[]) || [];
      setItems(typedItems);

      // Calculate stats
      const inStock = typedItems.filter((i) => i.status === "in_stock").length;
      const sold = typedItems.filter((i) => i.status === "sold");
      const totalRevenue = sold.reduce((sum, i) => sum + (i.price_sold || 0), 0);

      setStats({
        totalAdded: typedItems.length,
        inStock,
        totalSold: sold.length,
        totalRevenue,
      });

      // Calculate category breakdown
      const categoryMap: Record<string, { count: number; revenue: number }> = {};
      sold.forEach((item) => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = { count: 0, revenue: 0 };
        }
        categoryMap[item.category].count += 1;
        categoryMap[item.category].revenue += item.price_sold || 0;
      });

      setCategoryBreakdown(
        Object.entries(categoryMap).map(([category, data]) => ({
          category,
          ...data,
        }))
      );

      // Calculate daily revenue
      const dailyMap: Record<string, number> = {};
      sold.forEach((item) => {
        const date = item.date_sold?.split("T")[0] || "Unknown";
        dailyMap[date] = (dailyMap[date] || 0) + (item.price_sold || 0);
      });

      setDailyRevenue(
        Object.entries(dailyMap)
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Nav />

      <main className="page-container">
        <div className="page-heading">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Overview</p>
          <h1 className="page-title">Stock dashboard</h1>
          <p className="page-description">A quick view of inventory movement and sales performance.</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <div className="surface p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">All items</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{stats.totalAdded}</p>
          </div>
          <div className="surface p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">In stock</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">{stats.inStock}</p>
          </div>
          <div className="surface p-4 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sold</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-sky-600 sm:text-3xl">{stats.totalSold}</p>
          </div>
          <div className="surface col-span-2 p-4 sm:p-6 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Revenue</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600 sm:text-3xl">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts */}
        {categoryBreakdown.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 lg:grid-cols-2">
            <div className="surface p-4 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Sales by category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} name="Items Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {dailyRevenue.length > 0 && (
              <div className="surface p-4 sm:p-6">
                <h2 className="mb-4 text-lg font-bold text-slate-900">Revenue over time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Sold Items Table */}
        {items.filter((i) => i.status === "sold").length > 0 && (
          <div className="surface mb-6 overflow-hidden sm:mb-8">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">Recently sold</h2>
              <p className="mt-1 text-sm text-slate-500">Completed sales and final prices</p>
            </div>
            <div>
              <table className="responsive-table w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Serial</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Category</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">
                      Listed Price
                    </th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Sold For</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Date Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items
                    .filter((i) => i.status === "sold")
                    .map((item) => (
                      <tr key={item.serial_number} className="hover:bg-gray-50">
                        <td data-label="Serial" className="px-6 py-3 font-mono font-semibold text-slate-900">{item.serial_number}</td>
                        <td data-label="Name" className="px-6 py-3">{item.name}</td>
                        <td data-label="Category" className="px-6 py-3 text-slate-500">{item.category}</td>
                        <td data-label="Listed" className="px-6 py-3">₹{item.listed_price.toLocaleString()}</td>
                        <td data-label="Sold for" className="px-6 py-3 font-bold text-emerald-600">
                          ₹{item.price_sold?.toLocaleString()}
                        </td>
                        <td data-label="Date" className="px-6 py-3 text-slate-500">
                          {new Date(item.date_sold || "").toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* In Stock Table */}
        {items.filter((i) => i.status === "in_stock").length > 0 && (
          <div className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-slate-900">In stock</h2>
              <p className="mt-1 text-sm text-slate-500">Items currently available to sell</p>
            </div>
            <div>
              <table className="responsive-table w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Serial</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Category</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Listed Price</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items
                    .filter((i) => i.status === "in_stock")
                    .map((item) => (
                      <tr key={item.serial_number} className="hover:bg-gray-50">
                        <td data-label="Serial" className="px-6 py-3 font-mono font-semibold text-slate-900">{item.serial_number}</td>
                        <td data-label="Name" className="px-6 py-3">{item.name}</td>
                        <td data-label="Category" className="px-6 py-3 text-slate-500">{item.category}</td>
                        <td data-label="Price" className="px-6 py-3 font-semibold">₹{item.listed_price.toLocaleString()}</td>
                        <td data-label="Added" className="px-6 py-3 text-slate-500">
                          {new Date(item.date_added).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
