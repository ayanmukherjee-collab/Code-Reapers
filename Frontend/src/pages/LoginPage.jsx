import React from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage = () => {
    const { login, user } = useUser();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await login();
            navigate('/');
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-2">Welcome to CampusConnect</h1>
                <p className="text-gray-500 mb-8">Sign in to continue</p>

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-black text-white px-6 py-4 rounded-xl font-semibold hover:bg-gray-900 transition-all"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
