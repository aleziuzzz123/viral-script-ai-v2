import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

// --- SVG Icons for the UI ---
const CreditIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2v-4zm0 6h2v2h-2v-2z" fill="#1DB954"/></svg>;
const HistoryIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="#A1A1AA"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="#A1A1AA"/></svg>;


// --- Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [topic, setTopic] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session) setShowAuthModal(false);
      });
      return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user) {
            const fetchProfile = async () => {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(data);
            };
            fetchProfile();
        }
    }, [session]);

    const handleGenerate = useCallback(async () => {
        if (!session) { setShowAuthModal(true); return; }
        if (profile?.credits < 1) { setError("You're out of credits!"); return; }
        if (!topic) { setError('Please enter a topic.'); return; }
        
        setIsLoading(true);
        setError('');
        setGeneratedContent(null);
        
        try {
            const { error: updateError } = await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', session.user.id);
            if (updateError) throw updateError;
            setProfile(prev => ({ ...prev, credits: prev.credits - 1 }));

            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!response.ok) throw new Error('AI failed to generate content.');
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
                    <div className="header-left">
                        <h1 className="logo">Viral Script AI</h1>
                        {session && (
                            <nav className="main-nav">
                                <a href="/" className="nav-link active">Dashboard</a>
                                <a href="/" className="nav-link">Buy Credits</a>
                                <a href="/" className="nav-link">History</a>
                            </nav>
                        )}
                    </div>
                    <div className="header-right">
                        {session && profile ? (
                            <div className="user-menu-container">
                                <button onClick={() => setShowUserMenu(!showUserMenu)} className="user-menu-button">
                                    {session.user.email ? session.user.email.charAt(0).toUpperCase() : 'A'}
                                </button>
                                {showUserMenu && (
                                    <div className="user-dropdown">
                                        <div className="dropdown-info">
                                            Signed in as<br/><strong>{session.user.email}</strong>
                                        </div>
                                        <a href="/" className="dropdown-link">Account Settings</a>
                                        <button onClick={async () => await supabase.auth.signOut()} className="dropdown-link logout">
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="login-btn">Login / Sign Up</button>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {session ? (
                    <div className="dashboard-grid">
                        <div className="dashboard-main">
                            <div className="dashboard-header">
                                <h2>Dashboard</h2>
                                <p>Welcome back! Let's create your next viral hit.</p>
                            </div>
                            <div className="generator-view">
                                <div className="input-container">
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to invest in stocks'" />
                                    <button onClick={handleGenerate} disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Generate Scripts'}</button>
                                </div>
                                {error && <p className="error-text">{error}</p>}
                            </div>
                        </div>
                        <div className="dashboard-sidebar">
                            <div className="info-card">
                                <div className="card-header">
                                    <CreditIcon />
                                    <h4>Credit Balance</h4>
                                </div>
                                <p className="credit-balance">{profile ? profile.credits : '0'}</p>
                                <button className="buy-credits-btn">Buy More Credits</button>
                            </div>
                            <div className="info-card">
                                <div className="card-header">
                                    <HistoryIcon />
                                    <h4>Recent Activity</h4>
                                </div>
                                <ul className="history-list">
                                    <li>Generated scripts for "Keto Diet"</li>
                                    <li>Generated scripts for "Side Hustles"</li>
                                    <li>Generated scripts for "React Hooks"</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hero-section">
                        <div className="hero-content">
                            <h1 className="hero-headline">Stop Guessing. Start Going Viral.</h1>
                            <p className="hero-subheadline">Generate proven, high-impact video hooks and scripts for your videos.</p>
                            <div className="input-container">
                                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to invest in stocks'" />
                                <button onClick={handleGenerate} disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Generate Your First Script'}</button>
                            </div>
                        </div>
                    </div>
                )}
                
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
