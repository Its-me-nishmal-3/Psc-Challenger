import React, { createContext, useState, useContext, useEffect } from 'react';
import useSound from 'use-sound';

// Placeholder imports - real files need to be added to src/assets/sounds/
// If files are missing, use-sound usually just warns or plays nothing.
// For now, we point to non-existent files or placeholders.
// Ideally, we'd import them like this:
// import correctSfx from '../assets/sounds/correct.mp3';

const SoundContext = createContext();

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        const stored = localStorage.getItem('sound-muted');
        return stored ? JSON.parse(stored) : false;
    });

    const toggleMute = () => {
        setIsMuted(prev => {
            const newState = !prev;
            localStorage.setItem('sound-muted', JSON.stringify(newState));
            return newState;
        });
    };

    const playSound = (soundPath, options = {}) => {
        if (isMuted) return;
        // In a real implementation with known static imports, we would use the hook directly in components
        // or expose specific play functions here.
        // However, for dynamic usage or centralized control, we can expose the mute state
        // and let components handle their own `useSound` hooks, respecting this state.
    };

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};
