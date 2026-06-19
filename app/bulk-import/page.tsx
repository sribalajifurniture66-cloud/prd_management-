"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";

interface CSVRow {
  serial_number?: string;
  name?: string;
  category?: string;
  listed_price?: string;
  [key: string]: string | undefined;
}

export default function BulkImportPage() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setMessage("");
      setCsvData([]);
      setValidationErrors([]);

      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as CSVRow[];
          validateAndPreview(data);
        },
        error: (error) => {
          setMessage(`Error parsing CSV: ${error.message}`);
          setMessageType("error");
        },
      });
    }
  };

  const validateAndPreview = async (data: CSVRow[]) => {
    const errors: string[] = [];
    const validRows: CSVRow[] = [];

    // Check existing serial numbers
    const { data: existingItems, error: queryError } = await supabase
      .from("items")
      .select("serial_number");

    if (queryError) {
      setMessage("Error checking existing items");
      setMessageType("error");
      return;
    }

    const existingSerials = new Set(
      existingItems?.map((item) => item.serial_number.toUpperCase()) || []
    );

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 for CSV header + 1-indexing

      // Validate required fields
      if (!row.serial_number?.trim()) {
        errors.push(`Row ${rowNum}: Missing serial number`);
        return;
      }
      if (!row.name?.trim()) {
        errors.push(`Row ${rowNum}: Missing name`);
        return;
      }
      if (!row.category?.trim()) {
        errors.push(`Row ${rowNum}: Missing category`);
        return;
      }
      if (!row.listed_price?.trim()) {
        errors.push(`Row ${rowNum}: Missing listed price`);
        return;
      }

      // Validate price is number
      const price = parseFloat(row.listed_price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Invalid price`);
        return;
      }

      // Check for duplicates in existing DB
      if (existingSerials.has(row.serial_number.toUpperCase())) {
        errors.push(`Row ${rowNum}: Serial number already exists (${row.serial_number})`);
        return;
      }

      validRows.push(row);
    });

    setCsvData(validRows);
    setValidationErrors(errors);
    setShowPreview(true);

    if (errors.length === 0 && validRows.length === 0) {
      setMessage("CSV is empty");
      setMessageType("error");
    } else if (validRows.length === 0) {
      setMessage(`Found ${errors.length} validation errors. See below.`);
      setMessageType("error");
    } else {
      setMessage(`✓ ${validRows.length} valid items ready to import${errors.length > 0 ? `, ${errors.length} errors` : ""}`);
      setMessageType("success");
    }
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      setMessage("No valid rows to import");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      const rows = csvData.map((row) => ({
        serial_number: row.serial_number!.toUpperCase(),
        name: row.name!,
        category: row.category!,
        listed_price: parseFloat(row.listed_price!),
        image_url: null,
        status: "in_stock",
        date_added: new Date().toISOString(),
      }));

      const { error } = await supabase.from("items").insert(rows);

      if (error) throw error;

      setMessage(`✓ Successfully imported ${csvData.length} items`);
      setMessageType("success");

      // Reset form
      setTimeout(() => {
        setCsvData([]);
        setValidationErrors([]);
        setShowPreview(false);
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Error importing:", error);
      setMessage("Error importing items. Please try again.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <Nav />

      <main className="page-container max-w-5xl">
        <div className="page-heading">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Inventory</p>
          <h1 className="page-title">Bulk import</h1>
          <p className="page-description">Add many products at once from a correctly formatted CSV file.</p>
        </div>

        <div className="surface mb-6 p-5 sm:mb-8 sm:p-8">
          <div className="mb-6">
            <label className="form-label">
              Choose CSV file
            </label>
            <p className="mb-3 text-xs leading-5 text-slate-500">Columns: serial_number, name, category, listed_price</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:border-slate-400"
            />
          </div>

          {message && (
            <div
              className={`status-message ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 sm:mb-8 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-red-800">Needs attention</h2>
            <div className="space-y-2">
              {validationErrors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && csvData.length > 0 && (
          <div className="surface overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-8">
              <h2 className="text-lg font-bold text-slate-900">Import preview</h2>
              <p className="mt-1 text-sm text-slate-500">{csvData.length} items ready</p>
            </div>
            <div className="mb-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Serial</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Category</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{row.serial_number}</td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2">{row.category}</td>
                      <td className="px-4 py-2">₹{parseFloat(row.listed_price || "0").toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 p-5 sm:flex sm:items-center sm:justify-between sm:px-8">
              {csvData.length > 10 && (
              <p className="mb-4 text-sm text-slate-500 sm:mb-0">
                ... and {csvData.length - 10} more items
              </p>
              )}

            <button
              onClick={handleImport}
              disabled={submitting}
              className="primary-button w-full sm:ml-auto sm:w-auto"
            >
              {submitting ? "Importing..." : "Confirm Import"}
            </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
