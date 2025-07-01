import Index from '@/pages/Index';
import AdminPage from '@/pages/admin/AdminPage';

type RouteConfig = {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  roles?: 'admin';
};

const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Index />,
  },

  // Admin routes
  {
    path: '/admin',
    element: <AdminPage />,
    protected: true,
    roles: 'admin',
  },
];
