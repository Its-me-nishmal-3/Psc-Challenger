import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
};

const NotificationPrompt = () => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const checkPermission = async () => {
            const permission = Notification.permission;

            if (permission === 'default') {
                // User hasn't decided yet, show our custom modal
                // Check if we haven't shown it recently (optional, lets just show it for now)
                const hasDelayed = sessionStorage.getItem('notificationPromptDelayed');
                if (!hasDelayed) {
                    setTimeout(() => setShowModal(true), 2000); // Small delay on load
                }
            } else if (permission === 'granted') {
                // Already granted, ensure we are subscribed
                subscribeUser();
            }
        };

        checkPermission();
    }, [user]);

    const subscribeUser = async () => {
        try {
            const register = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let subscription = await register.pushManager.getSubscription();

            if (!subscription) {
                subscription = await register.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                });
            }

            // Sync with backend
            await client.post('/auth/subscribe', subscription);
            console.log('Push Subscribed & Synced');

        } catch (err) {
            console.error('Push Registration Failed:', err);
        }
    };

    const handleEnable = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await subscribeUser();
                toast.success('Notifications Enabled!');
                setShowModal(false);
            } else {
                toast.error('Notifications blocked. Please enable them in browser settings.');
                setShowModal(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleLater = () => {
        setShowModal(false);
        sessionStorage.setItem('notificationPromptDelayed', 'true');
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleLater}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                        <Bell size={32} className="text-primary" />
                    </div>

                    <h3 className="text-xl font-bold text-white">Don't Miss a Challenge!</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Enable notifications to get daily quiz reminders, leaderboard updates, and new story levels.
                    </p>

                    <div className="flex flex-col w-full gap-3 pt-2">
                        <button
                            onClick={handleEnable}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                        >
                            {loading ? 'Enabling...' : 'Enable Notifications'}
                        </button>
                        <button
                            onClick={handleLater}
                            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPrompt;
