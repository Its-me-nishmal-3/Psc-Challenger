import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfile() {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.name) setName(user.name);
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.post('/auth/complete-profile', { name, mobile, preferredLanguage: language });
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-lg border border-slate-700">
                <h2 className="text-2xl font-bold mb-4">Complete Profile</h2>
                <p className="text-slate-400 mb-6">Just a few more details to get started.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mobile Number</label>
                        <input
                            type="tel"
                            required
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full bg-background border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="+91 98765 43210"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Preferred Language</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setLanguage('en')}
                                className={`p-3 rounded-lg border ${language === 'en' ? 'bg-primary/20 border-primary text-white' : 'bg-background border-slate-600'}`}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setLanguage('ml')}
                                className={`p-3 rounded-lg border ${language === 'ml' ? 'bg-primary/20 border-primary text-white' : 'bg-background border-slate-600'}`}
                            >
                                മലയാളം
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 mt-4"
                    >
                        {loading ? 'Saving...' : 'Get Started'}
                    </button>
                </form>
            </div>
        </div>
    );
}
