"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: "⌂" },
  { href: "/log-sale", label: "Log sale", shortLabel: "Sell", icon: "₹" },
  { href: "/add-item", label: "Add item", shortLabel: "Add", icon: "+" },
  { href: "/bulk-import", label: "Import", shortLabel: "Import", icon: "⇧" },
];

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="Furniture Tracker dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-lg font-black text-white shadow-sm">
              V
            </span>
            <span>
              <span className="block text-sm font-bold leading-none text-slate-950 sm:text-base">Vardhan</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Stock room</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:text-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-bold transition ${
                  active ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <span className="mb-0.5 text-xl leading-none" aria-hidden="true">{link.icon}</span>
                {link.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
