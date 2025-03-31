import { Bell, Bookmark, CircleUserRound, Menu, Search, Settings, X } from 'lucide-react';
import { useState } from 'react';

export const IndexNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="w-full border-gray-200 bg-white dark:bg-gray-900">
      <div className="flex w-full flex-wrap items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="" className="flex items-center space-x-3 rtl:space-x-reverse">
          <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
            AIS Tracking
          </span>
        </a>

        {/* Center search bar - desktop */}
        <div className="mx-8 hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-xl">
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

        {/* Mobile search toggle and menu button */}
        <div className="flex items-center md:order-2">
          <button
            type="button"
            data-collapse-toggle="navbar-search"
            aria-controls="navbar-search"
            aria-expanded="false"
            className="me-1 rounded-lg p-2.5 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 md:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >
            <Search size={20} />
            <span className="sr-only">Search</span>
          </button>

          <button
            onClick={toggleNavbar}
            data-collapse-toggle="navbar-search"
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-search"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Open main menu</span>
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile menu and navigation items */}
        <div
          className={`fixed right-0 top-0 z-[2000] h-screen w-80 overflow-y-auto bg-white p-4 transition-transform duration-300 ease-in-out md:relative md:order-1 md:flex md:h-auto md:w-auto md:items-center md:justify-between md:overflow-visible md:bg-transparent md:p-0 dark:bg-gray-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}
          id="navbar-search"
        >
          {/* Close button for mobile drawer */}
          <button
            onClick={toggleNavbar}
            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
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

          {/* Navigation links with icons */}
          <ul className="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 font-medium md:mt-0 md:flex-row md:space-x-6 md:border-0 md:bg-white md:p-0 dark:border-gray-700 dark:bg-gray-800 md:dark:bg-gray-900">
            {/* Settings icon */}
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:p-2 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Settings size={28} />
                <span className="mt-1 hidden text-xs md:block">Settings</span>
                <span className="ml-2 md:hidden">Settings</span>
                <span className="sr-only md:not-sr-only md:hidden">Settings</span>
              </a>
            </li>

            {/* Bell/Notification icon */}
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:p-2 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Bell size={28} />
                <span className="mt-1 hidden text-xs md:block">Notifications</span>
                <span className="ml-2 md:hidden">Notifications</span>
                <span className="sr-only md:not-sr-only md:hidden">Notifications</span>
              </a>
            </li>

            {/* Bookmark icon */}
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:p-2 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <Bookmark size={28} />
                <span className="mt-1 hidden text-xs md:block">Saved Vessels</span>
                <span className="ml-2 md:hidden">Bookmarks</span>
                <span className="sr-only md:not-sr-only md:hidden">Bookmarks</span>
              </a>
            </li>

            {/* User profile icon */}
            <li>
              <a
                href="#"
                className="flex flex-col items-center rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:p-2 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-blue-500"
              >
                <CircleUserRound size={28} />
                <span className="mt-1 hidden text-xs md:block">Profile</span>
                <span className="ml-2 md:hidden">Profile</span>
                <span className="sr-only md:not-sr-only md:hidden">User profile</span>
              </a>
            </li>
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
