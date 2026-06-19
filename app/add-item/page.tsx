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
    <div className="page-shell">
      <Nav />

      <main className="page-container max-w-3xl">
        <div className="page-heading">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Inventory</p>
          <h1 className="page-title">Add a new item</h1>
          <p className="page-description">Create a stock record. Add a clear photo so it is easy to identify at sale time.</p>
        </div>

        <div className="surface p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Serial Number */}
            <div>
              <label className="form-label">
                Serial Number *
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleInputChange}
                placeholder="e.g. SN-0001"
                className="form-control font-mono uppercase"
              />
            </div>

            {/* Item Name */}
            <div>
              <label className="form-label">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Oak Dining Chair"
                className="form-control"
              />
            </div>

            {/* Category */}
            <div>
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-control"
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
              <label className="form-label">
                Listed Price (₹) *
              </label>
              <input
                type="number"
                name="listed_price"
                value={formData.listed_price}
                onChange={handleInputChange}
                placeholder="0"
                className="form-control"
                min="0"
                step="0.01"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="form-label">
                Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:border-slate-400"
              />
              {imagePreview && (
                <div className="mt-4">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                  className="h-40 w-full rounded-xl object-cover sm:h-52"
                  />
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`status-message text-center ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="primary-button w-full"
            >
              {submitting ? "Adding..." : "Add Item"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
