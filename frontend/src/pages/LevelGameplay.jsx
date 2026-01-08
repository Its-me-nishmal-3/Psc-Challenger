import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSound from 'use-sound';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSoundContext } from '../context/SoundContext';
import { Clock, Volume2, ArrowLeft, Star, Home, RotateCcw, ArrowRight, Globe } from 'lucide-react';

// Sounds
import correctSfx from '../assets/sounds/correct.mp3';
import wrongSfx from '../assets/sounds/wrong.mp3';
import cheerSfx from '../assets/sounds/cheer.mp3';
import clickSfx from '../assets/sounds/click.mp3';

export default function LevelGameplay() {
    const { levelNumber } = useParams();
    const navigate = useNavigate();
    const { isMuted } = useSoundContext();
    const { user } = useAuth();

    const [level, setLevel] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [result, setResult] = useState(null);

    // New Feature State
    const [currentLang, setCurrentLang] = useState(user?.preferredLanguage || 'en');
    const [timer, setTimer] = useState(30);

    const [playCorrect] = useSound(correctSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playWrong] = useSound(wrongSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playCheer] = useSound(cheerSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playClick] = useSound(clickSfx, { volume: 0.25, soundEnabled: !isMuted });

    useEffect(() => {
        const fetchLevel = async () => {
            try {
                const { data } = await client.get(`/levels/${levelNumber}`);
                setLevel(data);
                setStartTime(Date.now());
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load level');
                navigate('/story');
            } finally {
                setLoading(false);
            }
        };
        fetchLevel();
    }, [levelNumber]);

    // Timer Effect
    useEffect(() => {
        if (!level || submitting || result) return;

        // If already answered/locked, don't run timer? 
        // Actually, if answered, maybe stop timer or let it run? 
        // User didn't specify, but usually if answered, we wait for user to click Next.
        // If "Time Up" logic is checking for skipped questions, we need to handle that.
        // Let's keep it simple: Timer runs for the current question limit. 
        // If user answers, we can STOP the timer or just let it be. 
        // But if they answer, they can click Next. 

        const currentQ = level.questionIds[currentQuestion];
        const isLocked = answers.find(a => a.questionId === currentQ._id && a.isLocked);

        if (isLocked) {
            setTimer(0);
            return;
        }

        setTimer(30);

        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentQuestion, level, result]); // Removed 'answers' dependency to avoid reset loop, handled logic inside

    const handleTimeUp = () => {
        const currentQ = level.questionIds[currentQuestion];
        // Mark as Time Up (Locked with null answer)
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === currentQ._id);
            if (!existing) {
                return [...prev, { questionId: currentQ._id, answer: null, isLocked: true }];
            }
            return prev; // Already answered?
        });
        toast.error("Time's Up!");
        handleNext(true);
    };

    const getText = (obj) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[currentLang] || obj['en'] || '';
    };

    const handleOptionSelect = (index) => {
        const currentQ = level.questionIds[currentQuestion];
        const existing = answers.find(a => a.questionId === currentQ._id);

        if (existing?.isLocked) return; // Locked

        playClick();
        if (existing) {
            setAnswers(prev => prev.map(a => a.questionId === currentQ._id ? { ...a, answer: index } : a));
        } else {
            setAnswers(prev => [...prev, { questionId: currentQ._id, answer: index }]);
        }
    };

    const getSelectedAnswer = () => {
        const currentQ = level?.questionIds[currentQuestion];
        if (!currentQ) return null;
        const found = answers.find(a => a.questionId === currentQ._id);
        return found ? found.answer : null;
    };

    const isCurrentQuestionLocked = () => {
        const currentQ = level?.questionIds[currentQuestion];
        if (!currentQ) return false;
        return answers.find(a => a.questionId === currentQ._id)?.isLocked;
    };

    const handleNext = (auto = false) => {
        // If not auto, check if answered
        if (!auto) {
            const currentQ = level.questionIds[currentQuestion];
            const hasAnswer = answers.find(a => a.questionId === currentQ._id);
            if (!hasAnswer && !hasAnswer?.isLocked) {
                toast.error("Please select an answer!");
                return;
            }
        }

        // Lock question on proceed
        const currentQId = level.questionIds[currentQuestion]._id;
        // Don't overwrite if it was already time-up locked (which sets null answer), 
        // but if it's a normal answer, we mark it locked now.
        // Actually, we can just update the answers array to set locked: true for this qId.

        setAnswers(prev => prev.map(a => a.questionId === currentQId ? { ...a, isLocked: true } : a));

        if (currentQuestion < level.questionIds.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else if (auto) {
            // ...
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Submit answers?')) return;
        setSubmitting(true);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        try {
            const { data } = await client.post(`/levels/${levelNumber}/submit`, {
                answers,
                timeTaken
            });
            setResult(data);
            if (data.passed) playCheer();
            else playWrong();
        } catch (error) {
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSpeak = (text) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'ml' ? 'ml-IN' : 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    if (result) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
                <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-2xl border border-slate-700 text-center animate-up">
                    <h2 className={`text-4xl font-bold mb-2 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
                        {result.passed ? 'Level Complete!' : 'Level Failed'}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        {result.passed ? 'Great job! You are getting stronger.' : 'Don\'t give up. Learn from mistakes.'}
                    </p>

                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3].map(star => (
                            <Star
                                key={star}
                                className={`w-12 h-12 transition-all duration-500 ${star <= result.stars ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-glow' : 'text-slate-700'}`}
                            />
                        ))}
                    </div>

                    <p className="text-2xl font-bold mb-8">Score: {result.score} / {result.total}</p>

                    <div className="grid gap-3">
                        {result.passed && result.nextLevel ? (
                            <button
                                onClick={() => {
                                    setResult(null);
                                    navigate(`/story/play/${result.nextLevel}`);
                                }}
                                className="btn-primary py-3 flex items-center justify-center gap-2"
                            >
                                Next Level <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className="py-3 bg-slate-700 rounded-lg hover:bg-slate-600 flex items-center justify-center gap-2 font-bold"
                            >
                                <RotateCcw className="w-5 h-5" /> Retry
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/story')}
                            className="py-3 text-slate-400 hover:text-white flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" /> Back to Map
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading || !level) return <div className="min-h-screen flex items-center justify-center">Loading Level...</div>;

    const question = level.questionIds[currentQuestion];
    const progress = ((currentQuestion + 1) / level.questionIds.length) * 100;
    const isLast = currentQuestion === level.questionIds.length - 1;

    return (
        <div className="min-h-screen p-4 pb-20 max-w-lg mx-auto flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/story')} className="p-2 bg-slate-800 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <h2 className="text-sm text-slate-400 uppercase tracking-widest">Level {level.levelNumber}</h2>
                    <p className="font-bold">{level.title}</p>
                </div>
                {/* Language Toggle */}
                <button
                    onClick={() => setCurrentLang(prev => prev === 'en' ? 'ml' : 'en')}
                    className="flex items-center gap-2 bg-surface border border-slate-700 rounded-full px-3 py-1 text-xs hover:bg-slate-700 transition-colors"
                >
                    <Globe className="w-3 h-3" />
                    <span className="uppercase font-bold">{currentLang}</span>
                </button>
            </div>

            <div className="mb-4">
                {/* Timer Bar */}
                <div className="flex justify-between items-end mb-1">
                    <div className="text-xs text-slate-500">
                        Question {currentQuestion + 1} of {level.questionIds.length}
                    </div>
                    <div className={`text-sm font-bold flex items-center gap-1 ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                        <Clock className="w-4 h-4" /> {timer}s
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                {/* Timer Countdown Bar */}
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 linear ${timer < 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(timer / 30) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex-1">
                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <h1 className="text-xl font-bold leading-relaxed">{getText(question.question)}</h1>
                        <button onClick={() => handleSpeak(getText(question.question))} className="p-2 text-slate-400 hover:text-white">
                            <Volume2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {isCurrentQuestionLocked() && getSelectedAnswer() === null && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-center font-bold animate-pulse">
                            ⏰ Time's Up! You cannot answer this question.
                        </div>
                    )}
                    {question.options.map((opt, idx) => {
                        const isSelected = getSelectedAnswer() === idx;
                        const locked = isCurrentQuestionLocked();
                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={locked}
                                className={`w-full p-4 rounded-xl text-left border transition-all relative overflow-hidden ${isSelected
                                    ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                                    : locked ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800' : 'bg-surface border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-primary border-primary' : 'border-slate-600 text-slate-500'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-lg">{getText(opt)}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button onClick={handlePrev} disabled={currentQuestion === 0} className="text-slate-500 disabled:opacity-30 hover:text-white p-2">
                    Prev
                </button>

                {isLast ? (
                    <button
                        onClick={handleSubmit}
                        // Allow submit if (answers + locked) == total
                        disabled={submitting || answers.length < level.questionIds.length}
                        className="btn-primary py-2 px-8 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {submitting ? 'Checking...' : 'Finish Level'}
                    </button>
                ) : (
                    <button
                        onClick={() => handleNext(false)}
                        className={`btn-primary py-2 px-8 shadow-lg shadow-primary/20 ${!getSelectedAnswer() && !isCurrentQuestionLocked() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
