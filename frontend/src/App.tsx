import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { FleetProvider } from './contexts/FleetContext'; // NEW: Import FleetProvider
import routes from './routes/routes';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AuthRedirectHandler from './components/auth/AuthRedirectHandler';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <FleetProvider> {/* NEW: Wrap with FleetProvider */}
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
            </FleetProvider> {/* NEW: Close FleetProvider */}
        </AuthProvider>
    );
};

export default App;