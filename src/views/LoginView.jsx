import React from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginView = () => {
    const { loginWithGoogle, loading, error } = useAuth();

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img src="/logo.png" alt="EJI Logo" className="login-logo" style={{ filter: 'invert(1)' }} />
                    <h1 className="gradient-text">EJI TIDAL Dashboard</h1>
                    <p>Performance Marketing Command Center</p>
                </div>
                
                <div className="login-body">
                    {error && (
                        <div className="error-message">
                            <span>🚫 {error}</span>
                        </div>
                    )}
                    
                    <button 
                        onClick={loginWithGoogle} 
                        disabled={loading}
                        className="google-btn"
                    >
                        {loading ? (
                            <span className="loader"></span>
                        ) : (
                            <>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>
                    
                    <div className="login-footer">
                        <p>Restricted access for <strong>@eji.co.id</strong> accounts only.</p>
                    </div>
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
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 3rem;
                    width: 100%;
                    max-width: 450px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .login-logo {
                    width: 80px;
                    height: auto;
                    margin-bottom: 2rem;
                    filter: drop-shadow(0 0 10px rgba(55, 66, 250, 0.3));
                }

                .login-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .login-header p {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.9rem;
                    margin-bottom: 3rem;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    font-size: 0.85rem;
                }

                .google-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 0.875rem;
                    background: white;
                    color: #1f2937;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .google-btn:hover {
                    background: #f9fafb;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }

                .google-btn:active {
                    transform: translateY(0);
                }

                .google-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .google-btn img {
                    width: 18px;
                    height: 18px;
                }

                .login-footer {
                    margin-top: 2rem;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .login-footer strong {
                    color: #3742fa;
                }

                .loader {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e5e7eb;
                    border-bottom-color: #3742fa;
                    border-radius: 50%;
                    display: inline-block;
                    animation: rotation 1s linear infinite;
                }

                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            ` }} />
        </div>
    );
};
