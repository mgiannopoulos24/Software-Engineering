import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import routes from './routes/routes';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AuthRedirectHandler from './components/auth/AuthRedirectHandler'; // Εισαγωγή

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                {/* Τοποθετούμε τον Handler εδώ, ώστε να είναι πάντα ενεργός */}
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
                                    // Για τις public σελίδες, μπορείτε να έχετε ένα διαφορετικό, πιο απλό layout
                                    // αν δεν θέλετε το κυρίως Navbar/Footer (π.χ. στη σελίδα Login)
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