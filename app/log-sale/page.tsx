"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import { Item } from "@/lib/types";
import Image from "next/image";

export default function LogSalePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [inStockItems, setInStockItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchInStockItems();
  }, []);

  const fetchInStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("status", "in_stock")
        .order("date_added", { ascending: false });

      if (error) throw error;

      const typedItems = (data as Item[]) || [];
      setItems(typedItems);
      setInStockItems(typedItems);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching items:", error);
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const filtered = items.filter(
        (item) =>
          item.serial_number.toLowerCase().includes(term.toLowerCase()) ||
          item.name.toLowerCase().includes(term.toLowerCase())
      );
      setInStockItems(filtered);
      setShowDropdown(true);
    } else {
      setInStockItems(items);
      setShowDropdown(false);
    }
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setSearchTerm(item.serial_number);
    setSalePrice(item.listed_price.toString());
    setShowDropdown(false);
  };

  const handleMarkSold = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !salePrice) {
      setMessage("Please select an item and enter sale price");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("items")
        .update({
          status: "sold",
          price_sold: parseFloat(salePrice),
          date_sold: new Date().toISOString(),
        })
        .eq("serial_number", selectedItem.serial_number);

      if (error) throw error;

      setMessage(
        `✓ ${selectedItem.serial_number} marked sold for ₹${parseFloat(salePrice).toLocaleString()}`
      );

      // Reset form
      setTimeout(() => {
        setSelectedItem(null);
        setSearchTerm("");
        setSalePrice("");
        setMessage("");
        fetchInStockItems();
      }, 2000);
    } catch (error) {
      console.error("Error marking item sold:", error);
      setMessage("Error saving sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm font-semibold text-slate-500">Loading stock…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Nav />

      <main className="page-container max-w-3xl">
        <div className="page-heading">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Sales</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="page-title">Log a sale</h1>
              <p className="page-description">Find an item, confirm the price, and mark it as sold.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              {items.length} in stock
            </span>
          </div>
        </div>

        <div className="surface p-5 sm:p-8">
          <form onSubmit={handleMarkSold} className="space-y-5 sm:space-y-6">
            {/* Item Selection */}
            <div className="relative">
              <label className="form-label">
                Select Item to Sell
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by serial number or name..."
                className="form-control"
              />

              {/* Dropdown */}
              {showDropdown && inStockItems.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {inStockItems.map((item) => (
                    <button
                      key={item.serial_number}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="w-full rounded-lg px-3 py-3 text-left transition hover:bg-emerald-50"
                    >
                      <div className="font-mono text-sm font-bold text-slate-900">{item.serial_number}</div>
                      <div className="mt-0.5 text-sm text-slate-500">{item.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Item Details */}
            {selectedItem && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-6">
                {selectedItem.image_url && (
                  <div className="mb-4">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      width={300}
                      height={300}
                    className="h-52 w-full rounded-xl object-cover sm:h-64"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Item Name</p>
                    <p className="mt-1 font-bold text-slate-900">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</p>
                    <p className="mt-1 font-bold text-slate-900">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Serial Number</p>
                    <p className="mt-1 font-mono font-bold text-slate-900">
                      {selectedItem.serial_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Listed Price</p>
                    <p className="mt-1 font-bold text-emerald-700">
                      ₹{selectedItem.listed_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Price Input */}
            <div>
              <label className="form-label">
                Sale Price (₹)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter actual sale price"
                className="form-control text-lg font-semibold"
                min="0"
                step="0.01"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`status-message text-center ${
                  message.startsWith("✓")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedItem || !salePrice || submitting}
              className="primary-button w-full sm:text-base"
            >
              {submitting ? "Saving..." : "Mark as Sold"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
