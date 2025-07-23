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
const ResultsDisplay = ({ content }) => {
    const [activeTab, setActiveTab] = useState('hooks');

    const getCategoryClass = (category) => {
        switch (category) {
            case 'Curiosity Gap': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'Controversy': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'Urgency (FOMO)': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'Direct Value': return 'bg-green-500/10 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="mt-8 bg-brand-container border border-brand-border rounded-2xl">
            <div className="border-b border-brand-border flex">
                <button onClick={() => setActiveTab('hooks')} className={`px-4 py-3 font-semibold ${activeTab === 'hooks' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Hooks & Scores</button>
                <button onClick={() => setActiveTab('script')} className={`px-4 py-3 font-semibold ${activeTab === 'script' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Full Script</button>
                <button onClick={() => setActiveTab('plan')} className={`px-4 py-3 font-semibold ${activeTab === 'plan' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Production Plan</button>
            </div>
            <div className="p-6">
                {activeTab === 'hooks' && (
                    <div className="space-y-4">
                        {content.hooks.map((hook, index) => (
                            <div key={index} className="bg-brand-background border border-brand-border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryClass(hook.category)}`}>{hook.category}</span>
                                    <div className="text-center flex-shrink-0 ml-4">
                                        <p className="font-bold text-2xl text-brand-accent">{hook.score}</p>
                                        <p className="text-xs text-brand-text-secondary">Viral Score</p>
                                    </div>
                                </div>
                                <p className="text-brand-text-primary pr-4">{hook.text}</p>
                                <p className="text-sm text-brand-text-secondary mt-2 italic opacity-75">"{hook.analysis}"</p>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'script' && (
                    <div className="bg-brand-background border border-brand-border rounded-lg p-6 whitespace-pre-line text-brand-text-secondary leading-relaxed">
                        {content.script}
                    </div>
                )}
                {activeTab === 'plan' && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <VisualsIcon />
                            <div>
                                <h4 className="font-semibold text-brand-text-primary mb-2">Visual Ideas</h4>
                                <ul className="list-disc list-inside space-y-1 text-brand-text-secondary">
                                    {content.production_plan.visuals.map((v, i) => <li key={i}>{v}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <AudioIcon />
                            <div>
                                <h4 className="font-semibold text-brand-text-primary mb-2">Audio Suggestion</h4>
                                <p className="text-brand-text-secondary">{content.production_plan.audio}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <HashtagIcon />
                            <div>
                                <h4 className="font-semibold text-brand-text-primary mb-2">Hashtag Strategy</h4>
                                <div className="flex flex-wrap gap-2">
                                    {content.production_plan.hashtags.map((h, i) => <span key={i} className="bg-brand-background border border-brand-border text-brand-text-secondary text-sm font-medium px-3 py-1 rounded-full">{h}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Dashboard Component ---
const Dashboard = ({ session, profile, setProfile }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('Go Viral / Maximize Reach');
    const [tone, setTone] = useState('Engaging');
    const [audience, setAudience] = useState('');

    const handleGenerate = useCallback(async () => {
        if (!profile || profile.credits < 1) { setError("You're out of credits!"); return; }
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
                body: JSON.stringify({ topic, goal, tone, audience }),
            });
           
           
