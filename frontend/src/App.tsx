import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import AuthRedirectHandler from './components/auth/AuthRedirectHandler';
import { AuthProvider } from './contexts/AuthContext';
import { FleetProvider } from './contexts/FleetContext';
import { ZoneProvider } from './contexts/ZoneContext';
import { NotificationProvider } from './contexts/NotificationContext'; 
import routes from './routes/routes';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <NotificationProvider>
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
            </NotificationProvider>
        </AuthProvider>
    );
};

export default App;