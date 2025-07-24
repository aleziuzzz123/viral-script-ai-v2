import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

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
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="currentColor"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="currentColor"/></svg>;
const VisualsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>;
const AudioIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg>;
const HashtagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-2 .9-2 2v5.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l5.17-5.17c.78-.78.78-2.05 0-2.83l-8.83-8.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" fill="currentColor"/></svg>;
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const VoiceIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" fill="currentColor"></path></svg>;
const LightbulbIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22h6M12 18v4M9.31 15.69c.39.39 1.02.39 1.41 0l1.48-1.48c.31-.31.47-.72.47-1.13V12c0-.41-.16-.82-.47-1.13L10.72 9.39c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.5 12l-1.19 1.19c-.38.39-.38 1.03 0 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// --- Homepage Components (UPDATED with Images) ---
const FeatureCard = ({ icon, title, children }) => ( <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10"><div className="text-brand-accent mb-3">{icon}</div><h3 className="text-xl font-bold text-white mb-2">{title}</h3><p className="text-brand-text-secondary">{children}</p></div>);
const TestimonialCard = ({ quote, name, title, avatarUrl }) => ( 
    <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
        <div className="flex text-yellow-400 mb-4">★★★★★</div>
        <p className="text-white italic mb-4">"{quote}"</p>
        <div className="flex items-center gap-4">
            <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <p className="font-bold text-white">{name}</p>
                <p className="text-brand-text-secondary">{title}</p>
            </div>
        </div>
    </div>
);
const HomePage = ({ setShowAuthModal }) => ( 
    <div className="w-full">
        <section className="text-center py-20 md:py-32 px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white">Stop Guessing. Start Going Viral.</h1>
                    <p className="text-xl text-brand-text-secondary max-w-xl mt-6 mb-10">Generate complete viral video blueprints—from hooks and scripts to production notes and hashtags—in seconds with our advanced AI strategist.</p>
                    <button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">Generate Your First Blueprint Free</button>
                </div>
                <div>
                    {/* --- NEW: Homepage Hero Image --- */}
                    {/* --- Replace this placeholder with your generated image from Leonardo.ai --- */}
                    <img src="https://placehold.co/1024x768/1e1b4b/4f46e5?text=Viral+Hook+AI" alt="AI generating viral ideas" className="rounded-2xl shadow-2xl shadow-purple-500/20" />
                </div>
            </div>
        </section>
        <section className="py-20 px-4">
            <h2 className="text-4xl font-bold text-center text-white mb-12">How It Works</h2>
            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
                <div><div className="text-5xl mb-4">1️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Enter Your Topic</h3><p className="text-brand-text-secondary">Give our AI any idea, topic, or keyword.</p></div>
                <div><div className="text-5xl mb-4">2️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Generate Your Blueprint</h3><p className="text-brand-text-secondary">Receive a complete plan, including hooks, a full script, and production notes.</p></div>
                <div><div className="text-5xl mb-4">3️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Create & Post</h3><p className="text-brand-text-secondary">Use the blueprint to create high-impact content and watch your audience grow.</p></div>
            </div>
        </section>
        <section className="py-20 px-4 bg-white/5">
            <h2 className="text-4xl font-bold text-center text-white mb-12">A Feature for Every Step</h2>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8"><FeatureCard icon={<HistoryIcon />} title="AI-Scored Hooks">Don't just get hooks, get hooks scored by our AI for viral potential.</FeatureCard><FeatureCard icon={<VoiceIcon />} title="The Director's Cut">Hear your script in your own voice with AI-powered audio previews.</FeatureCard><FeatureCard icon={<Calendar />} title="Content Calendar">Track your past ideas and plan your future content with ease.</FeatureCard><FeatureCard icon={<VisualsIcon />} title="Full Production Plan">Get shot-by-shot visual ideas, audio suggestions, and a curated hashtag strategy.</FeatureCard></div>
        </section>
        <section className="py-20 px-4">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Loved by Creators Everywhere</h2>
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                {/* --- NEW: Testimonial Avatars --- */}
                {/* --- Replace these placeholders with your generated images --- */}
                <TestimonialCard 
                    quote="Viral Script AI has saved me hours of brainstorming every week. The 'Director's Cut' feature is a game-changer for my workflow!" 
                    name="Sarah L." 
                    title="TikTok Creator" 
                    avatarUrl="https://placehold.co/100x100/EBF4FF/76A9FA?text=SL"
                />
                <TestimonialCard 
                    quote="The AI-scored hooks are incredibly accurate. My engagement has gone through the roof since I started using this tool." 
                    name="Mike P." 
                    title="YouTube Shorts Specialist" 
                    avatarUrl="https://placehold.co/100x100/EBF4FF/76A9FA?text=MP"
                />
            </div>
        </section>
        <section className="py-20 px-4 text-center"><h2 className="text-4xl font-bold text-white mb-6">Ready to Go Viral?</h2><button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">Get Started for Free</button></section>
    </div>
);

// --- Loading Skeleton Component ---
const SkeletonLoader = () => (<div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 animate-pulse"><div className="h-8 bg-gray-700/50 rounded w-1/3"></div><div className="space-y-4"><div className="h-24 bg-gray-700/50 rounded"></div><div className="h-24 bg-gray-700/50 rounded"></div></div></div>);

// --- Blueprint Detail Modal ---
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

// --- Schedule Modal ---
const ScheduleModal = ({ blueprint, session, setShow, onScheduled }) => { const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [saving, setSaving] = useState(false); const { addToast } = useToast(); const handleSave = async () => { setSaving(true); const { error } = await supabase.from('scheduled_posts').insert({ user_id: session.user.id, scheduled_for: date, title: blueprint.hooks[0].text, blueprint: blueprint, }); if (error) { addToast('Error scheduling post: ' + error.message, 'error'); } else { addToast('Post scheduled successfully!', 'success'); setShow(false); onScheduled(); } setSaving(false); }; return ( <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white/10 border-white/20 rounded-2xl p-8 max-w-md w-full relative"><button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button><h3 className="text-2xl font-bold text-center text-white mb-4">Schedule Blueprint</h3><p className="text-white/70 text-center mb-6">Choose a date to add this to your content calendar.</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/20 border-white/20 rounded-lg p-3 text-white" /><button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg">{saving ? 'Saving...' : 'Add to Calendar'}</button></div></div>);};

// --- Performance Tracker Modal ---
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
                    <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.tiktok.com/..." className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={views} onChange={(e) => setViews(e.target.value)} placeholder="Views" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                        <input type="number" value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="Likes" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                        <input type="number" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                        <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="Shares" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                    </div>
                    <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg">{saving ? 'Saving...' : 'Save Performance'}</button>
                </div>
            </div>
        </div>
    );
};


// --- Results Component ---
const ResultsDisplay = ({ content, session, voiceProfile, onPerformanceSaved }) => {
    const [activeTab, setActiveTab] = useState('hooks');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
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
            {showScheduleModal && <ScheduleModal blueprint={content.blueprint} session={session} setShow={setShowScheduleModal} onScheduled={() => {}} />}
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
                    {activeTab === 'hooks' && (<div className="space-y-4">{content.blueprint.hooks.map((hook, index) => (<div key={index} className="bg-black/20 border border-white/10 rounded-lg p-4 group relative"><div className="flex justify-between items-start mb-2"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryClass(hook.category)}`}>{hook.category}</span><div className="text-center flex-shrink-0 ml-4"><p className="font-bold text-2xl text-brand-accent">{hook.score}</p><p className="text-xs text-white/70">Viral Score</p></div></div><p className="text-white pr-12">{hook.text}</p><p className="text-sm text-white/70 mt-2 italic opacity-75">"{hook.analysis}"</p><button onClick={() => copyToClipboard(hook.text)} className="absolute top-2 right-2 bg-white/10 text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Copy</button></div>))}</div>)}
                    {activeTab === 'script' && (<div className="bg-black/20 border border-white/10 rounded-lg p-6 whitespace-pre-line text-white/90 leading-relaxed group relative">{content.blueprint.script}<div className="mt-6 pt-4 border-t border-white/10"><button onClick={handleGenerateAudio} disabled={audioLoading} className="flex items-center gap-2 bg-brand-accent text-black font-bold py-2 px-4 rounded-lg">{audioLoading ? <LoadingSpinner /> : <PlayIcon />} {audioLoading ? 'Generating Audio...' : "Hear Director's Cut"}</button>{audioSrc && <audio controls src={audioSrc} className="w-full mt-4" />}</div><button onClick={() => copyToClipboard(content.blueprint.script)} className="absolute top-2 right-2 bg-white/10 text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Copy Script</button></div>)}
                    {activeTab === 'plan' && (<div className="space-y-6"><div className="flex items-start gap-4"><VisualsIcon /><div><h4 className="font-semibold text-white mb-2">Visual Ideas</h4><ul className="list-disc list-inside space-y-1 text-white/90">{content.blueprint.production_plan.visuals.map((v, i) => <li key={i}>{v}</li>)}</ul></div></div><div className="flex items-start gap-4"><AudioIcon /><div><h4 className="font-semibold text-white mb-2">Audio Suggestion</h4><p className="text-white/90">{content.blueprint.production_plan.audio}</p></div></div><div className="flex items-start gap-4"><HashtagIcon /><div><h4 className="font-semibold text-white mb-2">Hashtag Strategy</h4><div className="flex flex-wrap gap-2 group relative">{content.blueprint.production_plan.hashtags.map((h, i) => <span key={i} className="bg-black/20 border border-white/10 text-white/90 text-sm font-medium px-3 py-1 rounded-full">{h}</span>)}<button onClick={() => copyToClipboard(content.blueprint.production_plan.hashtags.join(' '))} className="absolute -top-2 -right-2 bg-white/10 text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Copy All</button></div></div></div></div>)}
                </div>
            </div>
        </>
    );
};

// --- Calendar View Component ---
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

    const handleDayClick = (value) => {
        const clickedDate = value.toDateString();
        const eventForDay = events.find(e => new Date(e.created_at).toDateString() === clickedDate);
        if (eventForDay) { setSelectedEvent(eventForDay); }
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toDateString();
            const hasEvent = events.some(e => new Date(e.created_at).toDateString() === dateString);
            if (hasEvent) {
                return <div className="h-2 w-2 bg-brand-accent rounded-full mx-auto mt-1"></div>;
            }
        }
        return null;
    };
    
    const postedVideos = events.filter(e => e.is_posted);

    return (
        <>
            {selectedEvent && <BlueprintDetailModal content={selectedEvent} closeModal={() => setSelectedEvent(null)} session={session} voiceProfile={voiceProfile} onPerformanceSaved={fetchEvents} />}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-white mb-6">Content Calendar & Performance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                        <Calendar
                            onChange={setDate}
                            value={date}
                            onClickDay={handleDayClick}
                            tileContent={tileContent}
                            className="react-calendar-override"
                        />
                    </div>
                    <div className="lg:col-span-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Performance Log</h3>
                        {postedVideos.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {postedVideos.map(video => (
                                    <button key={video.id} onClick={() => setSelectedEvent(video)} className="w-full text-left bg-black/20 hover:bg-black/40 p-4 rounded-lg transition-colors">
                                        <p className="font-bold text-white truncate">{video.topic}</p>
                                        <div className="flex justify-between text-sm text-white/70 mt-2">
                                            <span>Views: {video.views.toLocaleString()}</span>
                                            <span>Likes: {video.likes.toLocaleString()}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/70">Track a video's performance to see your stats here.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};


// --- Account View Component ---
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                    <VoiceIcon />
                    <h3 className="text-lg font-semibold text-white">Your Voice Profile</h3>
                </div>
                {voiceProfile?.voice_id ? (
                    <div>
                        <p className="text-white/80">Your AI voice profile is active.</p>
                        <p className="text-sm text-gray-400 mt-1">Voice ID: {voiceProfile.voice_id}</p>
                        <button onClick={handleDeleteVoice} disabled={uploading} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                            {uploading ? 'Deleting...' : 'Delete Voice Profile'}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-white/80 mb-4">Create your unique AI voice to generate audio previews. You can either record a sample directly or upload an existing audio file.</p>
                        <div className="flex border-b border-white/20 mb-4">
                            <button onClick={() => setUploadMode('record')} className={`px-4 py-2 font-semibold ${uploadMode === 'record' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Record</button>
                            <button onClick={() => setUploadMode('upload')} className={`px-4 py-2 font-semibold ${uploadMode === 'upload' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Upload</button>
                        </div>
                        {uploadMode === 'record' && (<div className="flex items-center gap-4">{!isRecording ? (<button onClick={handleStartRecording} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Start Recording</button>) : (<button onClick={handleStopRecording} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Stop Recording</button>)}</div>)}
                        {uploadMode === 'upload' && (<input type="file" accept="audio/*" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent file:text-black hover:file:opacity-90" />)}
                        {audioUrl && <audio src={audioUrl} controls className="mt-4" />}
                        {(audioBlob || file) && (<button onClick={handleCreateVoice} disabled={uploading} className="mt-4 bg-brand-accent hover:opacity-90 text-black font-bold py-2 px-4 rounded-lg disabled:opacity-50">{uploading ? 'Creating Voice...' : 'Create Voice Profile'}</button>)}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Buy Credits Modal ---
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
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-2xl w-full relative">
                <button onClick={() => setShowBuyCreditsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-3xl font-bold text-center text-white mb-2">Buy More Credits</h3>
                <p className="text-white/70 text-center mb-8">Choose a pack to continue creating.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creditPacks.map(pack => (
                        <div key={pack.name} className={`bg-black/20 border-2 rounded-lg p-6 text-center ${pack.popular ? 'border-brand-accent' : 'border-white/20'}`}>
                            <h4 className="text-xl font-bold text-white">{pack.name}</h4>
                            <p className="text-4xl font-extrabold text-brand-accent my-4">{pack.credits}</p>
                            <p className="text-white/70 mb-6">Credits</p>
                            <button onClick={() => handlePurchase(pack.priceId)} disabled={loading} className="w-full bg-brand-accent hover:opacity-90 text-black font-bold py-3 rounded-lg">
                                {loading ? '...' : `Buy for ${pack.price}`}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- AI Coach Insights Component (FIXED) ---
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
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-white">AI Coach Insights</h3>
                 <button onClick={fetchInsights} className="text-white/50 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                 </button>
            </div>
            <div className="relative h-40">
                {loading ? (
                    <p className="text-white/70">Analyzing your performance...</p>
                ) : insights.length > 0 ? (
                    insights.map((insight, index) => (
                        <div key={index}>
                            <div className="flex items-center gap-3 mb-2 text-yellow-400">
                                <LightbulbIcon />
                                <h4 className="font-semibold">{insight.title}</h4>
                            </div>
                            <p className="text-white/80 text-sm" dangerouslySetInnerHTML={{ __html: insight.text }} />
                        </div>
                    ))
                ) : (
                    <p className="text-white/70 text-sm">Track at least 3 videos to unlock your personalized AI insights!</p>
                )}
            </div>
        </div>
    );
};

// --- Dashboard Component ---
const Dashboard = ({ session, profile, setProfile, setShowBuyCreditsModal, voiceProfile, onContentTracked, refreshKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('Go Viral / Maximize Reach');
    const [tone, setTone] = useState('Engaging');
    const [audience, setAudience] = useState('');
    const { addToast } = useToast();

    const trendingTopics = [ "The biggest myth about fitness", "3 AI tools that feel illegal to know", "A simple productivity hack that saved me 10 hours a week" ];
    const handleTopicClick = (selectedTopic) => { setTopic(selectedTopic); setWizardStep(2); };

    const handleGenerate = useCallback(async () => {
        if (!profile || profile.credits < 1) { setShowBuyCreditsModal(true); return; }
        if (!topic) { addToast('Please enter a topic.', 'error'); return; }
        if (wizardStep === 1) { setWizardStep(2); return; }

        setIsLoading(true);
        setGeneratedContent(null);
        try {
            const { error: updateError } = await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', session.user.id);
            if (updateError) throw updateError;
            setProfile(prev => ({ ...prev, credits: prev.credits - 1 }));

            const response = await fetch('/.netlify/functions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, goal, tone, audience, userId: session.user.id }),
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
            setWizardStep(1);
            setTopic('');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [topic, goal, tone, audience, profile, session, setProfile, wizardStep, setShowBuyCreditsModal, addToast]);
    
    const handlePerformanceSaved = () => {
        setGeneratedContent(null);
        onContentTracked();
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-white">Creator's Command Center</h2>
                        <p className="text-white/70 mt-2 mb-6">Welcome back, {session.user.email.split('@')[0]}! Let's create your next viral hit.</p>
                        
                        {wizardStep === 1 && (
                            <div>
                                <label className="font-semibold text-lg text-white block mb-3">What's your video topic?</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to start a podcast'" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                                    <button onClick={handleGenerate} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg whitespace-nowrap transition-transform transform hover:scale-105">Create Blueprint</button>
                                </div>
                                <div className="mt-6">
                                    <p className="text-sm text-white/70 mb-3">Stuck? Try a trending topic:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingTopics.map(t => (
                                            <button key={t} onClick={() => handleTopicClick(t)} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1 rounded-full transition-colors">{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-6 text-left animate-fade-in">
                                <p className="text-white/70">Topic: <span className="font-bold text-white">{topic}</span></p>
                                <div>
                                    <label className="font-semibold text-white block mb-2">What is your primary goal?</label>
                                    <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white">
                                        <option>Go Viral / Maximize Reach</option>
                                        <option>Sell a Product / Service</option>
                                        <option>Educate My Audience</option>
                                        <option>Tell a Personal Story</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-white block mb-2">What is the desired tone?</label>
                                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white">
                                        <option>Engaging</option>
                                        <option>Funny & Comedic</option>
                                        <option>Inspirational & Motivational</option>
                                        <option>Serious & Educational</option>
                                        <option>Shocking & Controversial</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="font-semibold text-white block mb-2">Briefly describe your target audience.</label>
                                    <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., 'Beginner entrepreneurs'" className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white" />
                                </div>
                                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
                                    {isLoading && <LoadingSpinner />}
                                    {isLoading ? 'Generating...' : 'Generate My Custom Blueprint'}
                                </button>
                            </div>
                        )}
                    </div>
                    {isLoading && <SkeletonLoader />}
                    {generatedContent && <ResultsDisplay content={generatedContent} session={session} voiceProfile={voiceProfile} onPerformanceSaved={handlePerformanceSaved} />}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4 text-white">
                            <CreditIcon />
                            <h3 className="text-lg font-bold">Credit Balance</h3>
                        </div>
                        <p className="text-5xl font-bold text-white">{profile ? profile.credits : '0'}</p>
                        <button onClick={() => setShowBuyCreditsModal(true)} className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-colors">Buy More Credits</button>
                    </div>
                    <AICoachInsights session={session} refreshKey={refreshKey} />
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [voiceProfile, setVoiceProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleContentTracked = () => {
        setRefreshKey(prev => prev + 1);
    };

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

    return (
        <ToastProvider>
            <div className="bg-brand-background text-brand-text-secondary min-h-screen font-sans">
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
                        <h1 className="text-2xl font-bold text-white">Viral Script AI</h1>
                        {session ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-white/80">Credits: <span className="font-bold text-white">{profileLoading ? '...' : (profile ? profile.credits : 0)}</span></span>
                                <button onClick={async () => await supabase.auth.signOut()} className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg text-sm border border-white/20">Logout</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg">Login / Sign Up</button>
                        )}
                    </div>
                </header>

                <main>
                    {session ? (
                        <>
                            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
                                    <button onClick={() => setActiveView('dashboard')} className={`px-4 py-3 font-semibold ${activeView === 'dashboard' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Dashboard</button>
                                    <button onClick={() => setActiveView('calendar')} className={`px-4 py-3 font-semibold ${activeView === 'calendar' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Content Calendar</button>
                                    <button onClick={() => setActiveView('account')} className={`px-4 py-3 font-semibold ${activeView === 'account' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-white/70'}`}>Account</button>
                                </div>
                            </nav>
                            {activeView === 'dashboard' && <Dashboard session={session} profile={profile} setProfile={setProfile} setShowBuyCreditsModal={setShowBuyCreditsModal} voiceProfile={voiceProfile} onContentTracked={handleContentTracked} refreshKey={refreshKey} />}
                            {activeView === 'calendar' && <CalendarView session={session} voiceProfile={voiceProfile} />}
                            {activeView === 'account' && <AccountView session={session} voiceProfile={voiceProfile} setVoiceProfile={setVoiceProfile} />}
                        </>
                    ) : (
                        <HomePage setShowAuthModal={setShowAuthModal} />
                    )}
                </main>
            </div>
        </ToastProvider>
    );
};

export default App;
 
