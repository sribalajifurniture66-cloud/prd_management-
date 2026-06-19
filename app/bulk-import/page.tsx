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
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bulk Import</h1>
        <p className="text-gray-600 mb-8">Upload a CSV file to add multiple items at once</p>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              CSV File (serial_number, name, category, listed_price)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-2">
              Required columns: serial_number, name, category, listed_price
            </p>
          </div>

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
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 rounded-lg shadow p-8 mb-8">
            <h2 className="text-lg font-bold text-red-700 mb-4">Validation Errors</h2>
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
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Preview ({csvData.length} items)</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
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

            {csvData.length > 10 && (
              <p className="text-sm text-gray-600 mb-6">
                ... and {csvData.length - 10} more items
              </p>
            )}

            <button
              onClick={handleImport}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              {submitting ? "Importing..." : "Confirm Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
