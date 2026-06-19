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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Log a Sale</h1>
        <p className="text-gray-600 mb-8">
          {inStockItems.length} items in stock ready to sell
        </p>

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleMarkSold} className="space-y-6">
            {/* Item Selection */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Item to Sell
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search by serial number or name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              />

              {/* Dropdown */}
              {showDropdown && inStockItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {inStockItems.map((item) => (
                    <button
                      key={item.serial_number}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">{item.serial_number}</div>
                      <div className="text-sm text-gray-600">{item.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Item Details */}
            {selectedItem && (
              <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50">
                {selectedItem.image_url && (
                  <div className="mb-4">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      width={300}
                      height={300}
                      className="rounded-lg object-cover w-full max-w-md"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Item Name</p>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-lg font-bold text-gray-900">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="text-lg font-mono font-bold text-gray-900">
                      {selectedItem.serial_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Listed Price</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{selectedItem.listed_price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Price Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sale Price (₹)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter actual sale price"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                min="0"
                step="0.01"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg text-center font-semibold ${
                  message.startsWith("✓")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedItem || !salePrice || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
            >
              {submitting ? "Saving..." : "Mark as Sold"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
