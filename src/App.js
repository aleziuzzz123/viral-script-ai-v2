import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

// --- Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [topic, setTopic] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) setShowAuthModal(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user) {
            const fetchProfile = async () => {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (error) console.error('Error fetching profile:', error);
                else setProfile(data);
            };
            fetchProfile();
        }
    }, [session]);

    const handleGenerate = useCallback(async () => {
        if (!session) {
            setShowAuthModal(true);
            return;
        }
        if (profile && profile.credits < 1) {
            setError("You're out of credits! Please purchase more to continue.");
            return;
        }
        if (!topic) {
            setError('Please enter a video topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedContent(null);
        try {
            if (profile) {
                const { error: updateError } = await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', session.user.id);
                if (updateError) throw updateError;
                setProfile(prev => ({ ...prev, credits: prev.credits - 1 }));
            }
            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!response.ok) {
                if (profile) {
                   await supabase.from('profiles').update({ credits: profile.credits }).eq('id', session.user.id);
                   setProfile(prev => ({ ...prev, credits: prev.credits + 1 }));
                }
                throw new Error('AI failed to generate content. Please try again.');
            }
            const data = await response.json();
            setGeneratedContent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [topic, session, profile]);

    return (
        <div className="app-container">
            {showAuthModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button onClick={() => setShowAuthModal(false)} className="close-button">&times;</button>
                        <h3 className="auth-title">Your Scripts Are Ready!</h3>
                        <p className="auth-subtitle">Create a free account to view them and get 5 bonus credits.</p>
                        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google']} theme="dark" />
                    </div>
                </div>
            )}
            <header className="app-header">
                <div className="header-content">
                    <h1>Viral Script AI</h1>
                    {session && profile && (
                         <div className="user-info">
                            <span>Credits: {profile.credits}</span>
                            <button onClick={async () => await supabase.auth.signOut()} className="logout-btn">Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <main>
                {session ? (
                    // --- NEW LOGGED-IN (DASHBOARD) VIEW ---
                    <div className="dashboard-grid">
                        <div className="dashboard-main">
                            <div className="dashboard-header">
                                <h2>Welcome Back!</h2>
                                <p>Let's create your next viral hit. Enter a topic below.</p>
                            </div>
                            <div className="generator-view">
                                <div className="input-container">
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to invest in stocks'" />
                                    <button onClick={handleGenerate} disabled={isLoading}>
                                        {isLoading ? 'Analyzing...' : 'Generate Scripts'}
                                    </button>
                                </div>
                                {error && <p className="error-text">{error}</p>}
                            </div>
                        </div>
                        <div className="dashboard-sidebar">
                            <div className="info-card">
                                <h4>Credit Balance</h4>
                                <p className="credit-balance">{profile ? profile.credits : '...'}</p>
                                <button className="buy-credits-btn">Buy More Credits</button>
                            </div>
                            <div className="info-card">
                                <h4>Usage</h4>
                                <p className="usage-stat">You've generated <strong>{5 - (profile ? profile.credits : 5)}</strong> scripts so far.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- LOGGED-OUT (LANDING PAGE) VIEW ---
                    <div className="hero-section">
                        <div className="hero-content">
                            <h1 className="hero-headline">Stop Guessing. Start Going Viral.</h1>
                            <p className="hero-subheadline">Generate proven, high-impact video hooks and scripts for your videos.</p>
                            <div className="input-container">
                                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to invest in stocks'" />
                                <button onClick={handleGenerate} disabled={isLoading}>
                                    {isLoading ? 'Analyzing...' : 'Generate Your First Script'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- Results are shown outside the main/sidebar grid for focus --- */}
                {generatedContent && (
                    <div className="results-display-container">
                        <div className="results-display">
                            {generatedContent.hooks.map((hook, index) => (
                                <div key={index} className="script-card">
                                    <h3>Hook #{index + 1}</h3>
                                    <p>{hook.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} Viral Script AI. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default App;
