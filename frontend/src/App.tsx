import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import routes from './routes/routes';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                route.protected ? (
                  <ProtectedRoute allowedRoles={route.roles!}>
                    <Layout>{route.element}</Layout>
                  </ProtectedRoute>
                ) : (
                  <Layout>{route.element}</Layout>
                )
              }
            />
          ))}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
