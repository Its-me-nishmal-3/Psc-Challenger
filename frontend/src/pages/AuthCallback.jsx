import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            login(token);
            navigate('/');
        } else {
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return <div className="min-h-screen flex items-center justify-center">Processing login...</div>;
}
