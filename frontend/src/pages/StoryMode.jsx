import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Lock, Star, Play, CheckCircle, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoryMode() {
    const navigate = useNavigate();
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const { data } = await client.get('/levels');
                setLevels(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load story map');
            } finally {
                setLoading(false);
            }
        };
        fetchLevels();
    }, []);

    const handlePlay = (level) => {
        if (level.status === 'locked') {
            toast.error('Complete previous levels to unlock this one!');
            return;
        }
        navigate(`/story/play/${level.levelNumber}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading Map...</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="p-4 bg-surface sticky top-0 z-10 border-b border-slate-700/50 flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Story Mode
                </h1>
            </header>

            <div className="p-6 max-w-lg mx-auto flex flex-col items-center gap-8 mt-4 relative">
                {/* Visual Path Line (Background) */}
                <div className="absolute top-10 bottom-10 w-1 bg-slate-800 rounded-full left-1/2 -translate-x-1/2 -z-10"></div>

                {levels.map((level, index) => {
                    const isLeft = index % 2 === 0;
                    return (
                        <div key={level._id} className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} relative`}>
                            {/* Connector Dot */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-background ${level.status === 'locked' ? 'bg-slate-700' : 'bg-primary'}`}></div>

                            {/* Level Card */}
                            <div
                                onClick={() => handlePlay(level)}
                                className={`
                                    w-[45%] p-4 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105
                                    ${level.status === 'locked'
                                        ? 'bg-slate-900 border-slate-700 opacity-70 grayscale'
                                        : 'bg-surface border-primary shadow-lg shadow-primary/10'
                                    }
                                    ${level.status === 'completed' ? 'border-green-500/50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Level {level.levelNumber}</span>
                                    {level.status === 'locked' ? (
                                        <Lock className="w-4 h-4 text-slate-600" />
                                    ) : level.status === 'completed' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Play className="w-4 h-4 text-primary animate-pulse" />
                                    )}
                                </div>
                                <h3 className="font-bold text-sm mb-1">{level.title}</h3>

                                {/* Stars */}
                                <div className="flex gap-1 mt-2">
                                    {[1, 2, 3].map(star => (
                                        <Star
                                            key={star}
                                            className={`w-3 h-3 ${star <= (level.stars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
