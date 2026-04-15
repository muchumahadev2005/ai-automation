import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "./ProtectedLayout";

const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useSidebar();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={toggle}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Right side content */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {isAuthenticated && user && (
            <>
              {/* Notification Icons - hidden on smallest screens */}
              <div className="hidden sm:flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 flex items-center justify-center text-[#1e293b] font-bold text-sm sm:text-base">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role.toLowerCase()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
