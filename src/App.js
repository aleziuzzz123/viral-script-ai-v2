import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// --- Toast Notification System (No changes) ---
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

// --- SVG Icons (Added new ones) ---
const CreditIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8.5h20M7 15.5h3M12 15.5h2M2 12.031V17c0 2 1 3 3 3h14c2 0 3-1 3-3V8c0-2-1-3-3-3H5c-2 0-3 1-3 3" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="currentColor"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="currentColor"/></svg>;
const VisualsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>;
const AudioIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg>;
const HashtagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-2 .9-2 2v5.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l5.17-5.17c.78-.78.78-2.05 0-2.83l-8.83-8.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" fill="currentColor"/></svg>;
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const VoiceIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" fill="currentColor"></path></svg>;
const BulbIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22h6M12 18v4M9.31 15.69c.39.39 1.02.39 1.41 0l1.48-1.48c.31-.31.47-.72.47-1.13V12c0-.41-.16-.82-.47-1.13L10.72 9.39c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.5 12l-1.19 1.19c-.38.39-.38 1.03 0 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const SparkleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// --- Homepage Components (No changes) ---
const FeatureCard = ({ icon, title, children }) => ( <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10"><div className="text-brand-accent mb-3">{icon}</div><h3 className="text-xl font-bold text-white mb-2">{title}</h3><p className="text-brand-text-secondary">{children}</p></div>);
const TestimonialCard = ({ quote, name, title }) => ( <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10"><div className="flex text-yellow-400 mb-4">★★★★★</div><p className="text-white italic mb-4">"{quote}"</p><div><p className="font-bold text-white">{name}</p><p className="text-brand-text-secondary">{title}</p></div></div>);
const HomePage = ({ setShowAuthModal }) => ( <div className="w-full"><section className="text-center py-20 md:py-32 px-4"><h1 className="text-5xl md:text-7xl font-extrabold text-white">Stop Guessing. Start Going Viral.</h1><p className="text-xl text-brand-text-secondary max-w-3xl mx-auto mt-6 mb-10">Generate complete viral video blueprints—from hooks and scripts to production notes and hashtags—in seconds with our advanced AI strategist.</p><button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">Generate Your First Blueprint Free</button></section><section className="py-20 px-4"><h2 className="text-4xl font-bold text-center text-white mb-12">How It Works</h2><div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center"><div><div className="text-5xl mb-4">1️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Enter Your Topic</h3><p className="text-brand-text-secondary">Give our AI any idea, topic, or keyword.</p></div><div><div className="text-5xl mb-4">2️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Generate Your Blueprint</h3><p className="text-brand-text-secondary">Receive a complete plan, including hooks, a full script, and production notes.</p></div><div><div className="text-5xl mb-4">3️⃣</div><h3 className="text-2xl font-bold text-white mb-2">Create & Post</h3><p className="text-brand-text-secondary">Use the blueprint to create high-impact content and watch your audience grow.</p></div></div></section><section className="py-20 px-4 bg-white/5"><h2 className="text-4xl font-bold text-center text-white mb-12">A Feature for Every Step</h2><div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8"><FeatureCard icon={<HistoryIcon />} title="AI-Scored Hooks">Don't just get hooks, get hooks scored by our AI for viral potential.</FeatureCard><FeatureCard icon={<VoiceIcon />} title="The Director's Cut">Hear your script in your own voice with AI-powered audio previews.</FeatureCard><FeatureCard icon={<Calendar />} title="Content Calendar">Track your past ideas and plan your future content with ease.</FeatureCard><FeatureCard icon={<VisualsIcon />} title="Full Production Plan">Get shot-by-shot visual ideas, audio suggestions, and a curated hashtag strategy.</FeatureCard></div></section><section className="py-20 px-4"><h2 className="text-4xl font-bold text-center text-white mb-12">Loved by Creators Everywhere</h2><div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8"><TestimonialCard quote="Viral Script AI has saved me hours of brainstorming every week. The 'Director's Cut' feature is a game-changer for my workflow!" name="Sarah L." title="TikTok Creator" /><TestimonialCard quote="The AI-scored hooks are incredibly accurate. My engagement has gone through the roof since I started using this tool." name="Mike P." title="YouTube Shorts Specialist" /></div></section><section className="py-20 px-4 text-center"><h2 className="text-4xl font-bold text-white mb-6">Ready to Go Viral?</h2><button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">Get Started for Free</button></section></div>);

// --- Loading Skeleton Component (No changes) ---
const SkeletonLoader = () => (<div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 animate-pulse"><div className="h-8 bg-gray-700/50 rounded w-1/3"></div><div className="space-y-4"><div className="h-24 bg-gray-700/50 rounded"></div><div className="h-24 bg-gray-700/50 rounded"></div></div></div>);

// --- Blueprint Detail Modal (No changes) ---
const BlueprintDetailModal = ({ blueprint, closeModal, session, voiceProfile }) => { if (!blueprint) return null; return ( <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-3xl w-full relative"><button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button><h3 className="text-2xl font-bold text-center text-brand-text-primary mb-4">Blueprint Details</h3><div className="max-h-[70vh] overflow-y-auto"><ResultsDisplay content={blueprint} session={session} voiceProfile={voiceProfile} /></div></div></div>);};

// --- Schedule Modal (No changes) ---
const ScheduleModal = ({ blueprint, session, setShow, onScheduled }) => { const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [saving, setSaving] = useState(false); const { addToast } = useToast(); const handleSave = async () => { setSaving(true); const { error } = await supabase.from('scheduled_posts').insert({ user_id: session.user.id, scheduled_for: date, title: blueprint.hooks[0].text, blueprint: blueprint, }); if (error) { addToast('Error scheduling post: ' + error.message, 'error'); } else { addToast('Post scheduled successfully!', 'success'); setShow(false); onScheduled(); } setSaving(false); }; return ( <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-md w-full relative"><button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button><h3 className="text-2xl font-bold text-center text-brand-text-primary mb-4">Schedule Blueprint</h3><p className="text-brand-text-secondary text-center mb-6">Choose a date to add this to your content calendar.</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg p-3" /><button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-brand-accent hover:opacity-90 text-black font-bold py-3 rounded-lg">{saving ? 'Saving...' : 'Add to Calendar'}</button></div></div>);};

// --- NEW Performance Tracker Modal ---
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


// --- Results Component (UPDATED) ---
const ResultsDisplay = ({ content, session, voiceProfile, onPerformanceSaved }) => {
    const [activeTab, setActiveTab] = useState('hooks');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const { addToast } = useToast();
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioSrc, setAudioSrc] = useState(null);

    const handleGenerateAudio = async () => { /* ... existing code ... */ };
    const copyToClipboard = (text) => { /* ... existing code ... */ };
    const getCategoryClass = (category) => { /* ... existing code ... */ };

    return (
        <>
            {showScheduleModal && <ScheduleModal blueprint={content.blueprint} session={session} setShow={setShowScheduleModal} onScheduled={() => {}} />}
            {showPerformanceModal && <PerformanceModal contentId={content.id} initialData={content} setShow={setShowPerformanceModal} onSaved={onPerformanceSaved} />}
            
            <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <div className="flex">
                        <button onClick={() => setActiveTab('hooks')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'hooks' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Hooks & Scores</button>
                        <button onClick={() => setActiveTab('script')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'script' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Full Script</button>
                        <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 font-semibold text-sm rounded-md ${activeTab === 'plan' ? 'bg-white/10 text-white' : 'text-white/70'}`}>Production Plan</button>
                    </div>
                    <button onClick={() => setShowPerformanceModal(true)} className="bg-green-500/20 hover:bg-green-500/30 text-green-300 font-bold py-2 px-4 rounded-lg text-sm">Track Performance</button>
                </div>
                <div className="p-6">
                    {/* ... existing JSX for tabs ... */}
                </div>
            </div>
        </>
    );
};

// --- Calendar View Component (UPDATED) ---
const CalendarView = ({ session, voiceProfile }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [date, setDate] = useState(new Date());

    const fetchEvents = useCallback(async () => {
        if (!session?.user) return;
        const { data, error } = await supabase.from('generated_content').select('*').eq('user_id', session.user.id);
        if (error) { console.error("Error fetching content for calendar:", error); } 
        else { setEvents(data); }
    }, [session]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleDayClick = (value) => {
        const clickedDate = value.toDateString();
        const eventForDay = events.find(e => new Date(e.created_at).toDateString() === clickedDate);
        if (eventForDay) { setSelectedEvent(eventForDay); }
    };
    
    // ... rest of CalendarView is the same
};


// --- Account View Component (No changes) ---
const AccountView = ({ session, voiceProfile, setVoiceProfile }) => { /* ... existing code ... */ };

// --- Buy Credits Modal (No changes) ---
const BuyCreditsModal = ({ setShowBuyCreditsModal, session }) => { /* ... existing code ... */ };

// --- Creator's Hub Component (No changes) ---
const CreatorsHub = () => { /* ... existing code ... */ };

// --- Dashboard Component (UPDATED) ---
const Dashboard = ({ session, profile, setProfile, setShowBuyCreditsModal, voiceProfile }) => {
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
            
            // Save to DB and get the new row back with its ID
            const { data: newContent, error: saveError } = await supabase
                .from('generated_content')
                .insert({ user_id: session.user.id, topic: topic, blueprint: blueprintData })
                .select()
                .single();

            if (saveError) throw saveError;
            
            setGeneratedContent(newContent); // This now includes the ID
            setWizardStep(1);
            setTopic('');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [topic, goal, tone, audience, profile, session, setProfile, wizardStep, setShowBuyCreditsModal, addToast]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        {/* ... existing JSX for Command Center ... */}
                    </div>
                    {isLoading && <SkeletonLoader />}
                    {generatedContent && <ResultsDisplay content={generatedContent} session={session} voiceProfile={voiceProfile} onPerformanceSaved={() => setGeneratedContent(null)} />}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    {/* ... existing JSX for sidebar ... */}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    // ... existing state and useEffects ...
    const [activeView, setActiveView] = useState('dashboard');
    
    return (
        <ToastProvider>
            <div className="bg-brand-background text-brand-text-secondary min-h-screen font-sans">
                {/* ... existing Modals and Header ... */}
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
                            {activeView === 'dashboard' && <Dashboard session={session} profile={profile} setProfile={setProfile} setShowBuyCreditsModal={setShowBuyCreditsModal} voiceProfile={voiceProfile} />}
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

