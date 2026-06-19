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
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Items Added</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAdded}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Currently In Stock</p>
            <p className="text-3xl font-bold text-green-600">{stats.inStock}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Sold</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalSold}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-indigo-600">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts */}
        {categoryBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sales by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Items Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {dailyRevenue.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Sold Items Table */}
        {items.filter((i) => i.status === "sold").length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Recently Sold</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
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
                        <td className="px-6 py-3 font-mono text-gray-900">{item.serial_number}</td>
                        <td className="px-6 py-3">{item.name}</td>
                        <td className="px-6 py-3 text-gray-600">{item.category}</td>
                        <td className="px-6 py-3">₹{item.listed_price.toLocaleString()}</td>
                        <td className="px-6 py-3 font-bold text-green-600">
                          ₹{item.price_sold?.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">In Stock</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
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
                        <td className="px-6 py-3 font-mono text-gray-900">{item.serial_number}</td>
                        <td className="px-6 py-3">{item.name}</td>
                        <td className="px-6 py-3 text-gray-600">{item.category}</td>
                        <td className="px-6 py-3">₹{item.listed_price.toLocaleString()}</td>
                        <td className="px-6 py-3 text-gray-600">
                          {new Date(item.date_added).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
