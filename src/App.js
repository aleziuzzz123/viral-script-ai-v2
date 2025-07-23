import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

// --- Localizer for the Calendar ---
const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- SVG Icons ---
const CreditIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2v-4zm0 6h2v2h-2v-2z" fill="currentColor"/></svg>;
const HistoryIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7v2a9 9 0 0 0 9-9 9 9 0 0 0-9-9z" fill="currentColor"/><path d="M12 8v5l4.25 2.52.75-1.23-3.5-2.07V8z" fill="currentColor"/></svg>;
const VisualsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/></svg>;
const AudioIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/></svg>;
const HashtagIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-accent"><path d="M10.59 4.59C10.21 4.21 9.7 4 9.17 4H4c-1.1 0-2 .9-2 2v5.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l5.17-5.17c.78-.78.78-2.05 0-2.83l-8.83-8.83zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z" fill="currentColor"/></svg>;

// --- Blueprint Detail Modal (NEW) ---
const BlueprintDetailModal = ({ blueprint, closeModal }) => {
    if (!blueprint) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-3xl w-full relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h3 className="text-2xl font-bold text-center text-brand-text-primary mb-4">Blueprint Details</h3>
                <div className="max-h-[70vh] overflow-y-auto">
                   <ResultsDisplay content={blueprint} />
                </div>
            </div>
        </div>
    );
};

// --- Schedule Modal ---
const ScheduleModal = ({ blueprint, session, setShow, onScheduled }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase.from('scheduled_posts').insert({
            user_id: session.user.id,
            scheduled_for: date,
            title: blueprint.hooks[0].text,
            blueprint: blueprint,
        });

        if (error) {
            alert('Error scheduling post: ' + error.message);
        } else {
            setShow(false);
            onScheduled(); // Callback to refresh the calendar view
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-md w-full relative">
                <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h3 className="text-2xl font-bold text-center text-brand-text-primary mb-4">Schedule Blueprint</h3>
                <p className="text-brand-text-secondary text-center mb-6">Choose a date to add this to your content calendar.</p>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg p-3" />
                <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-brand-accent hover:opacity-90 text-black font-bold py-3 rounded-lg">
                    {saving ? 'Saving...' : 'Add to Calendar'}
                </button>
            </div>
        </div>
    );
};

