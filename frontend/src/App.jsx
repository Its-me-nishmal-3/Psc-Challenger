import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { Toaster } from 'react-hot-toast';
import client from './api/client';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import AdminDashboard from './pages/AdminDashboard';
import CompleteProfile from './pages/CompleteProfile';
import Leaderboard from './pages/Leaderboard';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import StoryMode from './pages/StoryMode';
import LevelGameplay from './pages/LevelGameplay';
import PwaInstallPrompt from './components/PwaInstallPrompt';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    // Force profile completion
    if (!user.mobile && window.location.pathname !== '/complete-profile') {
        return <Navigate to="/complete-profile" />;
    }

    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/" />;
    }

    return children;
};

const PUBLIC_VAPID_KEY = 'BK9TB-EYPPQ1T8IK1Vb-kGaW5Ur0O5UdFVcXFPlxCnA4PMAD7kUQaNKr9WBMBiHCDu2QEkVo6k4KR8sIQMlSgwQ';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const PushManager = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
            const registerPush = async () => {
                try {
                    const register = await navigator.serviceWorker.ready;
                    const subscription = await register.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                    });

                    // Send to backend
                    await client.post('/auth/subscribe', subscription);
                    console.log('Push Subscribed!');
                } catch (err) {
                    console.error('Push Registration Failed:', err);
                }
            };
            registerPush();
        }
    }, [user]);

    return null;
};

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <SoundProvider>
                    <Toaster position="top-center" reverseOrder={false} />
                    <PushManager />
                    <PwaInstallPrompt />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/auth-callback" element={<AuthCallback />} />

                        <Route path="/complete-profile" element={
                            <ProtectedRoute>
                                <CompleteProfile />
                            </ProtectedRoute>
                        } />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />


                        <Route path="/quiz" element={
                            <ProtectedRoute>
                                <Quiz />
                            </ProtectedRoute>
                        } />

                        <Route path="/story" element={
                            <ProtectedRoute>
                                <StoryMode />
                            </ProtectedRoute>
                        } />
                        <Route path="/story/play/:levelNumber" element={
                            <ProtectedRoute>
                                <LevelGameplay />
                            </ProtectedRoute>
                        } />

                        <Route path="/leaderboard" element={
                            <ProtectedRoute>
                                <Leaderboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/quiz/archive" element={
                            <ProtectedRoute>
                                <Archive />
                            </ProtectedRoute>
                        } />

                        <Route path="/quiz/practice/:id" element={
                            <ProtectedRoute>
                                <Quiz />
                            </ProtectedRoute>
                        } />

                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/*" element={
                            <ProtectedRoute requireAdmin={true}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </SoundProvider>
            </AuthProvider>
        </Router>
    );
}
