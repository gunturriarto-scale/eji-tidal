import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView = () => {
    const { loginWithPassword, loading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && password) loginWithPassword(email, password);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <img src="/logo.png" alt="EJI Logo" className="login-logo" />
                    </div>
                    <h1 className="gradient-text">EJI TIDAL Dashboard</h1>
                    <p>Performance Marketing Command Center</p>
                </div>

                <div className="login-body">
                    {error && (
                        <div className="error-message">
                            <span>🚫 {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="nama@eji.co.id"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="login-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="login-input"
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    style={{
                                        position: 'absolute', right: '0.75rem', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem',
                                        padding: '4px'
                                    }}
                                >
                                    {showPass ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="login-btn"
                        >
                            {loading ? <span className="loader" /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: radial-gradient(circle at top right, #1e1b4b 0%, #000000 100%);
                    color: white;
                    padding: 2rem;
                }
                .login-card {
                    background: rgba(255,255,255,0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    padding: 3rem;
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    animation: slideUp 0.8s cubic-bezier(0.16,1,0.3,1);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .login-logo {
                    width: 110px;
                    height: auto;
                    display: block;
                }
                .login-header h1 {
                    font-size: 1.75rem;
                    margin-bottom: 0.4rem;
                }
                .login-header p {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.85rem;
                    margin-bottom: 2rem;
                }
                .error-message {
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.2);
                    color: #ef4444;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    font-size: 0.82rem;
                    text-align: left;
                }
                .input-group {
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .input-group label {
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.55);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .login-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 10px;
                    color: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s;
                    box-sizing: border-box;
                }
                .login-input::placeholder { color: rgba(255,255,255,0.25); }
                .login-input:focus {
                    border-color: rgba(99,102,241,0.6);
                    background: rgba(255,255,255,0.09);
                }
                .login-btn {
                    width: 100%;
                    padding: 0.875rem;
                    margin-top: 0.5rem;
                    background: linear-gradient(135deg, #3742fa, #6366f1);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.03em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 48px;
                }
                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(99,102,241,0.4);
                }
                .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .loader {
                    width: 20px; height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-bottom-color: white;
                    border-radius: 50%;
                    display: inline-block;
                    animation: rotation 0.8s linear infinite;
                }
                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            ` }} />
        </div>
    );
};
