import { Bookmark, Map, MapPin, Menu, Search, User, Users, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();

  // Check if we're on a user page
  const isUserPage = location.pathname === '/user' || location.pathname.startsWith('/user/');
  const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const toggleSheet = () => {
    setIsSheetOpen(!isSheetOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="border-b bg-[#212930]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-lg font-bold text-white hover:text-gray-200">
                AIS Service
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-8 md:flex">
              {/* Search Bar - Centered */}
              <div className="relative w-full max-w-6xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full rounded-full border border-gray-300 bg-white py-2 pl-12 pr-4 leading-5 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right side icons - Desktop */}
            <div className="hidden items-center space-x-4 md:flex">
              {/* Show user navigation icons only on user page */}
              {(isUserPage || isAdminPage) && (
                <>
                  <Link
                    to="/user/vessels"
                    className="flex items-center space-x-2 rounded-full bg-gray-700 p-2 text-white transition-colors hover:bg-gray-600"
                  >
                    <Bookmark size={18} />
                  </Link>
                  <Link
                    to={isAdminPage ? "/admin" : "/user"}
                    className="flex items-center space-x-2 rounded-full bg-gray-700 p-2 text-white transition-colors hover:bg-gray-600"
                  >
                    <Map size={18} />
                  </Link>
                  <button
                    onClick={() => {
                      // Dispatch custom event to trigger critical section mode
                      const event = new CustomEvent('toggle-critical-section-mode');
                      document.dispatchEvent(event);
                    }}
                    className="flex items-center space-x-2 rounded-full bg-gray-700 p-2 text-white transition-colors hover:bg-gray-600"
                  >
                    <MapPin size={18} />
                  </button>
                  {/* Show Users icon only for admin */}
                  {isAdminPage && (
                    <button className="flex items-center space-x-2 rounded-full bg-gray-700 p-2 text-white transition-colors hover:bg-gray-600">
                      <Users size={18} />
                    </button>
                  )}
                </>
              )}

              {/* User Profile Icon */}
              <div className="relative">
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 rounded-full border-black bg-white p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <User size={18} />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 z-[999] mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {isUserPage || isAdminPage ? (
                      // User/Admin page dropdown
                      <>
                        <Link
                          to="/user/profile"
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/user/settings"
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Settings
                        </Link>
                        {isAdminPage && (
                          <>
                            <hr className="my-1" />
                            <Link
                              to="/admin/users"
                              className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              Manage Users
                            </Link>
                            <Link
                              to="/admin/system"
                              className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              System Settings
                            </Link>
                          </>
                        )}
                        <hr className="my-1" />
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Logout
                        </Link>
                      </>
                    ) : (
                      // Default dropdown
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          to="/signup"
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleSheet}
                className="inline-flex items-center justify-center rounded-md border-black bg-white p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {isSheetOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sheet */}
        {isSheetOpen && (
          <div className="md:hidden">
            <div className="fixed inset-0 z-[999] bg-black bg-opacity-50" onClick={toggleSheet}>
              <div
                className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={toggleSheet}
                    className="rounded-md border-gray-300 bg-white p-2 text-gray-600 hover:border-black hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6 px-4 py-6">
                  {/* Search Bar Mobile */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 focus:border-blue-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Navigation Items Mobile */}
                  {isUserPage && (
                    <div className="space-y-4">
                      <Link
                        to="/user/vessels"
                        className="flex w-full items-center space-x-3 text-left text-gray-600 transition-colors hover:text-gray-900"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Bookmark className="h-5 w-5" />
                        <span>Saved Vessels</span>
                      </Link>
                      <Link
                        to={isAdminPage ? "/admin" : "/user"}
                        className="flex w-full items-center space-x-3 text-left text-gray-600 transition-colors hover:text-gray-900"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <Map className="h-5 w-5" />
                        <span>Map</span>
                      </Link>
                      <button
                        onClick={() => {
                          // Dispatch custom event to trigger critical section mode
                          const event = new CustomEvent('toggle-critical-section-mode');
                          window.dispatchEvent(event);
                        }}
                        className="flex w-full items-center space-x-3 text-left text-gray-600 transition-colors hover:text-gray-900"
                      >
                        <MapPin className="h-5 w-5" />
                        <span>Locate</span>
                      </button>
                    </div>
                  )}

                  {/* User Actions Mobile */}
                  <div className="space-y-3 border-t border-gray-200 pt-6">
                    {isUserPage ? (
                      <>
                        <Link
                          to="/user/profile"
                          className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/user/settings"
                          className="block w-full rounded-md border border-blue-600 px-4 py-2 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          to="/login"
                          className="block w-full rounded-md border border-red-600 px-4 py-2 text-center text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          Logout
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/login"
                        className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdown */}
      {isUserDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
      )}
    </>
  );
};

// Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#212930] text-white">
      <div className="w-full px-0 py-2 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm">© {currentYear} AIS Service. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
