import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SchemaDetailsPage from './pages/SchemaDetailsPage';
import LineCategoriesPage from './pages/LineCategoriesPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
    return (
        <Router>
            <div className="app-shell">
                <MainMenu />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/schemas/:id"
                        element={
                            <ProtectedRoute>
                                <SchemaDetailsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/line-categories"
                        element={
                            <ProtectedRoute>
                                <LineCategoriesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/statistics"
                        element={
                            <ProtectedRoute>
                                <StatisticsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="*"
                        element={
                            <div className="page">
                                <h1>404</h1>
                                <p className="muted">Nie znaleziono strony.</p>
                            </div>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}
