
"use client";

import { useState } from "react";
import { Bell, ChevronDown, UserRound, LogOut } from "lucide-react";

export default function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Workspace</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-gray-900">
          Pesanan saya
        </span>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Notifikasi"
        >
          <Bell size={20} />
        </button>

        {/* User profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
            aria-expanded={isProfileOpen}
            aria-label="Menu profil"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
              AP
            </div>

            <span className="text-sm font-medium text-gray-900">
              Alya P.
            </span>

            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {/* Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserRound size={16} />
                Profile
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
