import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPage from './pages/admin/AdminPage';
import SavedVessels from './pages/user/SavedVessels';
import UserPage from './pages/user/UserPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Index />
            </Layout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole="user">
              <Layout>
                <UserPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/vessels"
          element={
            <ProtectedRoute requiredRole="user">
              <Layout>
                <SavedVessels />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
