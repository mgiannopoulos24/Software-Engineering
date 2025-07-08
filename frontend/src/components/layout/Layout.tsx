import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { AppNotification } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, Bookmark, ChevronDown, CircleAlert, LogOut, Map, Menu, Settings, ShieldCheck, Siren, Trash2, User, Users, X, LogIn, UserPlus
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Button } from '../ui/button';

// Helper component για Tooltips
const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => (
  <div className="group relative flex items-center">
    {children}
    <div className="absolute top-full left-1/2 z-50 mt-2 hidden w-max -translate-x-1/2 transform rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
      {text}
    </div>
  </div>
);

// Component για το Dropdown των Ειδοποιήσεων
const NotificationsDropdown: React.FC = () => {
    const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        const willBeOpen = !isOpen;
        setIsOpen(willBeOpen);
        if (willBeOpen && unreadCount > 0) {
            // Σημαδεύουμε ως διαβασμένες όταν ο χρήστης ανοίγει το panel
            markAllAsRead();
        }
    };

    const NotificationIcon = ({ type }: { type: AppNotification['type'] }) => {
        if (type === 'collision') return <Siren className="h-5 w-5 flex-shrink-0 text-red-500" />;
        if (type === 'violation') return <CircleAlert className="h-5 w-5 flex-shrink-0 text-yellow-500" />;
        return <Bell className="h-5 w-5 flex-shrink-0 text-blue-500" />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Tooltip text="Notifications">
                <button
                    onClick={handleToggle}
                    className="relative rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-slate-800">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </Tooltip>

            {isOpen && (
                <div className="absolute right-0 z-[1000] mt-2 w-80 origin-top-right rounded-md bg-white text-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-md font-semibold">Notifications</h3>
                        <Button variant="ghost" size="sm" onClick={clearNotifications} disabled={notifications.length === 0}>
                            <Trash2 className="mr-1 h-4 w-4"/> Clear all
                        </Button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">
                                <Bell className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-2">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="flex items-start gap-3 border-b p-4 last:border-b-0 hover:bg-slate-50">
                                    <NotificationIcon type={notif.type} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{notif.title}</p>
                                        <p className="text-sm text-slate-600">{notif.description}</p>
                                        <p className="mt-1 text-xs text-slate-400">{formatDistanceToNow(notif.timestamp, { addSuffix: true })}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const Navbar = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAuthenticated = !!currentUser;
  const homePath = isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/user') : '/';
  const mapPath = isAuthenticated ? (isAdmin ? '/admin' : '/user') : '/';

  const closeSheet = () => setIsSheetOpen(false);
  const closeUserDropdown = () => setIsUserDropdownOpen(false);
  
  const handleLogout = () => {
    closeUserDropdown();
    closeSheet();
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-700 bg-slate-800 text-white shadow-md">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to={homePath} className="text-xl font-bold tracking-tight text-white hover:text-slate-200">
              AIS Service
            </Link>

            {/* Right side icons & User Menu - Desktop */}
            <div className="hidden items-center space-x-2 md:flex">
              {isAuthenticated ? (
                <>
                  <Tooltip text="Map View">
                    <Link to={mapPath} className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                      <Map size={20} />
                    </Link>
                  </Tooltip>
                  {!isAdmin && (
                    <Tooltip text="Saved Vessels">
                      <Link to="/user/vessels" className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                        <Bookmark size={20} />
                      </Link>
                    </Tooltip>
                  )}
                  {isAdmin && (
                    <Tooltip text="Admin Dashboard">
                      <Link to="/admin/dashboard" className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                        <Users size={20} />
                      </Link>
                    </Tooltip>
                  )}
                  <NotificationsDropdown />
                </>
              ) : (
                <div className='space-x-2 flex'>
  <Link
    to="/login"
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-transparent hover:border hover:border-slate-400 transition-all duration-200"
  >
    <LogIn size={18} />
    <span>Login</span>
  </Link>

  <Link
    to="/signup"
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-transparent hover:border hover:border-slate-400 transition-all duration-200"
  >
    <UserPlus size={18} />
    <span>Sign Up</span>
  </Link>
</div>
              )}

              {/* User Profile Dropdown */}
              {isAuthenticated && (
                <div className="relative" ref={userDropdownRef}>
                    <button onClick={() => setIsUserDropdownOpen(p => !p)} className="flex items-center space-x-2 rounded-full bg-slate-700 py-1 pl-3 pr-2 text-sm font-medium text-white transition-colors hover:bg-slate-600">
                      <User size={18} />
                      <ChevronDown size={16} className={`transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isUserDropdownOpen && (
                        <div className="absolute right-0 z-[1000] mt-2 w-56 origin-top-right rounded-md bg-white py-1 text-slate-800 shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="px-4 py-2 text-sm text-slate-500">
                                <p className="font-medium text-slate-800 truncate">{currentUser?.email}</p>
                                <p className="capitalize">{currentUser?.role.toLowerCase()}</p>
                            </div>
                            <div className="my-1 h-px bg-slate-200" />
                            {/* <Link to="/user/profile" onClick={closeUserDropdown} className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                <User className="mr-3 h-5 w-5" /> Profile
                            </Link> */}
                            <Link to="/user/settings" onClick={closeUserDropdown} className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                <Settings className="mr-3 h-5 w-5" /> Settings
                            </Link>
                            {isAdmin && (<>
                                <div className="my-1 h-px bg-slate-200" />
                                <Link to="/admin/dashboard" onClick={closeUserDropdown} className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                    <ShieldCheck className="mr-3 h-5 w-5" /> Admin Panel
                                </Link>
                            </>)}
                            <div className="my-1 h-px bg-slate-200" />
                            <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                <LogOut className="mr-3 h-5 w-5" /> Logout
                            </button>
                        </div>
                    )}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && <NotificationsDropdown />}
              <button onClick={() => setIsSheetOpen(true)} className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-slate-700">
                  <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sheet (Slide-out menu) */}
        {isSheetOpen && (
          <div className="fixed inset-0 z-[1001] md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={closeSheet} />
            <div className="fixed right-0 top-0 h-full w-full max-w-xs bg-slate-800 text-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 p-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={closeSheet} className="rounded-md p-2 text-slate-300 hover:bg-slate-700"><X className="h-6 w-6" /></button>
              </div>
              <div className="flex h-[calc(100%-4.5rem)] flex-col justify-between p-4">
                <div className="space-y-4">
                  {isAuthenticated ? (<>
                    <Link to={mapPath} onClick={closeSheet} className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"><Map className="h-6 w-6" /> <span>Map View</span></Link>
                    {!isAdmin && (<Link to="/user/vessels" onClick={closeSheet} className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"><Bookmark className="h-6 w-6" /> <span>Saved Vessels</span></Link>)}
                    {isAdmin && (<Link to="/admin/dashboard" onClick={closeSheet} className="flex items-center space-x-3 rounded-md p-2 text-lg text-slate-300 hover:bg-slate-700"><Users className="h-6 w-6" /> <span>Manage Users</span></Link>)}
                  </>) : (
                    <Link to="/login" onClick={closeSheet} className="block w-full rounded-md bg-sky-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-sky-700">Login / Sign Up</Link>
                  )}
                </div>
                {isAuthenticated && (
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <button onClick={handleLogout} className="block w-full rounded-md bg-slate-700 px-4 py-3 text-center font-medium text-slate-200 transition-colors hover:bg-slate-600">Logout</button>
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
        <Toaster position="top-right" richColors closeButton />
        <Footer />
      </div>
    );
};
  
export default Layout;