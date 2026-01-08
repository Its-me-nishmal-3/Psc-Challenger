import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function YesterdayQuiz() {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchYesterday = async () => {
            try {
                const { data } = await client.get('/quiz/yesterday');
                setQuiz(data.quiz);
            } catch (err) {
                setError('No quiz available from yesterday.');
            } finally {
                setLoading(false);
            }
        };
        fetchYesterday();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen p-4 pb-20 max-w-lg mx-auto">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Yesterday's Quiz</h1>
                    <p className="text-sm text-slate-400">Review and Practice</p>
                </div>
            </header>

            {error ? (
                <div className="card text-center p-8 text-slate-400">
                    {error}
                </div>
            ) : (
                <div className="space-y-6">
                    {quiz.questionIds.map((q, index) => (
                        <div key={q._id} className="card">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded">Q{index + 1}</span>
                                <span className="text-xs text-slate-500 uppercase">{q.difficulty}</span>
                            </div>
                            <h3 className="font-semibold text-lg mb-4">{q.question}</h3>
                            <div className="space-y-2">
                                {q.options.map((opt, i) => {
                                    const isCorrect = opt === q.correctAnswer;
                                    return (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-lg border-2 flex justify-between items-center ${isCorrect
                                                    ? 'border-green-500/50 bg-green-500/10'
                                                    : 'border-slate-700 bg-slate-800/50'
                                                }`}
                                        >
                                            <span className={isCorrect ? 'text-green-400 font-medium' : 'text-slate-300'}>
                                                {opt}
                                            </span>
                                            {isCorrect && <Check className="w-4 h-4 text-green-500" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
