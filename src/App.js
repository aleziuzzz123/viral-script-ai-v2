import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient'; // Import our new supabase client
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

// --- Reusable, Optimized Components ---

// Updated Header to show user info and a Logout button
const Header = React.memo(({ session }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <header className="bg-gray-900 text-white shadow-lg">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    Viral Script AI
                </h1>
                {session ? (
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300 text-sm hidden sm:block">{session.user.email}</span>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <a 
                        href="#auth-form" // Link to the login form
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Login / Sign Up
                    </a>
                )}
            </div>
        </header>
    );
});

// Memoized Hero section (No changes needed)
const Hero = React.memo(() => (
    <div className="text-center py-12 md:py-20 px-4">
        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
            Stop Writing Boring Videos.
        </h2>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Enter your topic below and let our AI generate 10 viral hooks and a complete video script in seconds.
        </p>
    </div>
));

// GeneratorInput component (No changes needed for now)
const GeneratorInput = ({ handleGenerate, isLoading, error }) => {
    const [localTopic, setLocalTopic] = useState('');

    const onGenerateClick = () => {
        handleGenerate(localTopic);
    };

    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="relative">
                <input
                    type="text"
                    value={localTopic}
                    onChange={(e) => setLocalTopic(e.target.value)}
                    placeholder="e.g., 'How to invest in stocks'"
                    className="w-full p-4 pr-32 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition duration-200"
                    disabled={isLoading}
                />
                <button
                    onClick={onGenerateClick}
                    disabled={isLoading || !localTopic}
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );
};

// ResultsDisplay component (No changes needed)
const ResultsDisplay = ({ generatedContent }) => {
    const [activeTab, setActiveTab] = useState('hooks');

    if (!generatedContent) return null;

    return (
        <div className="max-w-4xl mx-auto mt-12 px-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('hooks')}
                        className={`flex-1 py-3 font-bold transition ${activeTab === 'hooks' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Viral Hooks (10)
                    </button>
                    <button 
                        onClick={() => setActiveTab('script')}
                        className={`flex-1 py-3 font-bold transition ${activeTab === 'script' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        Full Script
                    </button>
                </div>
                <div className="p-6">
                    {activeTab === 'hooks' && (
                        <ul className="space-y-4">
                            {generatedContent.hooks.map((hook, index) => (
                                <li key={index} className="bg-gray-900 p-4 rounded-lg flex items-start space-x-4">
                                    <span className="text-purple-400 font-bold text-lg">{index + 1}.</span>
                                    <p className="text-gray-200">{hook}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    {activeTab === 'script' && (
                        <div className="whitespace-pre-wrap text-gray-200 bg-gray-900 p-4 rounded-lg leading-relaxed">
                            {generatedContent.script.split('\\n').map((line, index) => (
                                <p key={index} className={line.startsWith('**') ? 'font-bold text-purple-400 mt-2' : ''}>
                                    {line.replace(/\*\*/g, '')}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Memoized Footer (No changes needed)
const Footer = React.memo(() => (
    <footer className="text-center py-8 mt-20 text-gray-500">
        <p>&copy; {new Date().getFullYear()} Viral Script AI. All Rights Reserved.</p>
    </footer>
));


// --- Main App Component ---
// This now manages the user session and orchestrates the UI.
const App = () => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);

    // Check for a user session when the app loads
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGenerate = useCallback(async (topic) => {
        // We will add the credit check logic here in the next step
        if (!topic) {
            setError('Please enter a video topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedContent(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'An unknown error occurred.');
            }

            const data = await response.json();
            setGeneratedContent(data);

        } catch (err) {
            console.error(err);
            setError(`Failed to generate content: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <Header session={session} />
            <main>
                {!session ? (
                    // If user is NOT logged in, show the Auth form
                    <div id="auth-form" className="max-w-md mx-auto mt-12 p-8 bg-gray-800 rounded-xl">
                         <h3 className="text-2xl font-bold text-center text-white mb-6">Join Viral Script AI</h3>
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ theme: ThemeSupa }}
                            providers={['google', 'github']}
                            theme="dark"
                        />
                    </div>
                ) : (
                    // If user IS logged in, show the main application
                    <>
                        <Hero />
                        <GeneratorInput 
                            handleGenerate={handleGenerate}
                            isLoading={isLoading}
                            error={error}
                        />
                        {isLoading && (
                            <div className="text-center mt-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                                <p className="mt-2 text-gray-400">The AI is thinking... this can take a moment.</p>
                            </div>
                        )}
                        <ResultsDisplay generatedContent={generatedContent} />
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default App;
