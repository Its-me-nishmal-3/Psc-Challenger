import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import useSound from 'use-sound';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSoundContext } from '../context/SoundContext';
import { Clock, Globe, Flag, Volume2, VolumeX, Mic, PlayCircle, Star, Home, RotateCcw } from 'lucide-react';

// Sound Assets (Placeholders until files are added)
import correctSfx from '../assets/sounds/correct.mp3';
import wrongSfx from '../assets/sounds/wrong.mp3';
import cheerSfx from '../assets/sounds/cheer.mp3';
import clickSfx from '../assets/sounds/click.mp3';

export default function Quiz() {
    const { user, refreshUser } = useAuth();
    const { isMuted, toggleMute } = useSoundContext();
    const navigate = useNavigate();
    const { id } = useParams();

    const [quiz, setQuiz] = useState(null);
    const [result, setResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [lockedQuestions, setLockedQuestions] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [mode, setMode] = useState('daily');
    const [currentLang, setCurrentLang] = useState(user?.preferredLanguage || 'en');
    const [timer, setTimer] = useState(30);

    // Sound Hooks
    const [playCorrect] = useSound(correctSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playWrong] = useSound(wrongSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playCheer] = useSound(cheerSfx, { volume: 0.5, soundEnabled: !isMuted });
    const [playClick] = useSound(clickSfx, { volume: 0.25, soundEnabled: !isMuted });

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                let data;
                if (id) {
                    setMode('practice');
                    const res = await client.get(`/quiz/${id}`);
                    data = res.data;
                } else {
                    setMode('daily');
                    const res = await client.get('/quiz/active');
                    data = res.data.quiz;
                    if (res.data.attempted) {
                        toast.error('You have already completed the active quiz!');
                        navigate('/');
                        return;
                    }
                }

                if (!data) throw new Error('No quiz found');
                setQuiz(data);
                setStartTime(Date.now());
            } catch (error) {
                console.error(error);
                toast.error('Could not load quiz.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id, navigate]);

    // Timer Effect
    useEffect(() => {
        if (!quiz || submitting) return;

        const qId = quiz.questionIds[currentQuestion]._id;
        if (lockedQuestions[qId]) {
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
    }, [currentQuestion, quiz, submitting]); // Removed lockedQuestions dep to prevent loops

    // Update lang if user preference changes (though internal toggle overrides)
    useEffect(() => {
        if (user?.preferredLanguage) {
            // Only if we want to sync. But local toggle should persist for session preferably. 
            // Let's stick to local state initialized by user pref.
        }
    }, [user]);

    const handleTimeUp = () => {
        const qId = quiz.questionIds[currentQuestion]._id;
        setLockedQuestions(prev => ({ ...prev, [qId]: true }));
        // Also set answer to -1 (Times Up)? 
        // Need to make sure backend handles index -1 (or undefined) gracefully as wrong.
        setAnswers(prev => ({ ...prev, [qId]: -1 }));

        toast.error("Time's Up!");
        handleNext(true);
    };

    const getText = (obj) => {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[currentLang] || obj['en'] || '';
    };

    const handleSpeak = (text) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLang === 'ml' ? 'ml-IN' : 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const handleReport = async () => {
        const reason = prompt("What is wrong with this question? (e.g. Translation error, Wrong Answer)");
        if (!reason) return;

        const qId = quiz.questionIds[currentQuestion]._id;
        try {
            await client.post(`/quiz/question/${qId}/report`, { reason });
            toast.success("Thanks for the feedback! We will look into it.");
        } catch (error) {
            toast.error("Failed to send report.");
        }
    };

    const handleOptionSelect = (index) => {
        playClick();
        const questionId = quiz.questionIds[currentQuestion]._id;
        setAnswers(prev => ({ ...prev, [questionId]: index }));
    };

    const handleNext = (auto = false) => {
        // Lock current question to prevent changing answer
        const currentQId = quiz.questionIds[currentQuestion]._id;
        setLockedQuestions(prev => ({ ...prev, [currentQId]: true }));

        if (currentQuestion < quiz.questionIds.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else if (auto) {
            // Last question time up
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Are you sure you want to submit?')) return;

        setSubmitting(true);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        const formattedAnswers = Object.entries(answers).map(([qId, idx]) => ({
            questionId: qId,
            answer: idx
        }));

        try {
            const { data } = await client.post('/quiz/submit', {
                quizId: quiz._id,
                answers: formattedAnswers,
                timeTaken,
                mode
            });

            // Critical: Refresh user stats locally so dashboard updates immediately
            if (refreshUser) refreshUser();

            if (data.score > 0) {
                playCheer();
            } else {
                playWrong();
            }
            setResult(data);
            // toast.success(`Quiz Submitted! Score: ${data.score}`, { duration: 5000, icon: '🎉' });
            // navigate('/');
        } catch (error) {
            console.error(error);
            toast.error('Submission failed: ' + (error.response?.data?.message || 'Server Error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Quiz...</div>;

    // Result View
    if (result) {
        return (
            <div className="min-h-screen bg-background p-4 pb-20 relative overflow-y-auto">
                <div className="max-w-md mx-auto bg-surface p-6 rounded-2xl shadow-2xl border border-slate-700 text-center animate-up">
                    <h2 className="text-3xl font-bold mb-2 text-primary">
                        Quiz Complete!
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Here is how you performed
                    </p>

                    <div className="flex justify-center gap-4 mb-6">
                        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex-1">
                            <div className="text-3xl font-bold text-green-500">{result.correct}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Correct</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex-1">
                            <div className="text-3xl font-bold text-red-500">{result.incorrect}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Incorrect</div>
                        </div>
                    </div>

                    <p className="text-2xl font-bold mb-8">Total Score: {result.score}</p>

                    <div className="grid gap-3 mb-8">
                        <button
                            onClick={() => window.location.reload()}
                            className="py-3 bg-slate-700 rounded-lg hover:bg-slate-600 flex items-center justify-center gap-2 font-bold"
                        >
                            <RotateCcw className="w-5 h-5" /> Retry
                        </button>
                        <button
                            onClick={() => navigate(mode === 'daily' ? '/' : '/quiz/archive')}
                            className="py-3 text-slate-400 hover:text-white flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" /> Back to {mode === 'daily' ? 'Home' : 'Archive'}
                        </button>
                    </div>

                    {/* Detailed Review Section */}
                    <div className="text-left space-y-6">
                        <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-4">Review Answers</h3>
                        {quiz.questionIds.map((q, idx) => {
                            const res = result.results.find(r => r.questionId === q._id);
                            const userAns = res ? res.answer : null; // Index or null
                            const correctAns = res ? res.correctAnswer : null; // Index
                            const isCorrect = userAns === correctAns;

                            // Handle Locked/Unanswered logic (userAns might be -1 or null)
                            const isSkipped = userAns === null || userAns === -1 || userAns === undefined;

                            return (
                                <div key={q._id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                                        {isCorrect ? (
                                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">Correct</span>
                                        ) : (
                                            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold">{isSkipped ? 'Time Up/Skipped' : 'Incorrect'}</span>
                                        )}
                                    </div>
                                    <p className="font-semibold mb-3">{getText(q.question)}</p>

                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            let styles = "p-2 rounded text-sm border border-transparent opacity-70";
                                            if (optIdx === correctAns) {
                                                styles = "p-2 rounded text-sm bg-green-500/20 border-green-500 text-green-400 font-bold";
                                            } else if (optIdx === userAns && !isCorrect) {
                                                styles = "p-2 rounded text-sm bg-red-500/20 border-red-500 text-red-400";
                                            }

                                            // Show marker
                                            let marker = "";
                                            if (optIdx === correctAns) marker = " ✅";
                                            if (optIdx === userAns && !isCorrect) marker = " ❌";

                                            return (
                                                <div key={optIdx} className={styles}>
                                                    {String.fromCharCode(65 + optIdx)}. {getText(opt)} {marker}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) return null;

    const question = quiz.questionIds[currentQuestion];
    const isLastMsg = currentQuestion === quiz.questionIds.length - 1;
    const progress = ((currentQuestion + 1) / quiz.questionIds.length) * 100;

    return (
        <div className="min-h-screen p-4 flex flex-col max-w-lg mx-auto pb-20">
            {/* Header / Meta */}
            <div className="mb-6 flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded uppercase ${mode === 'daily' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {mode === 'daily' ? 'Live Event' : 'Practice Mode'}
                </span>

                {/* Language Toggle */}
                <button
                    onClick={() => setCurrentLang(prev => prev === 'en' ? 'ml' : 'en')}
                    className="flex items-center gap-2 bg-surface border border-slate-700 rounded-full px-3 py-1 text-xs hover:bg-slate-700 transition-colors"
                >
                    <Globe className="w-3 h-3" />
                    <span className="uppercase font-bold">{currentLang}</span>
                </button>

                <button
                    onClick={toggleMute}
                    className="flex items-center gap-2 bg-surface border border-slate-700 rounded-full px-3 py-1 text-xs hover:bg-slate-700 transition-colors ml-2"
                >
                    {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-green-400" />}
                </button>
                <button
                    onClick={handleReport}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-full px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors ml-2"
                    title="Report Issue"
                >
                    <Flag className="w-3 h-3" />
                    <span className="uppercase font-bold">Report</span>
                </button>
            </div>

            {/* Progress */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-400">Question {currentQuestion + 1}/{quiz.questionIds.length}</span>
                    <div className={`text-sm font-bold flex items-center gap-1 ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                        <Clock className="w-4 h-4" /> {timer}s
                    </div>
                </div>
                <div className="h-1 bg-surface rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                {/* Timer Countdown Bar */}
                <div className="h-1 bg-surface rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 linear ${timer < 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${(timer / 30) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Question */}
            <div className="flex-1">
                <h2 className="text-xl font-bold mb-6 leading-relaxed flex items-start gap-3">
                    <span className="flex-1">{getText(question.question)}</span>
                    <button
                        onClick={() => handleSpeak(getText(question.question))}
                        className="p-2 bg-slate-700/50 rounded-full hover:bg-primary/20 hover:text-primary transition-colors flex-shrink-0"
                        title="Read Aloud"
                    >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </h2>
                <div className="space-y-3">
                    {lockedQuestions[question._id] && answers[question._id] === -1 && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-center font-bold animate-pulse">
                            ⏰ Time's Up! You cannot answer this question.
                        </div>
                    )}
                    {question.options.map((option, idx) => {
                        const isLocked = lockedQuestions[question._id];
                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(idx)}
                                disabled={isLocked}
                                className={`w-full p-4 rounded-xl text-left border transition-all ${answers[question._id] === idx
                                    ? 'bg-primary/20 border-primary text-white'
                                    : isLocked ? 'opacity-50 cursor-not-allowed bg-slate-900 border-slate-800' : 'bg-surface border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${answers[question._id] === idx ? 'bg-primary border-primary' : 'border-slate-500'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-lg">{getText(option)}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-between">
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="px-6 py-3 rounded-lg text-slate-400 disabled:opacity-30"
                >
                    Previous
                </button>

                {isLastMsg ? (
                    <button
                        onClick={handleSubmit}
                        // Allow submit if we have record for all (even if -1/locked)
                        disabled={submitting || Object.keys(answers).length < quiz.questionIds.length}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                ) : (
                    <button
                        onClick={() => handleNext(false)}
                        className={`px-8 py-3 bg-primary hover:bg-indigo-500 rounded-lg font-medium shadow-lg shadow-indigo-900/20 ${(answers[question._id] === undefined && !lockedQuestions[question._id]) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
}
