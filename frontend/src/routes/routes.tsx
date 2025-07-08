import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import AdminDashboard from '@/pages/admin/AdminPage';
import SavedVessels from '@/pages/user/SavedVessels';
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
    path: '/admin/dashboard', // Η σελίδα με τα στατιστικά και τη διαχείριση χρηστών
    element: <AdminDashboard />,
    protected: true,
    roles: ['ADMIN'],
  },
  {
    path: '/admin', // Ο χάρτης για τον admin
    element: <SharedMapPage />,
    protected: true,
    roles: ['ADMIN'],
  },

  // User routes
  {
    path: '/user',
    element: <UserPage />, // Χρησιμοποιεί το SharedMapPage εσωτερικά
    protected: true,
    roles: ['REGISTERED', 'ADMIN'], // Ένας Admin μπορεί να δει και το user view
  },
  {
    path: '/user/vessels',
    element: <SavedVessels />,
    protected: true,
    roles: ['REGISTERED', 'ADMIN'],
  },
];

export default routes;
