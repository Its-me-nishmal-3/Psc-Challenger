import { useState, useEffect } from 'react';
import client from '../api/client';
import toast from 'react-hot-toast';
import { Settings, Check, X, RefreshCw, Trash2, Calendar, FileText, Plus, Edit, Save, ArrowLeft, Copy, Users, Activity, AlertTriangle, Bell } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('quizzes');
    const [questions, setQuestions] = useState([]);
    const [reportedQuestions, setReportedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [bulkJson, setBulkJson] = useState('');
    const [stats, setStats] = useState({ totalUsers: 0, newUsers: 0, dau: 0 });

    // Notifications State
    const [subscribers, setSubscribers] = useState({ subscribed: [], blocked: [] });
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [manualPush, setManualPush] = useState({ title: '', body: '', url: '/' });

    // Editing State
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const fetchStats = async () => {
        try {
            const { data } = await client.get('/admin/stats');
            setStats(data);
        } catch (error) { console.error(error); }
    };

    const fetchReported = async () => {
        try {
            const { data } = await client.get('/admin/questions/reported');
            setReportedQuestions(data);
        } catch (error) { console.error(error); }
    };

    const fetchQuestions = async () => {
        try {
            const { data } = await client.get('/admin/questions?approved=false');
            setQuestions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await client.get('/admin/users');
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const { data } = await client.get('/admin/quizzes');
            setQuizzes(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSubscribers = async () => {
        try {
            const { data } = await client.get('/admin/users-status');
            setSubscribers(data);
        } catch (error) { console.error(error); }
    };

    const handleSendPush = async (e) => {
        e.preventDefault();

        let recipients = [];
        if (selectAll) {
            recipients = 'all';
        } else {
            recipients = selectedRecipients;
        }

        if (recipients !== 'all' && recipients.length === 0) {
            return toast.error('Please select at least one recipient');
        }

        if (!confirm(`Send notification to ${selectAll ? 'ALL' : recipients.length} users?`)) return;

        setLoading(true);
        try {
            await client.post('/admin/send-manual', {
                ...manualPush,
                recipients
            });
            toast.success('Notifications Sent!');
            setManualPush({ title: '', body: '', url: '/' });
            setSelectedRecipients([]);
            setSelectAll(false);
        } catch (error) {
            toast.error('Failed to send notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(); // always fetch stats
        if (activeTab === 'review') fetchQuestions();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'quizzes') fetchQuizzes();
        if (activeTab === 'reported') fetchReported();
        if (activeTab === 'notifications') fetchSubscribers();
    }, [activeTab]);

    const handleEditQuiz = async (id) => {
        try {
            const { data } = await client.get(`/admin/quiz/${id}`);
            setEditingQuiz(data);
            setEditingQuiz(data);
        } catch (error) {
            toast.error('Could not load quiz details');
        }
    };

    const handleSaveQuizDetails = async (e) => {
        e.preventDefault();
        try {
            await client.patch(`/admin/quiz/${editingQuiz._id}`, { date: editingQuiz.date });
            toast.success('Quiz Updated');
            fetchQuizzes();
        } catch (error) {
            toast.error('Update Failed');
        }
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            await client.put(`/admin/question/${editingQuestion._id}`, editingQuestion);
            setEditingQuiz(prev => ({
                ...prev,
                questionIds: prev.questionIds.map(q => q._id === editingQuestion._id ? editingQuestion : q)
            }));
            setEditingQuestion(null);
            setEditingQuestion(null);
            toast.success('Question Updated');
        } catch (error) {
            toast.error('Question Update Failed');
        }
    };

    const handleApprove = async (id) => {
        try {
            await client.patch(`/admin/questions/${id}/approve`);
            setQuestions(prev => prev.filter(q => q._id !== id));
            await client.patch(`/admin/questions/${id}/approve`);
            setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (error) {
            toast.error('Approval Failed');
        }
    };

    const handleBulkUpload = async () => {
        try {
            const parsed = JSON.parse(bulkJson);
            if (!Array.isArray(parsed)) throw new Error('Root must be an array');
            setLoading(true);

            const first = parsed[0];
            if (first && first.date && Array.isArray(first.questions)) {
                // Schedule Quizzes
                const { data } = await client.post('/admin/quiz/bulk-schedule', { schedules: parsed });
                toast.success(data.message);
            } else {
                // Just Questions
                const { data } = await client.post('/admin/questions/bulk', { questions: parsed });
                toast.success(data.message);
            }
            setBulkJson('');
        } catch (error) {
            toast.error('Invalid JSON or Upload Failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        const topic = prompt("Enter topic (e.g., Solar System, Kerala History):");
        if (!topic) return;

        setLoading(true);
        try {
            const { data } = await client.post('/admin/questions/generate', {
                topic,
                count: 5,
                difficulty: 'medium'
            });
            setBulkJson(JSON.stringify(data, null, 2));
            setBulkJson(JSON.stringify(data, null, 2));
            toast.success('Questions Generated! Please review and click "Import Data".', { duration: 4000 });
        } catch (error) {
            toast.error('Generation Failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm('Delete this quiz? This cannot be undone.')) return;
        try {
            await client.delete(`/admin/quiz/${id}`);
            setQuizzes(prev => prev.filter(q => q._id !== id));
        } catch (error) {
            toast.error('Delete Failed: ' + (error.response?.data?.message || 'Error'));
        }
    };

    const getText = (obj) => {
        if (typeof obj === 'string') return obj;
        return obj?.en || JSON.stringify(obj);
    };

    if (editingQuiz) {
        return (
            <div className="p-4 max-w-4xl mx-auto min-h-screen">
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => setEditingQuiz(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Edit Quiz ({editingQuiz.date})</h1>
                </header>

                <div className="grid gap-6">
                    <div className="card">
                        <h3 className="font-bold mb-4">Quiz Settings</h3>
                        <form onSubmit={handleSaveQuizDetails} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm mb-1 text-slate-400">Date</label>
                                <input
                                    type="date"
                                    value={editingQuiz.date}
                                    onChange={e => setEditingQuiz({ ...editingQuiz, date: e.target.value })}
                                    className="w-full bg-background border border-slate-700 rounded p-2"
                                />
                            </div>
                            <button className="btn-primary py-2 px-6">Save Settings</button>
                        </form>
                    </div>

                    <div className="card">
                        <h3 className="font-bold mb-4">Questions ({editingQuiz.questionIds?.length || 0})</h3>
                        <div className="space-y-4">
                            {editingQuiz.questionIds?.map((q, idx) => (
                                <div key={q._id} className="p-4 bg-background/50 rounded-lg border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-slate-500">Q{idx + 1}</span>
                                        <button
                                            onClick={() => setEditingQuestion(q)}
                                            className="text-primary text-sm hover:underline flex items-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" /> Edit Content
                                        </button>
                                    </div>
                                    <p className="font-medium mb-2">{getText(q.question)}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className={i === (q.correctAnswerIndex ?? 0) ? 'text-green-400' : ''}>
                                                {String.fromCharCode(65 + i)}. {getText(opt)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {editingQuestion && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-surface p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-bold mb-4">Edit Question Content</h3>
                            <form onSubmit={handleUpdateQuestion} className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Question (English)</label>
                                    <textarea
                                        value={typeof editingQuestion.question === 'string' ? editingQuestion.question : editingQuestion.question.en}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            question: { ...editingQuestion.question, en: e.target.value }
                                        })}
                                        className="w-full bg-background p-2 rounded border border-slate-700 h-20"
                                    />
                                    <label className="block text-sm mb-1 mt-2">Question (Malayalam)</label>
                                    <textarea
                                        value={typeof editingQuestion.question === 'string' ? '' : editingQuestion.question.ml || ''}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            question: { ...editingQuestion.question, ml: e.target.value }
                                        })}
                                        className="w-full bg-background p-2 rounded border border-slate-700 h-20"
                                    />
                                </div>

                                <div className="space-y-4">
                                    {editingQuestion.options.map((opt, i) => (
                                        <div key={i} className="p-3 border border-slate-700 rounded bg-slate-800/30">
                                            <div className="mb-2">
                                                <label className="block text-xs mb-1 text-slate-400">Option {i + 1} (English)</label>
                                                <input
                                                    value={typeof opt === 'string' ? opt : opt.en}
                                                    onChange={e => {
                                                        const newOpts = [...editingQuestion.options];
                                                        if (typeof newOpts[i] === 'string') newOpts[i] = { en: newOpts[i], ml: '' };
                                                        newOpts[i] = { ...newOpts[i], en: e.target.value };
                                                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                                                    }}
                                                    className="w-full bg-background p-2 rounded border border-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1 text-slate-400">Option {i + 1} (Malayalam)</label>
                                                <input
                                                    value={typeof opt === 'string' ? '' : opt.ml || ''}
                                                    onChange={e => {
                                                        const newOpts = [...editingQuestion.options];
                                                        if (typeof newOpts[i] === 'string') newOpts[i] = { en: newOpts[i], ml: '' };
                                                        newOpts[i] = { ...newOpts[i], ml: e.target.value };
                                                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                                                    }}
                                                    className="w-full bg-background p-2 rounded border border-slate-700"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm mb-1 font-bold text-primary">Correct Answer (1-4)</label>
                                    <input
                                        type="number"
                                        min="1" max="4"
                                        value={(editingQuestion.correctAnswerIndex ?? 0) + 1}
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            if (val >= 1 && val <= 4) {
                                                setEditingQuestion({ ...editingQuestion, correctAnswerIndex: val - 1 });
                                            }
                                        }}
                                        className="w-full bg-background p-3 rounded border border-primary font-bold text-lg"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-slate-700/50">
                                    <button type="button" onClick={() => setEditingQuestion(null)} className="flex-1 py-2 bg-slate-700 rounded hover:bg-slate-600">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card flex items-center gap-4 bg-blue-500/10 border-blue-500/30">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><Users className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm text-slate-400">Total Users</p>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 bg-green-500/10 border-green-500/30">
                    <div className="p-3 bg-green-500/20 rounded-lg text-green-400"><Activity className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm text-slate-400">Daily Active (Today)</p>
                        <p className="text-2xl font-bold">{stats.dau}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 bg-purple-500/10 border-purple-500/30">
                    <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Calendar className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm text-slate-400">New Users (7d)</p>
                        <p className="text-2xl font-bold">{stats.newUsers}</p>
                    </div>
                </div>
            </div>

            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Admin Console</h1>
                <div className="flex gap-2">
                    {['quizzes', 'users', 'review', 'reported', 'bulk', 'notifications'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'quizzes' && (
                <div className="space-y-8">
                    {/* List Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Scheduled Quizzes ({quizzes.length})</h2>
                            <button onClick={() => setActiveTab('bulk')} className="text-primary text-sm hover:underline flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Schedule New
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-800">
                                    <tr className="text-slate-400 border-b border-slate-700">
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Questions</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizzes.map(q => {
                                        const isPublished = new Date(q.publishedAt) <= new Date();
                                        return (
                                            <tr key={q._id} className="border-b border-slate-700/50 hover:bg-white/5">
                                                <td className="p-3 font-medium">
                                                    {q.date}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${isPublished ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                        {isPublished ? 'LIVE' : 'SCHEDULED'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-slate-400">{q.questionIds?.length || 0} Questions</td>
                                                <td className="p-3 text-right flex justify-end gap-2">
                                                    <button onClick={() => handleDeleteQuiz(q._id)} disabled={isPublished} className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30" title="Delete Quiz">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEditQuiz(q._id)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Edit Quiz">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {quizzes.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                No quizzes scheduled. Use Bulk Import to add quizzes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">All Users ({users.length})</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-700">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Mob</th>
                                    <th className="p-3">Score</th>
                                    <th className="p-3">Streak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} className="border-b border-slate-700/50 hover:bg-white/5">
                                        <td className="p-3">{u.name}</td>
                                        <td className="p-3 text-sm text-slate-300">{u.email}</td>
                                        <td className="p-3 text-sm">{u.mobile || '-'}</td>
                                        <td className="p-3 font-bold text-primary">{u.totalScore}</td>
                                        <td className="p-3 flex items-center gap-1">
                                            <span className="text-orange-500">🔥</span> {u.streak}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'review' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Pending Review ({questions.length})</h2>
                    {questions.map(q => (
                        <div key={q._id} className="card flex justify-between gap-4">
                            <div>
                                <div className="flex gap-2 mb-1">
                                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{q.topic}</span>
                                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded uppercase">{q.difficulty}</span>
                                </div>
                                <h3 className="font-semibold mb-2">{q.question?.en ? q.question.en : q.question}</h3>
                            </div>
                            <div className="flex flex-col gap-2 justify-center">
                                <button onClick={() => handleApprove(q._id)} className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20">
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && <p className="text-center text-slate-500">No pending questions.</p>}
                </div>
            )}

            {activeTab === 'reported' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Reported Issues ({reportedQuestions.length})</h2>
                    {reportedQuestions.map(q => (
                        <div key={q._id} className="card">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold">{getText(q.question)}</h3>
                                <button
                                    onClick={() => { setEditingQuestion(q); setEditingQuiz({}); }} // Hack to trigger modal
                                    className="px-3 py-1 bg-primary/20 text-primary text-xs rounded hover:bg-primary/30"
                                >
                                    Edit / Fix
                                </button>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-3 space-y-2">
                                {q.reports.map((r, i) => (
                                    <div key={i} className="text-sm flex gap-2">
                                        <span className="text-red-400 font-bold">REPORT:</span>
                                        <span className="text-slate-300">{r.reason}</span>
                                        <span className="text-slate-500 text-xs">- {r.userId?.name || 'Unknown'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {reportedQuestions.length === 0 && <p className="text-center text-slate-500">No reported issues. Good job!</p>}
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Compose Section */}
                    <div className="card h-fit sticky top-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" /> Send Notification
                        </h2>
                        <form onSubmit={handleSendPush} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">Title</label>
                                <input
                                    required
                                    value={manualPush.title}
                                    onChange={e => setManualPush({ ...manualPush, title: e.target.value })}
                                    className="w-full bg-background border border-slate-700 rounded p-3 focus:border-primary outline-none"
                                    placeholder="e.g., New Challenge Live!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">Body</label>
                                <textarea
                                    required
                                    value={manualPush.body}
                                    onChange={e => setManualPush({ ...manualPush, body: e.target.value })}
                                    className="w-full bg-background border border-slate-700 rounded p-3 h-24 focus:border-primary outline-none"
                                    placeholder="e.g., Test your knowledge on Kerala History now."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-slate-400">Action URL</label>
                                <input
                                    value={manualPush.url}
                                    onChange={e => setManualPush({ ...manualPush, url: e.target.value })}
                                    className="w-full bg-background border border-slate-700 rounded p-3 focus:border-primary outline-none"
                                    placeholder="/quiz or /leaderboard"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-700/50">
                                <p className="text-sm font-bold mb-2">Target Audience</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={e => setSelectAll(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-background text-primary focus:ring-primary"
                                    />
                                    <span className={selectAll ? 'text-white' : 'text-slate-400'}>Send to ALL Allowed Users ({subscribers.subscribed.length})</span>
                                </div>
                                {!selectAll && (
                                    <p className="text-xs text-slate-500">
                                        Selected: {selectedRecipients.length} users
                                    </p>
                                )}
                            </div>

                            <button disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                                {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                Send Notification
                            </button>
                        </form>
                    </div>

                    {/* Recipient List */}
                    <div className="space-y-6">
                        {/* Allowed List */}
                        <div>
                            <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center justify-between">
                                <span>Allowed Users (Subscribed)</span>
                                <span className="text-xs bg-green-400/10 px-2 py-1 rounded">{subscribers.subscribed.length}</span>
                            </h3>
                            <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                                {!subscribers.subscribed.length ? (
                                    <p className="p-4 text-center text-slate-500 text-sm">No subscribed users yet.</p>
                                ) : (
                                    subscribers.subscribed.map(u => (
                                        <div key={u._id} className="p-3 border-b border-slate-700/50 hover:bg-slate-800/50 flex items-center gap-3 transition-colors">
                                            <input
                                                type="checkbox"
                                                disabled={selectAll}
                                                checked={selectAll || selectedRecipients.includes(u._id)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedRecipients([...selectedRecipients, u._id]);
                                                    else setSelectedRecipients(selectedRecipients.filter(id => id !== u._id));
                                                }}
                                                className="w-4 h-4 rounded border-slate-600 bg-background text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{u.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                            </div>
                                            <div className="text-xs bg-slate-700 px-2 py-1 rounded flex items-center gap-1" title="Active Devices">
                                                <Activity size={10} /> {u.deviceCount}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Blocked/Not Subscribed List */}
                        <div>
                            <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center justify-between">
                                <span>Not Subscribed / Blocked</span>
                                <span className="text-xs bg-red-400/10 px-2 py-1 rounded">{subscribers.blocked.length}</span>
                            </h3>
                            <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto opacity-75">
                                {!subscribers.blocked.length ? (
                                    <p className="p-4 text-center text-slate-500 text-sm">Everyone is subscribed! 🎉</p>
                                ) : (
                                    subscribers.blocked.map(u => (
                                        <div key={u._id} className="p-3 border-b border-slate-700/50 flex items-center gap-3">
                                            <X size={16} className="text-red-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-400 truncate">{u.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'bulk' && (
                <div className="card max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Bulk Import</h2>
                        <button
                            onClick={handleGenerateAI}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-purple-900/20"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                        Supported Formats:<br />
                        1. <b>Schedule Quizzes</b>: <code>[{`{ "date": "YYYY-MM-DD", "questions": [...] }`}]</code><br />
                        2. <b>Just Questions</b>: <code>[{`{ "question": {"en":"..."}, ... }`}]</code>
                    </p>
                    <textarea
                        value={bulkJson}
                        onChange={e => setBulkJson(e.target.value)}
                        className="w-full h-64 bg-background border border-slate-700 rounded p-4 font-mono text-sm mb-4"
                        placeholder='Paste JSON here...'
                    ></textarea>
                    <button
                        onClick={handleBulkUpload}
                        disabled={loading}
                        className="w-full btn-primary py-3"
                    >
                        {loading ? 'Uploading...' : 'Import Data'}
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-4">Tip: Use the "Copy Prompt" button to get properly formatted JSON from ChatGPT or Gemini.</p>
                </div>
            )}
        </div>
    );
}
