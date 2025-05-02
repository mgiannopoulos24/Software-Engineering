import {
  Bell,
  Bookmark,
  CircleUserRound,
  Compass,
  Globe,
  Info,
  LocateFixed,
  LogIn,
  Menu,
  Search,
  Settings,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const IndexNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLLIElement>(null);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const toggleProfileDropdown = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="w-full border-gray-200 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-2xl px-4 py-3">
        <div className="flex w-full items-center justify-between">
          {/* All nav content in one flex row */}
          {/* Left icons */}
          <ul className="hidden md:flex md:space-x-2 lg:space-x-4">
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <LocateFixed size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Locate</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Info size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Info</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Compass size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Compass</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Globe size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Globe</span>
              </a>
            </li>
          </ul>

          {/* Center search bar */}
          <div className="mx-4 hidden min-w-0 flex-1 justify-center md:flex">
            <div className="relative w-full max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                <Search size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Search icon</span>
              </div>
              <input
                type="text"
                id="search-navbar-desktop"
                className="block w-full rounded-full border border-gray-300 bg-gray-50 p-2 ps-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Right icons */}
          <ul className="hidden md:flex md:space-x-2 lg:space-x-4">
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Settings size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Settings</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Bell size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Notifications</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Bookmark size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Saved Vessels</span>
              </a>
            </li>
            <li ref={profileDropdownRef} className="relative">
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-1 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
                onClick={toggleProfileDropdown}
              >
                <CircleUserRound size={20} className="md:h-5 md:w-5 lg:h-6 lg:w-6" />
                <span className="mt-1 text-[10px] lg:text-xs">Profile</span>
              </a>
              {isProfileDropdownOpen && (
                <ul className="absolute right-0 top-full z-[999] mt-2 min-w-[180px] rounded-lg border border-gray-100 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <li>
                    <a
                      href="./login"
                      className="flex items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <LogIn className="mr-2" size={16} />
                      Log In
                    </a>
                  </li>
                  <li>
                    <a
                      href="./signup"
                      className="flex items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                    >
                      <UserPlus className="mr-2" size={16} />
                      Sign Up
                    </a>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          {/* Mobile buttons (unchanged) */}
          <div className="ml-auto flex flex-shrink-0 items-center md:hidden">
            <button
              type="button"
              data-collapse-toggle="navbar-search"
              aria-controls="navbar-search"
              aria-expanded="false"
              className="me-1 rounded-lg bg-white p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <Search size={20} />
              <span className="sr-only">Search</span>
            </button>
            <button
              onClick={toggleNavbar}
              data-collapse-toggle="navbar-search"
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="navbar-search"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile menu and navigation items */}
        <div
          className={`fixed right-0 top-0 z-[2000] h-screen w-80 overflow-y-auto bg-white p-4 transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'} dark:bg-gray-800`}
          id="navbar-search"
        >
          {/* Close button for mobile drawer */}
          <button
            onClick={toggleNavbar}
            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
          >
            <X size={20} />
            <span className="sr-only">Close menu</span>
          </button>

          {/* Mobile search */}
          <div className="relative mt-10 w-full md:mt-0 md:hidden">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <Search size={16} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              id="search-navbar-mobile"
              className="block w-full rounded-full border border-gray-300 bg-gray-50 p-2 ps-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              placeholder="Search..."
            />
          </div>

          {/* Navigation links with icons for mobile */}
          <ul className="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 font-medium dark:border-gray-700 dark:bg-gray-800">
            {/* Left section navigation icons - mobile */}
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <LocateFixed size={20} />
                <span className="ml-2">Locate</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Info size={20} />
                <span className="ml-2">Info</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Compass size={20} />
                <span className="ml-2">Compass</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Globe size={20} />
                <span className="ml-2">Globe</span>
              </a>
            </li>

            {/* Right section icons - mobile */}
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Settings size={20} />
                <span className="ml-2">Settings</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Bell size={20} />
                <span className="ml-2">Notifications</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <Bookmark size={20} />
                <span className="ml-2">Bookmarks</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                onClick={toggleProfileDropdown}
              >
                <CircleUserRound size={20} />
                <span className="ml-2">Profile</span>
              </a>
            </li>
            {isProfileDropdownOpen && (
              <>
                <li className="pl-6">
                  <a
                    href="/login"
                    className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <LogIn className="mr-2" size={16} />
                    Log In
                  </a>
                </li>
                <li className="pl-6">
                  <a
                    href="./signup"
                    className="flex items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <UserPlus className="mr-2" size={16} />
                    Sign Up
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Overlay for mobile menu */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[999] bg-gray-900 bg-opacity-50 md:hidden"
            onClick={toggleNavbar}
          ></div>
        )}
      </div>
    </nav>
  );
};
