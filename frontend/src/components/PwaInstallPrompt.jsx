import React, { useState, useEffect } from 'react';
import { X, Share, Download, Monitor, Smartphone } from 'lucide-react';

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState('unknown');
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
            // Show prompt for iOS after a short delay if not standalone
            const hasSeenPrompt = localStorage.getItem('pwaPromptShown');
            if (!hasSeenPrompt) {
                setTimeout(() => setShowPrompt(true), 3000);
            }
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('windows');
        }

        // Capture the install prompt for Android/Desktop
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Only show if we haven't dismissed it recently
            const hasSeenPrompt = localStorage.getItem('pwaPromptShown');
            if (!hasSeenPrompt) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const closePrompt = () => {
        setShowPrompt(false);
        // Don't show again for a while (e.g., set a timestamp and check against it)
        // For now, just set a flag locally for this session or simple logic
        localStorage.setItem('pwaPromptShown', 'true');
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-full duration-500">
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto">
                <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                                <img src="/pwa-192x192.png" alt="Logo" className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">Install PSC Challenger</h3>
                                <p className="text-slate-400 text-xs">For the best experience</p>
                            </div>
                        </div>
                        <button
                            onClick={closePrompt}
                            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {platform === 'ios' && (
                            <div className="bg-slate-800/50 rounded-xl p-3 text-sm text-slate-300 space-y-2 border border-slate-700/50">
                                <p className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">1</span>
                                    Tap the <Share size={16} className="text-blue-400" /> Share button below
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">2</span>
                                    Select <span className="font-semibold text-white">Add to Home Screen</span>
                                </p>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-b border-r border-slate-700/50"></div>
                            </div>
                        )}

                        {platform === 'windows' && (
                            <div className="text-sm text-slate-300 mb-3">
                                Install onto your desktop for quick access and a native app experience.
                            </div>
                        )}

                        {(platform === 'android' || platform === 'windows') && deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-600/20"
                            >
                                {platform === 'windows' ? <Monitor size={18} /> : <Smartphone size={18} />}
                                Install App
                            </button>
                        )}

                        {/* Fallback info for Android if beforeinstallprompt fails or manual guide needed */}
                        {platform === 'android' && !deferredPrompt && (
                            <div className="bg-slate-800/50 rounded-xl p-3 text-sm text-slate-300 border border-slate-700/50">
                                Tap the browser menu (⋮) and select <span className="font-semibold text-white">Install App</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PwaInstallPrompt;
