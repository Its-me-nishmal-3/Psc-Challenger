import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react';

export default function Archive() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArchive = async () => {
            try {
                const { data } = await client.get('/quiz/archive');
                setQuizzes(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchArchive();
    }, []);

    return (
        <div className="min-h-screen p-4 pb-20 max-w-lg mx-auto">
            <header className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-surface rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Quiz Archive</h1>
                    <p className="text-sm text-slate-400">Practice past challenges</p>
                </div>
            </header>

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No past quizzes available yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => (
                        <Link
                            key={quiz._id}
                            to={`/quiz/practice/${quiz._id}`}
                            className="card flex justify-between items-center hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-700 p-3 rounded-lg">
                                    <Calendar className="w-5 h-5 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{quiz.date}</h3>
                                    <p className="text-xs text-slate-400">{quiz.questionIds.length} Questions</p>
                                </div>
                            </div>
                            <div className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded">
                                Practice
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
