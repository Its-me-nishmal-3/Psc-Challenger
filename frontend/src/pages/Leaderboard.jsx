import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Trophy, Crown, Medal } from 'lucide-react';

export default function Leaderboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('daily');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: res } = await client.get(`/leaderboard?type=${activeTab}`);
                setData(res);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown className="w-5 h-5 text-yellow-500 drop-shadow-glow" />;
        if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
        if (index === 2) return <Medal className="w-5 h-5 text-orange-600" />;
        return <span className="text-sm font-bold text-slate-500">#{index + 1}</span>;
    };

    const getRankStyles = (index) => {
        if (index === 0) return 'border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent';
        if (index === 1) return 'border-slate-300/30';
        if (index === 2) return 'border-orange-600/30';
        return 'border-transparent';
    };

    return (
        <div className="p-4 max-w-lg mx-auto min-h-screen pb-20">
            <header className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Leaderboard <Trophy className="w-5 h-5 text-yellow-500" />
                    </h1>
                    <p className="text-xs text-slate-400">Top learners of the community</p>
                </div>
            </header>

            <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
                {['daily', 'all-time', 'story'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all ${activeTab === tab
                            ? 'bg-primary text-white shadow-lg scale-105'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center p-8 text-slate-500 animate-pulse">Loading rankings...</div>
                ) : (
                    data.map((item, index) => (
                        <div
                            key={index}
                            className={`card flex items-center gap-4 py-4 px-4 border-l-4 transition-transform hover:scale-[1.01] ${getRankStyles(index)}`}
                        >
                            <div className="w-8 flex justify-center">
                                {getRankIcon(index)}
                            </div>

                            <div className="flex-1">
                                <p className={`font-bold ${index === 0 ? 'text-yellow-400 text-lg' : 'text-slate-200'}`}>
                                    {item.name}
                                </p>
                                {/* Subtext based on Tab */}
                                {activeTab === 'daily' && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        ⏱️ {item.timeTaken}s
                                    </p>
                                )}
                                {activeTab === 'story' && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        Lvl {item.level} • {item.stars} Stars
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                {activeTab === 'story' ? (
                                    // For Story, maybe show Level as main metric or Score?
                                    // Used 'score' in backend response as totalScore.
                                    // Let's show Level big? Or Score? 
                                    // Design: Main is Level, Sub is Stars.
                                    // Or Main is Total Score? 
                                    // Backend sends: level, stars, score (totalScore).
                                    // Let's show Level as the big number.
                                    <div className="text-center">
                                        <p className="font-bold text-primary text-lg">Lvl {item.level}</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-bold text-primary text-lg">{item.score || item.totalScore}</p>
                                        <p className="text-xs text-slate-400 flex justify-end items-center gap-1">
                                            <span className="text-orange-500">🔥</span> {item.streak}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {!loading && data.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-slate-400">No records yet.<br />Be the first to claim the throne!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
