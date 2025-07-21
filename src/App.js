import React, { useState } from 'react';

// Main App Component
const App = () => {
    // --- STATE MANAGEMENT ---
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [activeTab, setActiveTab] = useState('hooks'); // 'hooks' or 'script'

    // --- API & CONFIGURATION ---
    // IMPORTANT: Replace with your actual Gemini API Key
    const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // IMPORTANT: Replace with your actual Stripe Checkout Link
    // You will create this product link in your Stripe Dashboard
    const STRIPE_CHECKOUT_LINK = "YOUR_STRIPE_CHECKOUT_LINK";

    // --- HANDLERS ---
    const handleGenerate = async () => {
        if (!topic) {
            setError('Please enter a video topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedContent(null);

        const prompt = `
            You are an expert viral video scriptwriter for short-form platforms like TikTok, YouTube Shorts, and Instagram Reels.
            Your goal is to create content that is highly engaging and has a high potential for virality.
            The user's video topic is: "${topic}".

            Generate the following content based on the user's topic. Your entire response must be in a single, valid JSON object.

            The JSON object must have two keys:
            1. "hooks": An array of exactly 10 unique, compelling video hooks. Each hook should be a string and no more than 15 words. They should be attention-grabbing and create curiosity.
            2. "script": A detailed 30-second video script based on the most powerful hook. The script should be a single string and include three parts:
                - The Hook: Start with the chosen hook.
                - The Body: Provide 3-4 talking points or visual scenes.
                - The Call to Action (CTA): End with a strong call to action.

            Example format for the script string:
            "**Hook:** [Your chosen hook]\\n\\n**Scene 1:** [Description of the first visual or talking point]\\n\\n**Scene 2:** [Description of the second visual or talking point]\\n\\n**Scene 3:** [Description of the third visual or talking point]\\n\\n**CTA:** [Your call to action]"
        `;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const rawText = data.candidates[0].content.parts[0].text;
                // Clean the response to ensure it's valid JSON
                const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedJson = JSON.parse(cleanedText);
                setGeneratedContent(parsedJson);
            } else {
                throw new Error("No content generated. Please try again.");
            }

        } catch (err) {
            console.error(err);
            setError("Failed to generate content. Please check your API key and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDER COMPONENTS ---
    const Header = () => (
        <header className="bg-gray-900 text-white shadow-lg">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                    Viral Script AI
                </h1>
                <a 
                    href={STRIPE_CHECKOUT_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                >
                    Buy Credits
                </a>
            </div>
        </header>
    );

    const Hero = () => (
        <div className="text-center py-12 md:py-20 px-4">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
                Stop Writing Boring Videos.
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                Enter your topic below and let our AI generate 10 viral hooks and a complete video script in seconds.
            </p>
        </div>
    );

    const GeneratorInput = () => (
        <div className="max-w-2xl mx-auto px-4">
            <div className="relative">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., 'How to invest in stocks'"
                    className="w-full p-4 pr-32 rounded-lg bg-gray-800 text-white border-2 border-gray-700 focus:border-purple-500 focus:ring-purple-500 focus:outline-none transition"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );

    const ResultsDisplay = () => {
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
    
    const Footer = () => (
        <footer className="text-center py-8 mt-20 text-gray-500">
            <p>&copy; {new Date().getFullYear()} Viral Script AI. All Rights Reserved.</p>
        </footer>
    );

    // --- MAIN RENDER ---
    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <Header />
            <main>
                <Hero />
                <GeneratorInput />
                {isLoading && (
                    <div className="text-center mt-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        <p className="mt-2 text-gray-400">The AI is thinking... this can take a moment.</p>
                    </div>
                )}
                <ResultsDisplay />
            </main>
            <Footer />
        </div>
    );
};

export default App;

