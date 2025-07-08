import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import AdminDashboard from '@/pages/admin/AdminPage';
import SavedVessels from '@/pages/user/SavedVessels';
import SettingsPage from '@/pages/user/SettingsPage'; // <-- ΠΡΟΣΘΗΚΗ IMPORT
import UserPage from '@/pages/user/UserPage';
import SharedMapPage from '@/pages/SharedMapPage';

type RouteConfig = {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  roles?: string[];
};

const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Index />,
  },
  // Public routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },

  // Admin routes
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
    protected: true,
    roles: ['ADMIN'],
  },
  {
    path: '/admin',
    element: <SharedMapPage />,
    protected: true,
    roles: ['ADMIN'],
  },

  // User routes
  {
    path: '/user',
    element: <UserPage />,
    protected: true,
    roles: ['REGISTERED', 'ADMIN'],
  },
  {
    path: '/user/vessels',
    element: <SavedVessels />,
    protected: true,
    roles: ['REGISTERED', 'ADMIN'],
  },
  // --- ΠΡΟΣΘΗΚΗ ΝΕΟΥ ROUTE ΕΔΩ ---
  {
    path: '/user/settings',
    element: <SettingsPage />,
    protected: true,
    roles: ['REGISTERED', 'ADMIN'], // Προσβάσιμο και από τους δύο ρόλους
  },
];

export default routes;