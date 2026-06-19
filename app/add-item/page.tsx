"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const CATEGORIES = ["Chair", "Table", "Sofa", "Bed", "Cabinet", "Desk", "Shelf", "Other"];

export default function AddItemPage() {
  const [formData, setFormData] = useState({
    serial_number: "",
    name: "",
    category: "Chair",
    listed_price: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const serialNumber = formData.serial_number.trim().toUpperCase();
    const name = formData.name.trim();
    const listedPrice = Number(formData.listed_price);

    if (!serialNumber || !name || formData.listed_price === "") {
      setMessage("Please fill in all required fields");
      setMessageType("error");
      return;
    }

    if (!Number.isFinite(listedPrice) || listedPrice < 0) {
      setMessage("Please enter a valid listed price");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      // Check if serial number already exists
      const { data: existing, error: checkError } = await supabase
        .from("items")
        .select("serial_number")
        .eq("serial_number", serialNumber)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        setMessage("Serial number already exists");
        setMessageType("error");
        setSubmitting(false);
        return;
      }

      // Upload image if provided
      let imageUrl = null;
      if (image) {
        const fileName = `${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("item-photos")
          .upload(fileName, image);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("item-photos").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Add item to database
      const { error: insertError } = await supabase.from("items").insert({
        serial_number: serialNumber,
        name,
        category: formData.category,
        listed_price: listedPrice,
        image_url: imageUrl,
        status: "in_stock",
        date_added: new Date().toISOString(),
      });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      setMessage(`✓ Item ${serialNumber} added to stock`);
      setMessageType("success");

      // Reset form
      setTimeout(() => {
        setFormData({
          serial_number: "",
          name: "",
          category: "Chair",
          listed_price: "",
        });
        setImage(null);
        setImagePreview(null);
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error adding item:", error);
      const reason =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Unknown database error";
      setMessage(`Could not add item: ${reason}`);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Add Item to Stock</h1>

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Serial Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Serial Number *
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                placeholder="e.g. SN-0001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Oak Dining Chair"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Listed Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Listed Price (₹) *
              </label>
              <input
                type="number"
                name="listed_price"
                value={formData.listed_price}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                step="0.01"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {imagePreview && (
                <div className="mt-4">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg text-center font-semibold ${
                  messageType === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
