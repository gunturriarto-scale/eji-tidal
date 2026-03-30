import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 1. Check current session on mount (persistence)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // Double check domain even if session exists
                if (session.user.email.endsWith('@eji.co.id')) {
                    setUser(session.user);
                } else {
                    await supabase.auth.signOut();
                    setError('Unauthorized domain. Only @eji.co.id is allowed.');
                }
            }
            setLoading(false);
        };

        checkSession();

        // 3. Safety timeout: Ensure loading is never stuck
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 3000);

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            clearTimeout(timeout);
            if (session?.user) {
                if (session.user.email.endsWith('@eji.co.id')) {
                    setUser(session.user);
                    setError(null);
                } else {
                    await supabase.auth.signOut();
                    setUser(null);
                    setError('Unauthorized domain. Only @eji.co.id is allowed.');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                    hd: 'eji.co.id' // Suggest domain to Google (not a guarantee, still need manual check)
                },
                redirectTo: window.location.origin
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
