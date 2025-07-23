import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

// --- SVG Icons ---
const CreditIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2v-4zm0 6h2v2h-2v-2z" fill="currentColor"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="currentColor"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="currentColor"/></svg>;
const VisualsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>;
const AudioIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg>;
const HashtagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-2 .9-2 2v5.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l5.17-5.17c.78-.78.78-2.05 0-2.83l-8.83-8.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" fill="currentColor"/></svg>;

// --- Results Component ---
const ResultsDisplay = ({ content }) => { /* ... (Same as before, no changes needed) */ };

// --- Dashboard Component ---
const Dashboard = ({ session, profile, setProfile, setShowBuyCreditsModal }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('Go Viral / Maximize Reach');
    const [tone, setTone] = useState('Engaging');
    const [audience, setAudience] = useState('');
    
    // --- NEW: State for Dynamic History ---
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // --- NEW: Effect to Fetch History ---
    useEffect(() => {
        const fetchHistory = async () => {
            if (!session?.user) return;
            setHistoryLoading(true);
            const { data, error } = await supabase
                .from('generations')
                .select('id, created_at, topic')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) console.error("Error fetching history:", error);
            else setHistory(data);
            setHistoryLoading(false);
        };
        fetchHistory();
    }, [session, generatedContent]); // Refetch history when new content is generated

    const handleGenerate = useCallback(async () => {
        if (!profile || profile.credits < 1) { setShowBuyCreditsModal(true); return; }
        if (!topic) { setError('Please enter a topic.'); return; }
        if (wizardStep === 1) { setWizardStep(2); return; }

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
                body: JSON.stringify({ topic, goal, tone, audience, userId: session.user.id }), // Pass userId
            });
            if (!response.ok) throw new Error('AI failed to generate content.');
            const data = await response.json();
            setGeneratedContent(data);
            setWizardStep(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [topic, goal, tone, audience, profile, session, setProfile, wizardStep, setShowBuyCreditsModal]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Wizard remains the same */}
                    {generatedContent && <ResultsDisplay content={generatedContent} />}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    {/* Credit Balance Card remains the same */}
                    
                    {/* --- NEW: Dynamic History Card --- */}
                    <div className="bg-brand-container border border-brand-border rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <HistoryIcon />
                            <h3 className="text-lg font-semibold text-brand-text-primary">Recent Activity</h3>
                        </div>
                        {historyLoading ? (
                            <p className="text-sm text-brand-text-secondary">Loading history...</p>
                        ) : (
                            <ul className="space-y-3 text-sm text-brand-text-secondary">
                                {history.length > 0 ? (
                                    history.map(item => (
                                        <li key={item.id} className="truncate">Generated scripts for "{item.topic}"</li>
                                    ))
                                ) : (
                                    <p>No activity yet. Generate a blueprint to start!</p>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Buy Credits Modal (with REAL Price IDs) ---
const BuyCreditsModal = ({ setShowBuyCreditsModal, session }) => {
    const [loading, setLoading] = useState(false);

    const creditPacks = [
        { name: 'Trial Pack', credits: 10, price: '$7', priceId: 'price_1RnqtMKucnJQ8ZaNjFzxoW85' },
        { name: 'Creator Pack', credits: 50, price: '$27', priceId: 'price_1RnqtrKucnJQ8ZaNI5apjA4u' },
        { name: 'Pro Pack', credits: '100 + 10 Bonus', price: '$47', priceId: 'price_1RnquFKucnJQ8ZaNR9Z6skUk', popular: true },
        { name: 'Agency Pack', credits: '250 + 50 Bonus', price: '$97', priceId: 'price_1RnqucKucnJQ8ZaNt9SNptof' },
    ];

    const handlePurchase = async (priceId) => { /* ... (Same as before, no changes needed) */ };

    return ( /* ... (Same JSX as before, no changes needed) */ );
};


// --- Main App Component ---
const App = () => {
    // ... (State and useEffects remain the same, no changes needed)
    return ( /* ... (Same JSX as before, no changes needed) */ );
};

export default App;
