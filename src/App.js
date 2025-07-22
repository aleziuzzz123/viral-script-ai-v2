import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

// --- SVG Icons for the UI ---
const CreditIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2v-4zm0 6h2v2h-2v-2z" fill="currentColor"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="currentColor"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="currentColor"/></svg>;

// --- NEW: A dedicated component for the logged-in dashboard ---
const Dashboard = ({ session, profile, setProfile }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [topic, setTopic] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!profile || profile.credits < 1) { setError("You're out of credits!"); return; }
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
    }, [topic, profile, session, setProfile]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                        <p className="text-gray-400 mt-2 mb-6">Let's create your next viral hit. Enter a topic below.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to start a podcast'" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            <button onClick={handleGenerate} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 whitespace-nowrap">
                                {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    </div>
                    {generatedContent && (
                        <div>
                            {generatedContent.hooks.map((hook, index) => (
                                <div key={index} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-4">
                                    <h3 className="font-bold text-green-400 mb-2">Hook #{index + 1}</h3>
                                    <p className="text-gray-300">{hook.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditIcon />
                            <h3 className="text-lg font-semibold text-white">Credit Balance</h3>
                        </div>
                        <p className="text-5xl font-bold text-green-400">{profile ? profile.credits : '0'}</p>
                        <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg">Buy More Credits</button>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <HistoryIcon />
                            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        </div>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="truncate">Generated scripts for "Keto Diet"</li>
                            <li className="truncate">Generated scripts for "Side Hustles"</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- The Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        setProfileLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) setProfileLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setShowAuthModal(false);
            } else {
                setProfileLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user) {
            setProfileLoading(true);
            const fetchProfile = async () => {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(data);
                setProfileLoading(false);
            };
            fetchProfile();
        }
    }, [session]);

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full relative">
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">Your Scripts Are Ready!</h3>
                        <p className="text-gray-400 text-center mb-6">Create a free account to view them.</p>
                        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google']} theme="dark" />
                    </div>
                </div>
            )}

            <header className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Viral Script AI</h1>
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">Credits: <span className="font-bold text-white">{profileLoading ? '...' : (profile ? profile.credits : 0)}</span></span>
                            <button onClick={async () => await supabase.auth.signOut()} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Logout</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuthModal(true)} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg">Login / Sign Up</button>
                    )}
                </div>
            </header>

            <main>
                {session ? (
                    <Dashboard session={session} profile={profile} setProfile={setProfile} />
                ) : (
                    <div className="text-center py-20 px-4">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white">Stop Guessing. Start Going Viral.</h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto mt-6 mb-10">Generate proven, high-impact video hooks and scripts in seconds. Transform your ideas into content that captivates and converts.</p>
                        <div className="max-w-2xl mx-auto">
                           <button onClick={() => setShowAuthModal(true)} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-lg text-lg">Generate Your First Script Free</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
