import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import AdminPage from '@/pages/admin/AdminPage';
import UserPage from '@/pages/user/UserPage';

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
    path: '/admin',
    element: <AdminPage />,
    protected: true,
    roles: ['admin'],
  },

  // User routes
  {
    path: '/user',
    element: <UserPage />,
    protected: true,
    roles: ['registered'],
  },
];

export default routes;
