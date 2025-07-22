import React, { useState, useCallback } from 'react';

// --- Reusable, Optimized Components ---

// Memoized Header to prevent re-renders
const Header = React.memo(({ stripeLink }) => (
    <header className="bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Viral Script AI
            </h1>
            <a 
                href={stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
            >
                Buy Credits
            </a>
        </div>
    </header>
));

// Memoized Hero section
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

// Input component that receives state and handlers as props
const GeneratorInput = ({ topic, setTopic, handleGenerate, isLoading, error }) => (
    <div className="max-w-2xl mx-auto px-4">
        <div className="relative">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'How to invest in stocks'"
                className="w-full p-4 pr-32 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition duration-200"
                disabled={isLoading}
            />
            <button
                onClick={() => handleGenerate(topic)}
                disabled={isLoading || !topic}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
                {isLoading ? 'Generating...' : 'Generate'}
            </button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
    </div>
);

// Results component with its own internal state for the active tab
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

// Memoized Footer
const Footer = React.memo(() => (
    <footer className="text-center py-8 mt-20 text-gray-500">
        <p>&copy; {new Date().getFullYear()} Viral Script AI. All Rights Reserved.</p>
    </footer>
));


// --- Main App Component ---
// This now only manages state and composes the other components.
const App = () => {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);

    // IMPORTANT: Replace with your actual Stripe Checkout Link
    const STRIPE_CHECKOUT_LINK = "YOUR_STRIPE_CHECKOUT_LINK";

    const handleGenerate = useCallback(async (currentTopic) => {
        if (!currentTopic) {
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
                body: JSON.stringify({ topic: currentTopic }),
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
    }, []); // Empty dependency array means this function is created only once.

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <Header stripeLink={STRIPE_CHECKOUT_LINK} />
            <main>
                <Hero />
                <GeneratorInput 
                    topic={topic}
                    setTopic={setTopic}
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
            </main>
            <Footer />
        </div>
    );
};

export default App;
