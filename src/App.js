import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css'; // We will use one CSS file

// --- Reusable Components (from your original code) ---
const Header = React.memo(({ session }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    return (
        <header className="app-header">
            <div className="header-content">
                <h1>Viral Script AI</h1>
                {session ? (
                    <div className="user-info">
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </div>
                ) : (
                    <a href="#auth-form" className="login-btn">Login / Sign Up</a>
                )}
            </div>
        </header>
    );
});

// --- NEW Engaging Landing Page Component ---
const LandingPage = () => (
    <div className="hero-section">
        <div className="hero-content">
            <h1 className="hero-headline">Stop Guessing. Start Going Viral.</h1>
            <p className="hero-subheadline">
                Generate proven, high-impact video hooks and scripts in seconds.
                Transform your ideas into content that captivates and converts.
            </p>
            <a href="#auth-form" className="hero-cta">
                Generate Your First Script For Free
            </a>
        </div>
    </div>
);

// --- Your Existing App Components ---
const GeneratorInput = ({ handleGenerate, isLoading, error }) => { /* Your component code here */ };
const ResultsDisplay = ({ generatedContent }) => { /* Your component code here */ };
const Footer = React.memo(() => (
    <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Viral Script AI. All Rights Reserved.</p>
    </footer>
));

// --- Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [topic, setTopic] = useState(''); // Added topic state

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGenerate = useCallback(async () => {
        // We will add credit checks here later
        if (!topic) {
            setError('Please enter a video topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedContent(null);

        try {
            const response = await fetch('/.netlify/functions/generate', { // Adjusted to correct path
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            if (!response.ok) throw new Error('Failed to generate content');
            const data = await response.json();
            setGeneratedContent(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [topic]);

    return (
        <div className="app-container">
            <Header session={session} />
            <main>
                {session ? (
                    // --- LOGGED-IN VIEW ---
                    <div className="generator-view">
                        <div className="input-container">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., 'How to invest in stocks'"
                                disabled={isLoading}
                            />
                            <button onClick={handleGenerate} disabled={isLoading || !topic}>
                                {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        {isLoading && <div className="loader"></div>}
                        {generatedContent && (
                            <div className="results-display"> 
                                {generatedContent.hooks.map((hook, index) => (
                                    <div key={index} className="script-card">
                                        <h3>Hook #{index + 1}</h3>
                                        <p>{hook.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // --- LOGGED-OUT VIEW ---
                    <div>
                        <LandingPage />
                        <div id="auth-form" className="auth-container">
                            <div className="auth-box">
                                <h3 className="auth-title">Create Your Free Account</h3>
                                <Auth
                                    supabaseClient={supabase}
                                    appearance={{ theme: ThemeSupa }}
                                    providers={['google', 'github']}
                                    theme="dark"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;