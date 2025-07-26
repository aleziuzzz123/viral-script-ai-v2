import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import AbstractCanvas from './AbstractCanvas';
import ViralVideoAnalyzer from './components/ViralVideoAnalyzer';

// --- Toast Notification System ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const addToast = (message, type = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };
    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[100] space-y-2">
                {toasts.map(toast => (
                    <div key={toast.id} className={`px-4 py-2 rounded-md text-white shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
const useToast = () => useContext(ToastContext);

// --- SVG Icons ---
const CreditIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8.5h20M7 15.5h3M12 15.5h2M2 12.031V17c0 2 1 3 3 3h14c2 0 3-1 3-3V8c0-2-1-3-3-3H5c-2 0-3 1-3 3" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const VisualsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>;
const AudioIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg>;
const HashtagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-2 .9-2 2v5.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l5.17-5.17c.78-.78.78-2.05 0-2.83l-8.83-8.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" fill="currentColor"/></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const VoiceIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" fill="currentColor"></path></svg>;
const LightbulbIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22h6M12 18v4M9.31 15.69c.39.39 1.02.39 1.41 0l1.48-1.48c.31-.31.47-.72.47-1.13V12c0-.41-.16-.82-.47-1.13L10.72 9.39c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.5 12l-1.19 1.19c-.38.39-.38 1.03 0 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TikTokIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.38 1.92-3.54 2.96-5.94 2.96-1.97 0-3.82-.65-5.31-1.76-1.23-.9-2.15-2.1-2.7-3.45-.42-1.04-.6-2.18-.6-3.33-.03-1.92.31-3.85.96-5.66.63-1.78 1.6-3.4 2.8-4.74 1.05-1.17 2.31-2.08 3.7-2.66.49-.2.98-.36 1.49-.46.01.82.02 1.64.01 2.46l-.04.64c-.45.12-.88.29-1.3.49-1.94.94-3.36 2.73-3.76 4.75-.18.9-.28 1.84-.28 2.78 0 1.01.17 1.99.52 2.89.59 1.5 1.73 2.5 3.19 2.89.43.11.88.17 1.32.17 1.1 0 2.15-.3 3.09-.89.88-.55 1.5-1.36 1.82-2.34.24-.78.35-1.6.35-2.43.01-2.18.01-4.36.01-6.54 0-.21.05-.42.15-.61.2-.4.5-.68.88-.88.25-.13.5-.25.75-.35.01-.81.01-1.63.02-2.44a4.32 4.32 0 0 1-.25.03c-.8.1-1.55.39-2.2.83-1.09.73-1.85 1.8-2.2 3.02-.13.43-.21.88-.22 1.33-.02 1.47-.01 2.95-.01 4.42 0 .1-.01.2-.02.31.02-1.1.02-2.21.02-3.31z"/></svg>;
const YouTubeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 7.337c-.227-.81-.887-1.469-1.697-1.697C18.267 5.207 12 5.207 12 5.207s-6.267 0-7.885.433c-.81.228-1.47.887-1.697 1.697C2.002 8.954 2 12 2 12s.002 3.046.42 4.663c.227.81.887 1.469 1.697 1.697C5.733 18.793 12 18.793 12 18.793s6.267 0 7.885-.433c.81-.228 1.47-.887 1.697-1.697C21.998 15.046 22 12 22 12s-.002-3.046-.418-4.663zM9.75 14.86V9.14L15.22 12 9.75 14.86z"/></svg>;
const InstagramIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/></svg>;

// --- PAGE COMPONENTS ---
const PrivacyPolicyPage = ({ navigate }) => (
    <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <button onClick={() => navigate('home')} className="text-brand-accent mb-8">&larr; Back to Home</button>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-invert text-white/80 space-y-4">
            <p><strong>Last Updated:</strong> July 25, 2025</p>
            <p>Welcome to Viral Script AI ("we," "our," or "us"). We are committed to protecting your privacy...</p>
        </div>
    </div>
);

const TermsOfServicePage = ({ navigate }) => (
    <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <button onClick={() => navigate('home')} className="text-brand-accent mb-8">&larr; Back to Home</button>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-invert text-white/80 space-y-4">
            <p><strong>Last Updated:</strong> July 25, 2025</p>
            <p>Please read these Terms of Service ("Terms") carefully before using the Viral Script AI website...</p>
        </div>
    </div>
);


// --- HOMEPAGE COMPONENT ---
const HomePage = ({ setShowAuthModal }) => {
    return ( 
        <div className="w-full overflow-hidden relative">
            <AbstractCanvas />
            <div className="relative z-10">
                <section className="relative text-center py-20 md:py-24 px-4 flex flex-col items-center">
                    <div className="bg-red-500 text-white font-semibold px-6 py-2 rounded-lg mb-8 shadow-lg">
                        <span>Stop Guessing, Stop Wasting Time, &amp; Start Creating Scripts That Actually Work...</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight max-w-4xl">
                        Revolutionary AI Tech Turns Any
                        <span className="text-pink-500 px-2">Video Idea</span>
                        Into Scroll-Stopping,
                        <span className="bg-purple-500 px-2 rounded-md">AI-Scored Hooks</span>
                        & Full Scripts
                        <span className="text-yellow-400 px-2">All In Under 2 Minutes</span>
                    </h1>
                </section>
            </div>
        </div>
    );
};


// --- MODAL & SKELETON COMPONENTS ---
const SkeletonLoader = () => (<div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 animate-pulse"><div className="h-8 bg-gray-700/50 rounded w-1/3"></div><div className="space-y-4"><div className="h-24 bg-gray-700/50 rounded"></div><div className="h-24 bg-gray-700/50 rounded"></div></div></div>);

const BlueprintDetailModal = ({ content, closeModal, session, voiceProfile, onPerformanceSaved }) => { 
    if (!content) return null; 
    return ( 
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 border-white/20 rounded-2xl p-8 max-w-3xl w-full relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-2xl font-bold text-center text-white mb-4">Blueprint Details</h3>
                <div className="max-h-[70vh] overflow-y-auto">
                    <ResultsDisplay content={content} session={session} voiceProfile={voiceProfile} onPerformanceSaved={onPerformanceSaved} />
                </div>
            </div>
        </div>
    );
};

const PerformanceModal = ({ contentId, initialData, setShow, onSaved }) => {
    const [videoUrl, setVideoUrl] = useState(initialData.video_url || '');
    const [views, setViews] = useState(initialData.views || '');
    const [likes, setLikes] = useState(initialData.likes || '');
    const [comments, setComments] = useState(initialData.comments || '');
    const [shares, setShares] = useState(initialData.shares || '');
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('generated_content')
            .update({
                video_url: videoUrl,
                views: parseInt(views) || 0,
                likes: parseInt(likes) || 0,
                comments: parseInt(comments) || 0,
                shares: parseInt(shares) || 0,
                is_posted: true,
            })
            .eq('id', contentId);

        if (error) {
            addToast('Error saving performance: ' + error.message, 'error');
        } else {
            addToast('Performance data saved!', 'success');
            onSaved();
            setShow(false);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-lg w-full relative">
                <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-2xl font-bold text-center text-white mb-2">Track Video Performance</h3>
                <p className="text-white/70 text-center mb-6">Enter the URL and stats for your video after 24 hours.</p>
                <div className="space-y-4">
                    <input type="url" placeholder="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Views" value={views} onChange={e => setViews(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <input type="number" placeholder="Likes" value={likes} onChange={e => setLikes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <input type="number" placeholder="Comments" value={comments} onChange={e => setComments(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <input type="number" placeholder="Shares" value={shares} onChange={e => setShares(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-50">
                        {saving ? <LoadingSpinner /> : 'Save Performance'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- RESULTS DISPLAY COMPONENT ---
const ResultsDisplay = ({ content, session, voiceProfile, onPerformanceSaved }) => {
    const [activeTab, setActiveTab] = useState('hooks');
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const { addToast } = useToast();
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioSrc, setAudioSrc] = useState(null);

    const handleGenerateAudio = async () => {
        if (!voiceProfile?.voice_id) {
            addToast("Please set up your voice profile first in Account settings.", 'error');
            return;
        }
        setAudioLoading(true);
        setAudioSrc(null);
        try {
            const cleanText = content.blueprint.script.replace(/\s?\(.*\)\s?/g, ' ');
            const response = await fetch('/.netlify/functions/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, voiceId: voiceProfile.voice_id }),
            });
            if (!response.ok) throw new Error("Failed to generate audio.");
            const { audioData } = await response.json();
            const audioUrl = `data:audio/mpeg;base64,${audioData}`;
            setAudioSrc(audioUrl);
        } catch (error) {
            addToast("Sorry, we couldn't generate the audio preview.", 'error');
        } finally {
            setAudioLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        addToast('Copied to clipboard!', 'success');
    };

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
        <>
            {showPerformanceModal && <PerformanceModal contentId={content.id} initialData={content} setShow={setShowPerformanceModal} onSaved={onPerformanceSaved} />}
            
            <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <div className="flex space-x-2">
                        <button onClick={() => setActiveTab('hooks')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'hooks' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Hooks & Scores</button>
                        <button onClick={() => setActiveTab('script')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'script' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Full Script</button>
                        <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'plan' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Production Plan</button>
                    </div>
                    <button onClick={() => setShowPerformanceModal(true)} className="bg-green-500/20 hover:bg-green-500/30 text-green-300 font-bold py-2 px-4 rounded-lg text-sm">Track Performance</button>
                </div>
                <div className="p-6">
                    {activeTab === 'hooks' && (
                        <div className="space-y-4">
                            {content.blueprint.hooks.map((hook, index) => (
                                <div key={index} className="bg-black/20 border border-white/10 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryClass(hook.category)}`}>{hook.category}</span>
                                        <div className="text-center flex-shrink-0 ml-4">
                                            <p className="font-bold text-2xl text-brand-accent">{hook.score}</p>
                                            <p className="text-xs text-white/60">Viral Score</p>
                                        </div>
                                    </div>
                                    <p className="text-white pr-4">{hook.text}</p>
                                    <p className="text-sm text-white/60 mt-2 opacity-75 italic">"{hook.analysis}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'script' && (
                        <div>
                            <div className="bg-black/20 border border-white/10 rounded-lg p-6 whitespace-pre-line text-white/80 leading-relaxed">
                                {content.blueprint.script}
                            </div>
                             <button onClick={handleGenerateAudio} disabled={audioLoading} className="mt-4 w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                                {audioLoading ? <LoadingSpinner/> : <VoiceIcon />}
                                {audioLoading ? 'Generating Audio...' : 'Generate Voice Preview'}
                            </button>
                            {audioSrc && <audio controls src={audioSrc} className="w-full mt-4"></audio>}
                        </div>
                    )}
                    {activeTab === 'plan' && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <VisualsIcon />
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Visual Ideas</h4>
                                    <ul className="list-disc list-inside space-y-1 text-white/80">
                                        {content.blueprint.production_plan.visuals.map((v, i) => <li key={i}>{v}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <AudioIcon />
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Audio Suggestion</h4>
                                    <p className="text-white/80">{content.blueprint.production_plan.audio}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <HashtagIcon />
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Hashtag Strategy</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {content.blueprint.production_plan.hashtags.map((h, i) => <span key={i} onClick={() => copyToClipboard(h)} className="cursor-pointer bg-black/20 border border-white/10 text-white/70 text-sm font-medium px-3 py-1 rounded-full hover:bg-white/20">{h}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// --- CALENDAR VIEW COMPONENT ---
const CalendarView = ({ session, voiceProfile }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [date, setDate] = useState(new Date());

    const fetchEvents = useCallback(async () => {
        if (!session?.user) return;
        const { data, error } = await supabase.from('generated_content').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (error) { console.error("Error fetching content for calendar:", error); } 
        else { setEvents(data); }
    }, [session]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);
    
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayEvents = events.filter(event => new Date(event.created_at).toDateString() === date.toDateString());
            if (dayEvents.length > 0) {
                return <div className="flex justify-center items-center absolute bottom-1 w-full">{dayEvents.map(e => <div key={e.id} className="w-1 h-1 bg-purple-400 rounded-full mx-px"></div>)}</div>;
            }
        }
        return null;
    };

    return (
        <>
            {selectedEvent && <BlueprintDetailModal content={selectedEvent} closeModal={() => setSelectedEvent(null)} session={session} voiceProfile={voiceProfile} onPerformanceSaved={fetchEvents} />}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-white mb-6">Content Calendar & Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
                         <Calendar
                            onChange={setDate}
                            value={date}
                            tileContent={tileContent}
                            className="text-white"
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">History for {date.toLocaleDateString()}</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {events.filter(e => new Date(e.created_at).toDateString() === date.toDateString()).map(event => (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-black/20 p-4 rounded-lg cursor-pointer border border-transparent hover:border-purple-500">
                                <p className="font-bold text-white">{event.topic}</p>
                                <p className="text-sm text-white/60">{new Date(event.created_at).toLocaleTimeString()}</p>
                                {event.is_posted && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full mt-2 inline-block">Posted</span>}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


// --- ACCOUNT VIEW COMPONENT ---
const AccountView = ({ session, voiceProfile, setVoiceProfile }) => {
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [file, setFile] = useState(null);
    const [uploadMode, setUploadMode] = useState('record');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const { addToast } = useToast();

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm; codecs=opus' };
            mediaRecorderRef.current = MediaRecorder.isTypeSupported(options.mimeType) ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: options.mimeType });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                setFile(null);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            addToast("Could not access microphone. Please check your browser permissions.", 'error');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setAudioBlob(null);
            setAudioUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleCreateVoice = async () => {
        const audioData = audioBlob || file;
        const audioName = audioBlob ? 'voice_sample.webm' : file.name;
        if (!audioData) {
            addToast("Please record or upload an audio sample first.", 'error');
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('files', audioData, audioName);
            formData.append('name', `User_${session.user.id}`);
            const response = await fetch('/.netlify/functions/create-voice', { method: 'POST', body: formData });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Failed to create voice profile.");
            }
            const { voice_id } = await response.json();
            const { error: dbError } = await supabase.from('voice_profiles').upsert({ id: session.user.id, voice_id: voice_id });
            if (dbError) throw dbError;
            setVoiceProfile({ voice_id });
            addToast("Your voice profile has been created successfully!", 'success');
        } catch (error) {
            addToast(`Failed to create voice profile: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteVoice = async () => {
        if (!window.confirm("Are you sure you want to delete your voice profile? This action cannot be undone.")) {
            return;
        }
        setUploading(true);
        try {
            const response = await fetch('/.netlify/functions/delete-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voiceId: voiceProfile.voice_id }),
            });
            if (!response.ok) {
                 throw new Error("Failed to delete voice from service.");
            }

            const { error: dbError } = await supabase.from('voice_profiles').delete().eq('id', session.user.id);
            if (dbError) throw dbError;

            setVoiceProfile(null);
            addToast("Your voice profile has been deleted.", 'success');
        } catch (error) {
            addToast(`Failed to delete voice profile: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-white mb-6">Account Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Your AI Voice Clone</h3>
                    {voiceProfile?.voice_id ? (
                        <div>
                            <p className="text-white/80 mb-4">Your voice profile is active. You can now generate audio previews for your scripts.</p>
                            <button onClick={handleDeleteVoice} disabled={uploading} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-2 px-4 rounded-lg w-full">
                                {uploading ? 'Deleting...' : 'Delete Voice Profile'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-white/80 mb-4">Create a voice clone by recording or uploading a 30-second audio sample. This allows the AI to generate script previews in your voice.</p>
                            <div className="flex items-center justify-center space-x-4 mb-4">
                                <button onClick={() => setUploadMode('record')} className={`px-4 py-2 rounded-lg font-semibold ${uploadMode === 'record' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70'}`}>Record</button>
                                <button onClick={() => setUploadMode('upload')} className={`px-4 py-2 rounded-lg font-semibold ${uploadMode === 'upload' ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/70'}`}>Upload</button>
                            </div>

                            {uploadMode === 'record' && (
                                <div className="text-center">
                                    <button onClick={isRecording ? handleStopRecording : handleStartRecording} className="bg-red-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {isRecording ? <div className="w-6 h-6 bg-white rounded-sm"></div> : <VoiceIcon />}
                                    </button>
                                    <p className="text-white/60">{isRecording ? 'Recording...' : 'Tap to Record'}</p>
                                </div>
                            )}

                            {uploadMode === 'upload' && (
                                <input type="file" accept="audio/*" onChange={handleFileChange} className="w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"/>
                            )}

                            {audioUrl && <audio src={audioUrl} controls className="w-full mt-4"></audio>}
                            
                            <button onClick={handleCreateVoice} disabled={uploading || (!audioBlob && !file)} className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50">
                                {uploading ? <LoadingSpinner /> : 'Create Voice Profile'}
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                     <h3 className="text-xl font-bold text-white mb-4">Manage Subscription</h3>
                     <p className="text-white/80">You are on the free plan.</p>
                </div>
            </div>
        </div>
    );
};

// --- BUY CREDITS MODAL ---
const BuyCreditsModal = ({ setShowBuyCreditsModal, session }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    const creditPacks = [
        { name: 'Trial Pack', credits: 10, price: '$7', priceId: 'price_1RnqtMKucnJQ8ZaNjFzxoW85' },
        { name: 'Creator Pack', credits: 50, price: '$27', priceId: 'price_1RnqtrKucnJQ8ZaNI5apjA4u' },
        { name: 'Pro Pack', credits: '100 + 10 Bonus', price: '$47', priceId: 'price_1RnquFKucnJQ8ZaNR9Z6skUk', popular: true },
        { name: 'Agency Pack', credits: '250 + 50 Bonus', price: '$97', priceId: 'price_1RnqucKucnJQ8ZaNt9SNptof' },
    ];
    const handlePurchase = async (priceId) => {
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, userId: session.user.id }),
            });
            const responseBody = await response.json();
            if (!response.ok) {
                throw new Error(responseBody.error || 'Failed to create checkout session.');
            }
            window.location.href = responseBody.url;
        } catch (error) {
            addToast(`An error occurred: ${error.message}`, 'error');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-4xl w-full relative">
                <button onClick={() => setShowBuyCreditsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-3xl font-bold text-center text-white mb-2">Buy More Credits</h3>
                <p className="text-white/70 text-center mb-8">Choose a credit pack to continue creating viral content.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {creditPacks.map((pack) => (
                        <div key={pack.name} className={`bg-black/20 border rounded-xl p-6 flex flex-col ${pack.popular ? 'border-purple-500' : 'border-white/10'}`}>
                            {pack.popular && <span className="text-xs font-bold bg-purple-500 text-white px-3 py-1 rounded-full self-center mb-4">POPULAR</span>}
                            <h4 className="text-xl font-bold text-white text-center">{pack.name}</h4>
                            <p className="text-4xl font-extrabold text-white text-center my-4">{pack.credits.toLocaleString ? pack.credits.toLocaleString() : pack.credits}</p>
                            <p className="text-white/70 text-center mb-6">Credits</p>
                            <button onClick={() => handlePurchase(pack.priceId)} disabled={loading} className="mt-auto w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                                {loading ? <LoadingSpinner/> : pack.price}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- AI COACH INSIGHTS COMPONENT ---
const AICoachInsights = ({ session, refreshKey }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInsights = useCallback(async () => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const response = await fetch('/.netlify/functions/get-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id }),
            });
            const data = await response.json();
            if (response.ok) {
                setInsights(data.insights);
            }
        } catch (error) {
            console.error("Failed to fetch insights:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchInsights();
    }, [session, refreshKey, fetchInsights]);

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4"><LightbulbIcon/> AI Coach Insights</h3>
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                </div>
            ) : (
                <ul className="space-y-3 text-white/80 text-sm list-disc list-inside">
                    {insights.length > 0 ? insights.map((insight, i) => <li key={i}>{insight}</li>) : <li>No insights yet. Create and track content to get feedback.</li>}
                </ul>
            )}
        </div>
    );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ session, profile, setProfile, setShowBuyCreditsModal, voiceProfile, onContentTracked, refreshKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['TikTok']);
    const { addToast } = useToast();

    const togglePlatform = (platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleGenerate = useCallback(async () => {
        if (!profile || profile.credits < 1) { setShowBuyCreditsModal(true); return; }
        if (!topic) { addToast('Please enter a topic.', 'error'); return; }
        if (selectedPlatforms.length === 0) { addToast('Please select at least one platform.', 'error'); return; }

        setIsLoading(true);
        setGeneratedContent(null);
        try {
            const { error: updateError } = await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', session.user.id);
            if (updateError) throw updateError;
            setProfile(prev => ({ ...prev, credits: prev.credits - 1 }));

            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, platforms: selectedPlatforms, userId: session.user.id }),
            });
            if (!response.ok) throw new Error('AI failed to generate content.');
            const blueprintData = await response.json();
            
            const { data: newContent, error: saveError } = await supabase
                .from('generated_content')
                .insert({ user_id: session.user.id, topic: topic, blueprint: blueprintData })
                .select()
                .single();

            if (saveError) throw saveError;
            
            setGeneratedContent(newContent);
            setTopic('');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [topic, selectedPlatforms, profile, session, setProfile, setShowBuyCreditsModal, addToast]);
    
    const handlePerformanceSaved = () => {
        setGeneratedContent(null);
        onContentTracked();
    }

    const platformOptions = [
        { name: 'TikTok', icon: <TikTokIcon /> },
        { name: 'YouTube', icon: <YouTubeIcon /> },
        { name: 'Instagram', icon: <InstagramIcon /> },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-white">Creator's Command Center</h2>
                        <p className="text-white/70 mt-2 mb-6">Let's create your next viral hit. Start with a topic below.</p>
                        
                        <div>
                            <label className="font-semibold text-lg text-white block mb-3">1. What's your video topic?</label>
                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to start a podcast'" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            
                            <label className="font-semibold text-lg text-white block mt-6 mb-3">2. Where will you post it?</label>
                            <div className="flex flex-wrap gap-2">
                                {platformOptions.map(p => (
                                    <button key={p.name} onClick={() => togglePlatform(p.name)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border-2 ${selectedPlatforms.includes(p.name) ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'}`}>
                                        {p.icon}
                                        {p.name}
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleGenerate} disabled={isLoading} className="mt-8 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center disabled:opacity-50">
                                {isLoading ? <LoadingSpinner /> : 'Generate Blueprint (1 Credit)'}
                            </button>
                        </div>
                    </div>
                    {isLoading && <SkeletonLoader />}
                    {generatedContent && <ResultsDisplay content={generatedContent} session={session} voiceProfile={voiceProfile} onPerformanceSaved={handlePerformanceSaved} />}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditIcon />
                            <h3 className="text-lg font-semibold text-white">Credit Balance</h3>
                        </div>
                        <p className="text-5xl font-bold text-brand-accent">{profile ? profile.credits : '0'}</p>
                        <button onClick={() => setShowBuyCreditsModal(true)} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg">Buy More Credits</button>
                    </div>
                    <AICoachInsights session={session} refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const AppContent = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [voiceProfile, setVoiceProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentPage, setCurrentPage] = useState('home');
    const { addToast } = useToast();

    const navigate = (page) => {
        setCurrentPage(page);
    };

    const handleContentTracked = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session) setProfileLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setShowAuthModal(false);
            } else {
                setProfile(null);
                setVoiceProfile(null);
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
            };
            const fetchVoiceProfile = async () => {
                const { data } = await supabase.from('voice_profiles').select('voice_id').eq('id', session.user.id).single();
                setVoiceProfile(data);
            };
            Promise.all([fetchProfile(), fetchVoiceProfile()]).then(() => {
                setProfileLoading(false);
            });
        } else {
             setProfileLoading(false);
        }
    }, [session]);

    const renderMainContent = () => {
        if (currentPage === 'privacy') return <PrivacyPolicyPage navigate={navigate} />;
        if (currentPage === 'terms') return <TermsOfServicePage navigate={navigate} />;
        
        return session ? (
            <>
                <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-[73px] z-30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
                        <button onClick={() => setActiveView('dashboard')} className={`px-4 py-3 font-semibold ${activeView === 'dashboard' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Dashboard</button>
                        <button onClick={() => setActiveView('analyzer')} className={`px-4 py-3 font-semibold ${activeView === 'analyzer' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Video Analyzer</button>
                        <button onClick={() => setActiveView('calendar')} className={`px-4 py-3 font-semibold ${activeView === 'calendar' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Content Calendar</button>
                        <button onClick={() => setActiveView('account')} className={`px-4 py-3 font-semibold ${activeView === 'account' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Account</button>
                    </div>
                </nav>
                {activeView === 'dashboard' && <Dashboard session={session} profile={profile} setProfile={setProfile} setShowBuyCreditsModal={setShowBuyCreditsModal} voiceProfile={voiceProfile} onContentTracked={handleContentTracked} refreshKey={refreshKey} />}
                {activeView === 'analyzer' && <ViralVideoAnalyzer session={session} profile={profile} setProfile={setProfile} setShowBuyCreditsModal={setShowBuyCreditsModal} addToast={addToast} />}
                {activeView === 'calendar' && <CalendarView session={session} voiceProfile={voiceProfile} />}
                {activeView === 'account' && <AccountView session={session} voiceProfile={voiceProfile} setVoiceProfile={setVoiceProfile} />}
            </>
        ) : (
            <HomePage setShowAuthModal={setShowAuthModal} />
        );
    };

    return (
        <div className="bg-brand-background text-brand-text-secondary min-h-screen font-sans flex flex-col">
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full relative">
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">Your Blueprint is Ready!</h3>
                        <p className="text-white/70 text-center mb-6">Create a free account to view it.</p>
                        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google']} theme="dark" />
                    </div>
                </div>
            )}
            
            {showBuyCreditsModal && <BuyCreditsModal setShowBuyCreditsModal={setShowBuyCreditsModal} session={session} />}

            <header className="border-b border-white/10 sticky top-0 bg-black/30 backdrop-blur-lg z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 onClick={() => navigate('home')} className="text-2xl font-bold text-white cursor-pointer">Viral Script AI</h1>
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-white/80">Credits: <span className="font-bold text-white">{profileLoading ? '...' : (profile ? profile.credits : 0)}</span></span>
                            <button onClick={async () => { await supabase.auth.signOut(); navigate('home'); }} className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg text-sm border border-white/20">Logout</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Login / Sign Up</button>
                    )}
                </div>
            </header>

            <main className="flex-grow">
                {renderMainContent()}
            </main>

            <footer className="w-full bg-black/20 border-t border-white/10 mt-16 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white/70">
                    <div className="flex justify-center gap-6 mb-4">
                        <button onClick={() => navigate('privacy')} className="hover:text-white">Privacy Policy</button>
                        <button onClick={() => navigate('terms')} className="hover:text-white">Terms of Service</button>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Viral Script AI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

// The root App component now only provides the context.
const App = () => {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
};

export default App;
