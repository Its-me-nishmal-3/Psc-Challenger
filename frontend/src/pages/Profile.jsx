import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogOut, ArrowLeft, Save } from 'lucide-react';

export default function Profile() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setMobile(user.mobile || '');
            setLanguage(user.preferredLanguage || 'en');
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await client.post('/auth/complete-profile', { name, mobile, preferredLanguage: language });
            refreshUser();
            toast.success('Profile Updated Successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen p-4 max-w-lg mx-auto pb-20">
            <header className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold">My Profile</h1>
                <div className="w-9"></div> {/* Spacer */}
            </header>

            <div className="card mb-6 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-primary">
                    {name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-surface border border-slate-700 rounded-lg p-3 outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Mobile Number</label>
                    <input
                        type="tel"
                        disabled
                        value={mobile}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-400 cursor-not-allowed"
                        title="Mobile number cannot be changed"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Preferred Language</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={`p-3 rounded-lg border transition-colors ${language === 'en' ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-slate-700'}`}
                        >
                            English
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('ml')}
                            className={`p-3 rounded-lg border transition-colors ${language === 'ml' ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-slate-700'}`}
                        >
                            മലയാളം
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <div className="pt-6 border-t border-slate-700/50">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-3 text-red-500 bg-red-500/10 rounded-lg flex items-center justify-center gap-2 hover:bg-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </form>
        </div>
    );
}
