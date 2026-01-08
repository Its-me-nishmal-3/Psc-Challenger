import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import client from '../api/client';
import { Trophy, Flame, Brain, BookOpen, Bell, BellRing } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const { permission, requestPermission } = usePushNotifications();
    const [quizStatus, setQuizStatus] = useState('LOADING'); // LOADING, LIVE, COMPLETED, NO_CONTENT

    useEffect(() => {
        const checkQuiz = async () => {
            try {
                // Fetch active quiz (today's logic)
                const { data } = await client.get('/quiz/active');
                if (data.attempted) {
                    setQuizStatus('COMPLETED');
                } else {
                    setQuizStatus('LIVE');
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    setQuizStatus('NO_CONTENT');
                } else {
                    console.error("Error fetching active quiz", error);
                    setQuizStatus('NO_CONTENT');
                }
            }
        };
        checkQuiz();
    }, []);

    return (
        <div className="pb-20 p-4 max-w-lg mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Hello, {user?.name.split(' ')[0]} 👋</h1>
                    <p className="text-slate-400 text-sm">Let's learn something new today!</p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.role === 'admin' && (
                        <Link to="/admin" className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">Admin</Link>
                    )}
                    <button
                        onClick={requestPermission}
                        className={`p-2 rounded-full transition-colors ${permission === 'granted' ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                        title={permission === 'granted' ? 'Notifications Active' : 'Enable Notifications'}
                    >
                        {permission === 'granted' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </button>
                    <Link to="/profile">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    </Link>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="card flex flex-col items-center justify-center py-6">
                    <div className="bg-orange-500/20 p-3 rounded-full mb-2">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="text-2xl font-bold">{user?.streak || 0}</span>
                    <span className="text-xs text-slate-400">Day Streak</span>
                </div>
                <div className="card flex flex-col items-center justify-center py-6">
                    <div className="bg-yellow-500/20 p-3 rounded-full mb-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <span className="text-2xl font-bold">{user?.totalScore || 0}</span>
                    <span className="text-xs text-slate-400">Total Score</span>
                </div>
            </div>

            {/* Leaderboard Banner */}
            <Link to="/leaderboard" className="block mb-8">
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Leaderboard</h3>
                            <p className="text-yellow-100 text-xs">See where you stand!</p>
                        </div>
                    </div>
                    <div className="bg-white text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm relative z-10">
                        View Rank
                    </div>
                </div>
            </Link>

            {/* Story Mode Card (New) */}
            <Link to="/story" className="block mb-8">
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 relative overflow-hidden group shadow-lg shadow-purple-900/20 border border-purple-500/30">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-500/20 p-2 rounded-lg backdrop-blur-sm">
                                <BookOpen className="w-6 h-6 text-purple-300" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Story Mode</h2>
                        </div>
                        <p className="text-purple-200 mb-4">Embark on the Scholar's Journey. Unlock levels and earn stars!</p>
                        <span className="inline-block bg-white text-purple-900 px-4 py-2 rounded-lg font-bold text-sm group-hover:scale-105 transition-transform">
                            Continue Journey
                        </span>
                    </div>
                </div>
            </Link>

            {/* Main Quiz Card */}
            <div className="card mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Daily Quiz (8 PM - 8 PM)
                </h2>

                {quizStatus === 'LOADING' && <div className="animate-pulse h-10 bg-slate-700 rounded mb-2"></div>}

                {quizStatus === 'LIVE' && (
                    <div>
                        <p className="text-slate-300 mb-4">Today's challenge is live!</p>
                        <Link to="/quiz" className="btn-primary w-full block text-center py-3">
                            Start Quiz
                        </Link>
                    </div>
                )}

                {quizStatus === 'NO_CONTENT' && (
                    <div>
                        <p className="text-slate-400 mb-4">No active quiz right now. Check back at 8 PM!</p>
                    </div>
                )}

                {quizStatus === 'COMPLETED' && (
                    <div>
                        <p className="text-green-400 mb-4">You've completed today's quiz!</p>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-center text-sm text-green-300">
                            Come back tomorrow at 8 PM
                        </div>
                    </div>
                )}
            </div>

            {/* Practice / Archive Section */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-secondary" />
                        Practice Mode
                    </h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">Review past quizzes to improve your knowledge without affecting your rank.</p>
                <Link to="/quiz/archive" className="w-full py-3 bg-secondary/10 text-secondary border border-secondary/50 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary/20 transition-colors">
                    Browse Archive
                </Link>
            </div>
        </div>
    );
}
