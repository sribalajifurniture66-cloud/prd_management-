"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-xl font-bold">
            Furniture Tracker
          </Link>

          <div className="flex gap-4 items-center">
            <Link href="/dashboard" className="hover:bg-indigo-700 px-3 py-2 rounded">
              Dashboard
            </Link>
            <Link href="/log-sale" className="hover:bg-indigo-700 px-3 py-2 rounded font-bold">
              Log Sale
            </Link>
            <Link href="/add-item" className="hover:bg-indigo-700 px-3 py-2 rounded">
              Add Item
            </Link>
            <Link href="/bulk-import" className="hover:bg-indigo-700 px-3 py-2 rounded">
              Import
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowLogout(!showLogout)}
                className="text-sm bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded"
              >
                Menu
              </button>
              {showLogout && (
                <button
                  onClick={handleLogout}
                  className="absolute right-0 mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-lg text-sm"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