// --- Results Component ---
const ResultsDisplay = ({ content, session, onScheduled }) => {
    const [activeTab, setActiveTab] = useState('hooks');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [copied, setCopied] = useState('');

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(''), 2000);
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
            {showScheduleModal && <ScheduleModal blueprint={content} session={session} setShow={setShowScheduleModal} onScheduled={onScheduled} />}
            <div className="mt-8 bg-brand-container border border-brand-border rounded-2xl">
                <div className="flex justify-between items-center pr-4 border-b border-brand-border">
                    <div className="flex">
                        <button onClick={() => setActiveTab('hooks')} className={`px-4 py-3 font-semibold ${activeTab === 'hooks' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Hooks & Scores</button>
                        <button onClick={() => setActiveTab('script')} className={`px-4 py-3 font-semibold ${activeTab === 'script' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Full Script</button>
                        <button onClick={() => setActiveTab('plan')} className={`px-4 py-3 font-semibold ${activeTab === 'plan' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Production Plan</button>
                    </div>
                    {onScheduled && <button onClick={() => setShowScheduleModal(true)} className="bg-brand-accent hover:opacity-90 text-black font-bold py-2 px-4 rounded-lg text-sm">Schedule</button>}
                </div>
                <div className="p-6">
                    {activeTab === 'hooks' && (
                        <div className="space-y-4">
                            {content.hooks.map((hook, index) => (
                                <div key={index} className="bg-brand-background border border-brand-border rounded-lg p-4 group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryClass(hook.category)}`}>{hook.category}</span>
                                        <div className="text-center flex-shrink-0 ml-4">
                                            <p className="font-bold text-2xl text-brand-accent">{hook.score}</p>
                                            <p className="text-xs text-brand-text-secondary">Viral Score</p>
                                        </div>
                                    </div>
                                    <p className="text-brand-text-primary pr-12">{hook.text}</p>
                                    <p className="text-sm text-brand-text-secondary mt-2 italic opacity-75">"{hook.analysis}"</p>
                                    <button onClick={() => copyToClipboard(hook.text, `hook-${index}`)} className="absolute top-2 right-2 bg-brand-border text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        {copied === `hook-${index}` ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'script' && (
                        <div className="bg-brand-background border border-brand-border rounded-lg p-6 whitespace-pre-line text-brand-text-secondary leading-relaxed group relative">
                            {content.script}
                            <button onClick={() => copyToClipboard(content.script, 'script')} className="absolute top-2 right-2 bg-brand-border text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                {copied === 'script' ? 'Copied!' : 'Copy Script'}
                            </button>
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
                                    <div className="flex flex-wrap gap-2 group relative">
                                        {content.production_plan.hashtags.map((h, i) => <span key={i} className="bg-brand-background border border-brand-border text-brand-text-secondary text-sm font-medium px-3 py-1 rounded-full">{h}</span>)}
                                        <button onClick={() => copyToClipboard(content.production_plan.hashtags.join(' '), 'hashtags')} className="absolute -top-2 -right-2 bg-brand-border text-xs py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                            {copied === 'hashtags' ? 'Copied!' : 'Copy All'}
                                        </button>
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

// --- Calendar View Component (UPDATED) ---
const CalendarView = ({ session }) => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const fetchEvents = useCallback(async () => {
        if (!session?.user) return;
        const { data, error } = await supabase
            .from('generated_content')
            .select('id, topic, created_at, blueprint')
            .eq('user_id', session.user.id);

        if (error) {
            console.error("Error fetching content for calendar:", error);
        } else {
            const formattedEvents = data.map(post => ({
                id: post.id,
                title: post.topic,
                start: new Date(post.created_at),
                end: new Date(post.created_at),
                allDay: true,
                blueprint: post.blueprint
            }));
            setEvents(formattedEvents);
        }
    }, [session]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleSelectEvent = (event) => {
        setSelectedEvent(event.blueprint);
    };

    return (
        <>
            {selectedEvent && <BlueprintDetailModal blueprint={selectedEvent} closeModal={() => setSelectedEvent(null)} />}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-brand-text-primary mb-6">Content Calendar</h2>
                <div className="bg-brand-container border border-brand-border rounded-2xl p-1 md:p-6 h-[70vh] text-brand-text-primary">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        onSelectEvent={handleSelectEvent}
                    />
                </div>
            </div>
        </>
    );
};


// --- Dashboard Component (FIXED) ---
const Dashboard = ({ session, profile, setProfile, setShowBuyCreditsModal }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedContent, setGeneratedContent] = useState(null);
    const [wizardStep, setWizardStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('Go Viral / Maximize Reach');
    const [tone, setTone] = useState('Engaging');
    const [audience, setAudience] = useState('');
    const [generationHistory, setGenerationHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        if (!session?.user) return;
        setHistoryLoading(true);
        const { data } = await supabase.from('generated_content').select('id, created_at, topic').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5);
        setGenerationHistory(data || []);
        setHistoryLoading(false);
    }, [session]);

    useEffect(() => {
        fetchHistory();
    }, [session, fetchHistory]);

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
                body: JSON.stringify({ topic, goal, tone, audience, userId: session.user.id }),
            });
            if (!response.ok) throw new Error('AI failed to generate content.');
            const data = await response.json();
            setGeneratedContent(data);
            
            const { error: saveError } = await supabase.from('generated_content').insert({
                user_id: session.user.id,
                topic: topic,
                blueprint: data
            });
            if (saveError) throw saveError;
            
            fetchHistory();
            setWizardStep(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [topic, goal, tone, audience, profile, session, setProfile, wizardStep, setShowBuyCreditsModal, fetchHistory]);

    return (
        <>
            <nav className="border-b border-brand-border bg-brand-container">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
                    <button onClick={() => setActiveView('dashboard')} className={`px-4 py-3 font-semibold ${activeView === 'dashboard' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Dashboard</button>
                    <button onClick={() => setActiveView('calendar')} className={`px-4 py-3 font-semibold ${activeView === 'calendar' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'}`}>Content Calendar</button>
                </div>
            </nav>

            {activeView === 'dashboard' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-brand-container border border-brand-border rounded-2xl p-8">
                                <h2 className="text-3xl font-bold text-brand-text-primary">Dashboard</h2>
                                <p className="text-brand-text-secondary mt-2 mb-6">Let's create your next viral hit.</p>
                                
                                {wizardStep === 1 && (
                                    <div>
                                        <label className="font-semibold text-lg text-brand-text-primary block mb-3">What's your video topic?</label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'How to start a podcast'" className="w-full bg-brand-background border border-brand-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                                            <button onClick={handleGenerate} className="bg-brand-accent hover:opacity-90 text-black font-bold py-3 px-6 rounded-lg whitespace-nowrap">Create Blueprint</button>
                                        </div>
                                    </div>
                                )}

                                {wizardStep === 2 && (
                                    <div className="space-y-6 text-left">
                                        <div>
                                            <label className="font-semibold text-brand-text-primary block mb-2">What is your primary goal?</label>
                                            <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg p-3">
                                                <option>Go Viral / Maximize Reach</option>
                                                <option>Sell a Product / Service</option>
                                                <option>Educate My Audience</option>
                                                <option>Tell a Personal Story</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-semibold text-brand-text-primary block mb-2">What is the desired tone?</label>
                                            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg p-3">
                                                <option>Engaging</option>
                                                <option>Funny & Comedic</option>
                                                <option>Inspirational & Motivational</option>
                                                <option>Serious & Educational</option>
                                                <option>Shocking & Controversial</option>
                                            </select>
                                        </div>
                                         <div>
                                            <label className="font-semibold text-brand-text-primary block mb-2">Briefly describe your target audience.</label>
                                            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., 'Beginner entrepreneurs'" className="w-full bg-brand-background border border-brand-border rounded-lg p-3" />
                                        </div>
                                        <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-brand-accent hover:opacity-90 text-black font-bold py-4 rounded-lg text-lg">
                                            {isLoading ? 'Generating...' : 'Generate My Custom Blueprint'}
                                        </button>
                                    </div>
                                )}
                                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                            </div>
                            {generatedContent && <ResultsDisplay content={generatedContent} session={session} onScheduled={fetchHistory} />}
                        </div>
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-brand-container border border-brand-border rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CreditIcon />
                                    <h3 className="text-lg font-semibold text-brand-text-primary">Credit Balance</h3>
                                </div>
                                <p className="text-5xl font-bold text-brand-accent">{profile ? profile.credits : '0'}</p>
                                <button onClick={() => setShowBuyCreditsModal(true)} className="w-full mt-4 bg-brand-accent hover:opacity-90 text-black font-bold py-3 rounded-lg">Buy More Credits</button>
                            </div>
                            <div className="bg-brand-container border border-brand-border rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <HistoryIcon />
                                    <h3 className="text-lg font-semibold text-brand-text-primary">Recent Activity</h3>
                                </div>
                                <ul className="space-y-3 text-sm text-brand-text-secondary">
                                    {historyLoading ? (
                                        <p>Loading history...</p>
                                    ) : generationHistory.length > 0 ? (
                                        generationHistory.map(item => (
                                            <li key={item.id} className="truncate">Generated scripts for "{item.topic}"</li>
                                        ))
                                    ) : (
                                        <p>No activity yet.</p>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'calendar' && <CalendarView session={session} />}
        </>
    );
};

// --- Buy Credits Modal ---
const BuyCreditsModal = ({ setShowBuyCreditsModal, session }) => {
    const [loading, setLoading] = useState(false);
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
            console.error("Stripe Checkout Error:", error.message);
            alert(`An error occurred: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-2xl w-full relative">
                <button onClick={() => setShowBuyCreditsModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h3 className="text-3xl font-bold text-center text-brand-text-primary mb-2">Buy More Credits</h3>
                <p className="text-brand-text-secondary text-center mb-8">Choose a pack to continue creating.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creditPacks.map(pack => (
                        <div key={pack.name} className={`bg-brand-background border-2 rounded-lg p-6 text-center ${pack.popular ? 'border-brand-accent' : 'border-brand-border'}`}>
                            <h4 className="text-xl font-bold text-brand-text-primary">{pack.name}</h4>
                            <p className="text-4xl font-extrabold text-brand-accent my-4">{pack.credits}</p>
                            <p className="text-brand-text-secondary mb-6">Credits</p>
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


// --- Main App Component ---
const App = () => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
    const [topic, setTopic] = useState('');

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

    const handleGuestGenerate = () => {
        if (!topic) { alert("Please enter a topic to start."); return; }
        setShowAuthModal(true);
    }

    return (
        <div className="bg-brand-background text-brand-text-secondary min-h-screen font-sans">
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-container border border-brand-border rounded-2xl p-8 max-w-md w-full relative">
                        <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>
                        <h3 className="text-2xl font-bold text-center text-brand-text-primary mb-2">Your Blueprint is Ready!</h3>
                        <p className="text-brand-text-secondary text-center mb-6">Create a free account to view it.</p>
                        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={['google']} theme="dark" />
                    </div>
                </div>
            )}
            
            {showBuyCreditsModal && <BuyCreditsModal setShowBuyCreditsModal={setShowBuyCreditsModal} session={session} />}

            <header className="border-b border-brand-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-brand-text-primary">Viral Script AI</h1>
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-brand-text-secondary">Credits: <span className="font-bold text-brand-text-primary">{profileLoading ? '...' : (profile ? profile.credits : 0)}</span></span>
                            <button onClick={async () => await supabase.auth.signOut()} className="bg-brand-container hover:bg-gray-700 text-brand-text-primary font-semibold py-2 px-4 rounded-lg text-sm border border-brand-border">Logout</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuthModal(true)} className="bg-brand-accent hover:opacity-90 text-black font-bold py-2 px-4 rounded-lg">Login / Sign Up</button>
                    )}
                </div>
            </header>

            <main>
                {session ? (
                    <Dashboard session={session} profile={profile} setProfile={setProfile} setShowBuyCreditsModal={setShowBuyCreditsModal} />
                ) : (
                    <div className="text-center py-20 px-4">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-brand-text-primary">Stop Guessing. Start Going Viral.</h1>
                        <p className="text-xl text-brand-text-secondary max-w-3xl mx-auto mt-6 mb-10">Generate a complete viral video blueprint—from hooks to hashtags—in seconds.</p>
                        <div className="max-w-2xl mx-auto">
                           <div className="flex flex-col sm:flex-row gap-2">
                                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a topic to get started..." className="w-full bg-brand-container border border-brand-border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                                <button onClick={handleGuestGenerate} className="bg-brand-accent hover:opacity-90 text-black font-bold py-3 px-6 rounded-lg whitespace-nowrap">Generate Free Blueprint</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
