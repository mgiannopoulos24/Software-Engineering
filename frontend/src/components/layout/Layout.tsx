// Layout.tsx
import { useAuth } from '@/contexts/AuthContext';
import {
  Bookmark,
  ChevronDown,
  LogOut,
  Map,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 transform rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
        {text}
      </div>
    </div>
  );
};

const Navbar = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // const isUserPage = location.pathname.startsWith('/user');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthenticated = !!currentUser;

  const toggleSheet = () => setIsSheetOpen(!isSheetOpen);
  const closeSheet = () => setIsSheetOpen(false);
  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);
  const closeUserDropdown = () => setIsUserDropdownOpen(false);

  const homePath = isAuthenticated ? (isAdmin ? '/admin' : '/user') : '/';

  const handleLogout = () => {
    closeUserDropdown();
    closeSheet();
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800 text-white shadow-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center">
              <Link
                to={homePath}
                className="text-xl font-bold tracking-tight text-white hover:text-slate-200"
              >
                AIS Service
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            {isAuthenticated && (
              <div className="hidden flex-1 justify-center px-8 md:flex">
                <div className="w-full max-w-lg">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search vessels by MMSI, name..."
                      className="block w-full rounded-full border-transparent bg-slate-700 py-2 pl-10 pr-3 leading-5 text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right side icons & User Menu - Desktop */}
            <div className="hidden items-center space-x-4 md:flex">
              {isAuthenticated && (
                <>
                  <Tooltip text="Saved Vessels">
                    <Link
                      to="/user/vessels"
                      className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      <Bookmark size={20} />
                    </Link>
                  </Tooltip>
                  <Tooltip text="Map View">
                    <Link
                      to={isAdminPage ? '/admin' : '/user'}
                      className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      <Map size={20} />
                    </Link>
                  </Tooltip>
                  {isAdminPage && (
                    <Tooltip text="Manage Users">
                      <Link
                        to="/admin/users"
                        className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        <Users size={20} />
                      </Link>
                    </Tooltip>
                  )}
                </>
              )}

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 rounded-full bg-slate-700 py-1 pl-3 pr-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                >
                  <User size={18} />
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 z-[1000] mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 text-sm text-slate-500">
                          <p className="font-medium text-slate-800">
                            {currentUser?.email || 'User'}
                          </p>
                          <p>{currentUser?.role}</p>
                        </div>
                        <div className="my-1 h-px bg-slate-200" />
                        <Link
                          to="/user/profile"
                          onClick={closeUserDropdown}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <User className="mr-3 h-5 w-5" /> Profile
                        </Link>
                        <Link
                          to="/user/settings"
                          onClick={closeUserDropdown}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <Settings className="mr-3 h-5 w-5" /> Settings
                        </Link>
                        {isAdmin && (
                          <>
                            <div className="my-1 h-px bg-slate-200" />
                            <Link
                              to="/admin/system"
                              onClick={closeUserDropdown}
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <ShieldCheck className="mr-3 h-5 w-5" /> Admin Panel
                            </Link>
                          </>
                        )}
                        <div className="my-1 h-px bg-slate-200" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <LogOut className="mr-3 h-5 w-5" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={closeUserDropdown}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          Login
                        </Link>
                        <Link
                          to="/signup"
                          onClick={closeUserDropdown}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
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
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sheet (Slide-out menu) */}
        {isSheetOpen && (
          <div className="fixed inset-0 z-[1001] md:hidden">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={closeSheet} />
            {/* Content */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xs bg-slate-800 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 p-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={closeSheet}
                  className="rounded-md p-2 text-slate-300 hover:bg-slate-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex h-[calc(100%-4.5rem)] flex-col justify-between p-4">
                <div className="space-y-4">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/user/vessels"
                        onClick={closeSheet}
                        className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"
                      >
                        <Bookmark className="h-6 w-6" /> <span>Saved Vessels</span>
                      </Link>
                      <Link
                        to={isAdminPage ? '/admin' : '/user'}
                        onClick={closeSheet}
                        className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"
                      >
                        <Map className="h-6 w-6" /> <span>Map View</span>
                      </Link>
                      {isAdminPage && (
                        <Link
                          to="/admin/users"
                          onClick={closeSheet}
                          className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"
                        >
                          <Users className="h-6 w-6" /> <span>Manage Users</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={closeSheet}
                      className="block w-full rounded-md bg-sky-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-sky-700"
                    >
                      Login / Sign Up
                    </Link>
                  )}
                </div>
                {isAuthenticated && (
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <Link
                      to="/user/profile"
                      onClick={closeSheet}
                      className="block w-full rounded-md bg-sky-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-sky-700"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-md bg-slate-700 px-4 py-3 text-center font-medium text-slate-200 transition-colors hover:bg-slate-600"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-800 text-slate-400">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm">© {currentYear} AIS Service. All rights reserved.</p>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      <Toaster position="top-right" richColors />
      <Footer />
    </div>
  );
};
export default Layout;
