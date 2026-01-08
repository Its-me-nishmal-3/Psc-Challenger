import { useState, useEffect } from 'react';
import client from '../api/client';

const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY;

export function usePushNotifications() {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW Registered');
                })
                .catch(err => console.error('SW Registration Failed', err));
        }
    }, []);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            await client.post('/notifications/subscribe', subscription);
            console.log('Subscribed to Push Notifications');
            return true;
        } catch (error) {
            console.error('Subscription failed', error);
            return false;
        }
    };

    const requestPermission = async () => {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm === 'granted') {
            await subscribeUser();
        }
    };

    return { permission, requestPermission };
}
