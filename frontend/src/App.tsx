import AuthRedirectHandler from './components/auth/AuthRedirectHandler';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { FleetProvider } from './contexts/FleetContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ZoneProvider } from './contexts/ZoneContext';
import routes from './routes/routes';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <WebSocketProvider>
          <FleetProvider>
            <ZoneProvider>
              <Router>
                <AuthRedirectHandler />
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
            </ZoneProvider>
          </FleetProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
