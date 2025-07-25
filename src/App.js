import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import AbstractCanvas from './AbstractCanvas';
import { useVideoProcessor } from './useVideoProcessor';

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
const PlayIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const VoiceIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-text-secondary"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" fill="currentColor"></path></svg>;
const LightbulbIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22h6M12 18v4M9.31 15.69c.39.39 1.02.39 1.41 0l1.48-1.48c.31-.31.47-.72.47-1.13V12c0-.41-.16-.82-.47-1.13L10.72 9.39c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.5 12l-1.19 1.19c-.38.39-.38 1.03 0 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TikTokIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.38 1.92-3.54 2.96-5.94 2.96-1.97 0-3.82-.65-5.31-1.76-1.23-.9-2.15-2.1-2.7-3.45-.42-1.04-.6-2.18-.6-3.33-.03-1.92.31-3.85.96-5.66.63-1.78 1.6-3.4 2.8-4.74 1.05-1.17 2.31-2.08 3.7-2.66.49-.2.98-.36 1.49-.46.01.82.02 1.64.01 2.46l-.04.64c-.45.12-.88.29-1.3.49-1.94.94-3.36 2.73-3.76 4.75-.18.9-.28 1.84-.28 2.78 0 1.01.17 1.99.52 2.89.59 1.5 1.73 2.5 3.19 2.89.43.11.88.17 1.32.17 1.1 0 2.15-.3 3.09-.89.88-.55 1.5-1.36 1.82-2.34.24-.78.35-1.6.35-2.43.01-2.18.01-4.36.01-6.54 0-.21.05-.42.15-.61.2-.4.5-.68.88-.88.25-.13.5-.25.75-.35.01-.81.01-1.63.02-2.44a4.32 4.32 0 0 1-.25.03c-.8.1-1.55.39-2.2.83-1.09.73-1.85 1.8-2.2 3.02-.13.43-.21.88-.22 1.33-.02 1.47-.01 2.95-.01 4.42 0 .1-.01.2-.02.31.02-1.1.02-2.21.02-3.31z"/></svg>;
const YouTubeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 7.337c-.227-.81-.887-1.469-1.697-1.697C18.267 5.207 12 5.207 12 5.207s-6.267 0-7.885.433c-.81.228-1.47.887-1.697 1.697C2.002 8.954 2 12 2 12s.002 3.046.42 4.663c.227.81.887 1.469 1.697 1.697C5.733 18.793 12 18.793 12 18.793s6.267 0 7.885-.433c.81-.228 1.47-.887 1.697-1.697C21.998 15.046 22 12 22 12s-.002-3.046-.418-4.663zM9.75 14.86V9.14L15.22 12 9.75 14.86z"/></svg>;
const InstagramIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/></svg>;
const UploadIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;

// --- NEW PAGE COMPONENTS ---
const PrivacyPolicyPage = ({ navigate }) => (
    <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <button onClick={() => navigate('home')} className="text-brand-accent mb-8">&larr; Back to Home</button>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-invert text-white/80 space-y-4">
            <p><strong>Last Updated:</strong> July 25, 2025</p>
            <p>Welcome to Viral Script AI ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>
            <h3 className="text-xl font-bold text-white">1. Information We Collect</h3>
            <p>We may collect personal information that you provide to us directly, such as:</p>
            <ul className="list-disc list-inside">
                <li><strong>Account Information:</strong> When you register for an account, we collect your email address and name.</li>
                <li><strong>User Content:</strong> We collect the video topics and ideas you input into our service to generate scripts.</li>
                <li><strong>Payment Information:</strong> When you purchase credits, our third-party payment processor (Stripe) may collect your payment card information. We do not store this information on our servers.</li>
            </ul>
            <h3 className="text-xl font-bold text-white">2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside">
                <li>Provide, operate, and maintain our services.</li>
                <li>Process your transactions and manage your account.</li>
                <li>Improve our AI models and service offerings.</li>
                <li>Communicate with you, including sending service-related emails and responding to your inquiries.</li>
                <li>Prevent fraudulent activity and ensure the security of our platform.</li>
            </ul>
            <h3 className="text-xl font-bold text-white">3. Sharing Your Information</h3>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except in the following circumstances:</p>
            <ul className="list-disc list-inside">
                <li>With service providers who assist us in operating our website and conducting our business (e.g., payment processors, cloud hosting).</li>
                <li>To comply with legal obligations, such as a court order or government request.</li>
                <li>To protect our rights, property, or safety, and that of our users or others.</li>
            </ul>
            <h3 className="text-xl font-bold text-white">4. Data Security</h3>
            <p>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
            <h3 className="text-xl font-bold text-white">5. Your Rights</h3>
            <p>You have the right to access, update, or delete your personal information at any time by logging into your account settings or contacting us directly.</p>
            <h3 className="text-xl font-bold text-white">6. Changes to This Policy</h3>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
            <h3 className="text-xl font-bold text-white">7. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at: contact@viralhookai.com</p>
        </div>
    </div>
);

const TermsOfServicePage = ({ navigate }) => (
    <div className="max-w-4xl mx-auto py-12 px-4 text-white">
        <button onClick={() => navigate('home')} className="text-brand-accent mb-8">&larr; Back to Home</button>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-invert text-white/80 space-y-4">
            <p><strong>Last Updated:</strong> July 25, 2025</p>
            <p>Please read these Terms of Service ("Terms") carefully before using the Viral Script AI website and services ("Service") operated by us.</p>
            <h3 className="text-xl font-bold text-white">1. Acceptance of Terms</h3>
            <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>
            <h3 className="text-xl font-bold text-white">2. Description of Service</h3>
            <p>Viral Script AI provides users with AI-generated video scripts, hooks, and production plans based on user-submitted topics. The Service operates on a credit-based system, where users purchase credits to generate content.</p>
            <h3 className="text-xl font-bold text-white">3. User Accounts</h3>
            <p>You are responsible for safeguarding your account information and for any activities or actions under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
            <h3 className="text-xl font-bold text-white">4. Use of Content</h3>
            <p>You retain ownership of the ideas and topics you submit to the Service. We grant you a worldwide, perpetual, non-exclusive, royalty-free license to use the AI-generated scripts and content for your personal and commercial purposes. You are responsible for ensuring that your use of the generated content complies with all applicable laws and platform policies (e.g., TikTok, YouTube).</p>
            <h3 className="text-xl font-bold text-white">5. Prohibited Uses</h3>
            <p>You agree not to use the Service to generate content that is unlawful, defamatory, hateful, or that infringes on the rights of any third party.</p>
            <h3 className="text-xl font-bold text-white">6. Termination</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <h3 className="text-xl font-bold text-white">7. Disclaimer</h3>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not warrant that the results obtained from the use of the Service will be accurate, reliable, or meet your requirements.</p>
            <h3 className="text-xl font-bold text-white">8. Limitation of Liability</h3>
            <p>In no event shall Viral Script AI, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            <h3 className="text-xl font-bold text-white">9. Governing Law</h3>
            <p>These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.</p>
            <h3 className="text-xl font-bold text-white">10. Contact Us</h3>
            <p>If you have any questions about these Terms, please contact us at: contact@viralhookai.com</p>
        </div>
    </div>
);


// --- Homepage Components ---
const FeatureGridItem = ({ iconUrl, title, children }) => (
    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 text-center transform transition-transform hover:-translate-y-2">
        <img src={iconUrl} alt={`${title} icon`} className="h-20 w-20 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-brand-text-secondary">{children}</p>
    </div>
);

const TestimonialCard = ({ quote, name, title, avatarUrl }) => ( 
    <div className="bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
        <div className="flex text-yellow-400 mb-4">★★★★★</div>
        <p className="text-white italic mb-6 text-lg">"{quote}"</p>
        <div className="flex items-center gap-4">
            <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover" />
            <div>
                <p className="font-bold text-white text-lg">{name}</p>
                <p className="text-brand-text-secondary">{title}</p>
            </div>
        </div>
    </div>
);

const HomePage = ({ setShowAuthModal }) => {
    const [topic, setTopic] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['TikTok']);

    const togglePlatform = (platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    return ( 
        <div className="w-full overflow-hidden relative">
            <AbstractCanvas />
            <div className="relative z-10">
                {/* --- HERO/HEADER SECTION --- */}
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
                    <div className="mt-10 max-w-3xl w-full bg-black/20 border border-white/10 rounded-2xl p-8 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">1. Enter Your Video Idea</h3>
                            <p className="text-white/70 mt-1">Be as specific or as broad as you like. The AI will handle the rest.</p>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., A tutorial on how to make the perfect sourdough bread at home"
                                className="w-full mt-3 bg-black/20 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent h-24 resize-none"
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">2. Select Target Platforms</h3>
                            <p className="text-white/70 mt-1">Choose where you want your video to go viral.</p>
                            <div className="flex gap-4 mt-3 justify-center">
                                <button onClick={() => togglePlatform('TikTok')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('TikTok') ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                    <TikTokIcon /> TikTok
                                </button>
                                <button onClick={() => togglePlatform('YouTube')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('YouTube') ? 'bg-red-500/20 border-red-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                    <YouTubeIcon /> YouTube
                                </button>
                                <button onClick={() => togglePlatform('Instagram')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('Instagram') ? 'bg-pink-500/20 border-pink-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                    <InstagramIcon /> Instagram
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setShowAuthModal(true)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
                            Generate Viral Hooks
                        </button>
                    </div>
                </section>
               
                {/* --- Platforms Section --- */}
                <section className="py-12 bg-black/10">
                    <p className="text-center text-white/50 text-sm font-semibold tracking-widest">WORKS WITH YOUR FAVORITE PLATFORMS</p>
                    <div className="flex justify-center items-center gap-12 mt-4">
                        <p className="text-2xl font-bold text-white">TikTok</p>
                        <p className="text-2xl font-bold text-white">YouTube</p>
                        <p className="text-2xl font-bold text-white">Instagram</p>
                    </div>
                </section>
               
                {/* --- Problem Section --- */}
                <section className="relative py-20 px-4 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30">
                        <img src="/images/abstract-wave-2.png" alt="Abstract Wave" />
                    </div>
                     <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20 transform -translate-x-1/2 translate-y-1/2">
                        <img src="/images/abstract-orb-2.png" alt="Abstract Orb" className="animate-pulse" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto flex items-center gap-8">
                        <div className="w-1/2">
                            <h2 className="text-4xl font-bold text-white mb-6">Are You Tired of Your Videos Getting <span className="text-red-500">Zero Views?</span></h2>
                            <ul className="space-y-4 text-lg text-brand-text-secondary max-w-2xl">
                                <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span><span>Spending hours brainstorming ideas with no results.</span></li>
                                <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span><span>Struggling to write hooks that grab attention.</span></li>
                                <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span><span>Feeling invisible in a sea of other creators.</span></li>
                            </ul>
                        </div>
                        <div className="w-1/2">
                            <img src="/images/problem-character-v2.png" alt="Frustrated creator" className="w-full h-auto" />
                        </div>
                    </div>
                </section>

                {/* --- NEW SOLUTION SECTION --- */}
                <section className="relative py-20 px-4 overflow-hidden">
                    <div className="relative z-10 max-w-4xl mx-auto flex flex-row-reverse items-center gap-8">
                        <div className="w-1/2">
                            <h2 className="text-4xl font-bold text-white mb-6">Now Imagine Turning <span className="text-purple-400">Viewers Into Loyal Followers...</span> Instantly</h2>
                            <p className="text-lg text-brand-text-secondary space-y-4">
                                What if your audience didn't just scroll away... but opted in, got nurtured, and became paying customers? That's the magic of Viral Script AI. It captures interest when it's at its peak-and transforms curious viewers into subscribers who want to hear from you.
                            </p>
                        </div>
                        <div className="w-1/2">
                            <img src="/images/hero-character-v2.png" alt="Confident creator" className="w-full h-auto" />
                        </div>
                    </div>
                </section>

                {/* --- Features Section --- */}
                <section className="py-20 px-4 bg-white/5">
                    <h2 className="text-4xl font-bold text-center text-white mb-12">The <span className="text-green-400">All-In-One Solution</span> for Viral Content</h2>
                    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                        <FeatureGridItem iconUrl="/images/icon-hooks.png" title="AI-Scored Hooks">Don't just get hooks, get hooks scored by our AI for viral potential.</FeatureGridItem>
                        <FeatureGridItem iconUrl="/images/icon-script.png" title="Full AI Scriptwriting">Receive a complete script structured for maximum viewer retention.</FeatureGridItem>
                        <FeatureGridItem iconUrl="/images/icon-plan.png" title="Full Production Plan">Get shot-by-shot visual ideas, audio suggestions, and a hashtag strategy.</FeatureGridItem>
                        <FeatureGridItem iconUrl="/images/icon-voice.png" title="The Director's Cut">Hear your script in your own voice with AI-powered audio previews.</FeatureGridItem>
                        <FeatureGridItem iconUrl="/images/icon-calendar.png" title="Content Calendar">Plan your content and track your past ideas with ease.</FeatureGridItem>
                        <FeatureGridItem iconUrl="/images/icon-tracker.png" title="Performance Tracker">Log your video's performance to unlock personalized AI insights.</FeatureGridItem>
                    </div>
                </section>

                {/* --- Testimonials Section --- */}
                <section className="py-20 px-4">
                    <h2 className="text-4xl font-bold text-center text-white mb-12">Loved by Creators Everywhere</h2>
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                        <TestimonialCard 
                            quote="Viral Script AI has saved me hours of brainstorming every week. The 'Director's Cut' feature is a game-changer for my workflow!" 
                            name="Sarah L." 
                            title="TikTok Creator" 
                            avatarUrl="/images/sarah-avatar.png"
                        />
                        <TestimonialCard 
                            quote="The AI-scored hooks are incredibly accurate. My engagement has gone through the roof since I started using this tool." 
                            name="Mike P." 
                            title="YouTube Shorts Specialist" 
                            avatarUrl="/images/mike-avatar.png"
                        />
                    </div>
                </section>

                {/* --- CTA Section --- */}
                <section className="py-20 px-4 text-center bg-gradient-to-t from-purple-900/50 to-transparent">
                    <h2 className="text-4xl font-bold text-white mb-6">Ready to Go Viral?</h2>
                    <p className="text-lg text-brand-text-secondary max-w-2xl mx-auto mb-8">Stop wasting time and start creating content that gets the attention it deserves. Your first blueprint is on us.</p>
                    <button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">Get Started for Free</button>
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <img src="/images/garanee seal.png" alt="Guarantee Seal" className="h-24 w-24" />
                        <p className="text-white/70">30-Day Money-Back Guarantee</p>
                    </div>
                </section>
            </div>
        </div>
    );
};


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

// --- AI Coach Insights Component ---
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

    const userInitial = session.user.email ? session.user.email.charAt(0).toUpperCase() : '?';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">{userInitial}</div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">Creator's Command Center</h2>
                                <p className="text-white/70 mt-1">Welcome back, {session.user.email.split('@')[0]}!</p>
                            </div>
                        </div>
                       
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">1. Enter Your Video Idea</h3>
                                <p className="text-white/70 mt-1">Be as specific or as broad as you like. The AI will handle the rest.</p>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., A tutorial on how to make the perfect sourdough bread at home"
                                    className="w-full mt-3 bg-black/20 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent h-24 resize-none"
                                />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white">2. Select Target Platforms</h3>
                                <p className="text-white/70 mt-1">Choose where you want your video to go viral.</p>
                                <div className="flex gap-4 mt-3">
                                    <button onClick={() => togglePlatform('TikTok')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('TikTok') ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                        <TikTokIcon /> TikTok
                                    </button>
                                    <button onClick={() => togglePlatform('YouTube')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('YouTube') ? 'bg-red-500/20 border-red-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                        <YouTubeIcon /> YouTube
                                    </button>
                                    <button onClick={() => togglePlatform('Instagram')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${selectedPlatforms.includes('Instagram') ? 'bg-pink-500/20 border-pink-400 text-white' : 'bg-white/10 border-transparent text-white/70 hover:bg-white/20'}`}>
                                        <InstagramIcon /> Instagram
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105">
                                {isLoading && <LoadingSpinner />}
                                {isLoading ? 'Generating...' : 'Generate Viral Hooks'}
                            </button>
                        </div>
                    </div>
                    {isLoading && <SkeletonLoader />}
                    {generatedContent && <ResultsDisplay content={generatedContent} session={session} voiceProfile={voiceProfile} onPerformanceSaved={handlePerformanceSaved} />}
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white">Next Scheduled Post</h3>
                        <p className="text-white/70 mt-2">You have no upcoming posts scheduled.</p>
                        <button className="text-brand-accent font-semibold mt-2">Generate a new script to get started &rarr;</button>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">🔥 Top Trend Today</h3>
                        <h4 className="font-semibold text-white mt-4">Plot Twists, Power Moves & Awkward Audio</h4>
                        <p className="text-white/70 mt-2 text-sm">This trend features videos with unexpected turns, clever misdirections, and punchline payoffs, often using awkward or "cringe" audio for humorous effect. Popular audio includes "Lion's Roar" and "Alibi."</p>
                        <button className="text-brand-accent font-semibold mt-2">Generate ideas for this trend &rarr;</button>
                    </div>
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

// --- NEW: Dynamic Loader Component ---
const DynamicLoader = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const loadingSteps = [
      "Preparing your video for analysis...",
      "Uploading to our secure AI environment...",
      "Analyzing the first 3 seconds for a strong hook...",
      "Evaluating pacing, edits, and overall flow...",
      "Checking audio quality and use of trends...",
      "Assessing the call to action for engagement...",
      "Compiling your detailed virality report...",
      "Just a few more moments...",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prevStep => {
                if (prevStep < loadingSteps.length - 1) {
                    return prevStep + 1;
                }
                return prevStep;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, [loadingSteps.length]); // ESLint FIX: Added dependency

    return (
        <div className="flex flex-col items-center justify-center h-full text-white/70 space-y-6">
            <div className="relative w-20 h-20">
                <div className="w-full h-full border-4 border-white/10 rounded-full"></div>
                <div className="w-full h-full border-4 border-brand-accent border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="h-10 flex items-center justify-center">
                <p key={currentStep} className="text-lg text-white/90 font-semibold animate-fade-in">
                    {loadingSteps[currentStep]}
                </p>
            </div>
            <p className="text-sm text-white/50">Your video is in good hands. This process ensures a thorough analysis.</p>
        </div>
    );
};


// --- NEW: ViralVideoAnalyzer Component ---
const ViralVideoAnalyzer = ({ session, profile, setProfile, setShowBuyCreditsModal, addToast }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const { extractFrames } = useVideoProcessor();
    const dropzoneRef = useRef(null);

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
            setAnalysisResult(null);
        } else {
            addToast('Please upload a valid video file.', 'error');
        }
    };
    
    const handleManualDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    const handleManualDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleAnalyze = async () => {
        if (!videoFile) {
            addToast('Please upload a video first.', 'error');
            return;
        }
        if (!profile || profile.credits < 1) {
            setShowBuyCreditsModal(true);
            return;
        }

        setIsLoading(true);
        setAnalysisResult(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits - 1 })
                .eq('id', session.user.id);

            if (updateError) throw updateError;
            setProfile(prev => ({ ...prev, credits: prev.credits - 1 }));

            const frames = await extractFrames(videoFile, 10);
            if (frames.length === 0) {
                throw new Error("Could not extract frames from the video.");
            }

            const response = await fetch('/.netlify/functions/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frames }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Analysis failed.');
            }

            const data = await response.json();
            setAnalysisResult(data);
            addToast('Analysis complete!', 'success');

        } catch (err) {
            addToast(err.message, 'error');
            // Refund credit if analysis failed after deduction
            const { error: refundError } = await supabase
                .from('profiles')
                .update({ credits: profile.credits })
                .eq('id', session.user.id);
            if (!refundError) {
                 setProfile(prev => ({ ...prev, credits: prev.credits + 1 }));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const ScoreCircle = ({ score }) => {
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (score / 100) * circumference;
        let strokeColor = 'stroke-purple-400';
        if (score < 40) strokeColor = 'stroke-red-400';
        else if (score < 75) strokeColor = 'stroke-yellow-400';
        else strokeColor = 'stroke-green-400';

        return (
            <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle className="stroke-current text-white/10" strokeWidth="8" fill="transparent" r="52" cx="60" cy="60" />
                    <circle className={`stroke-current ${strokeColor} transition-all duration-1000 ease-out`} strokeWidth="8" strokeLinecap="round" fill="transparent" r="52" cx="60" cy="60" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} transform="rotate(-90 60 60)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{score}</span>
                    <span className="text-sm font-medium text-white/70">Virality Score</span>
                </div>
            </div>
        );
    };

    const MetricMeter = ({ label, score }) => {
        const percentage = score * 10;
        return (
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white/80">{label}</span>
                    <span className="text-sm font-bold text-white">{score}/10</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                    <div className="bg-brand-accent h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white">Viral Video Deep Dive</h2>
                <p className="text-white/70 mt-1 mb-6">Get a granular analysis of your video's viral potential.</p>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    {/* --- Left Column: Upload & Preview --- */}
                    <div className="lg:col-span-2 space-y-4">
                        <label
                            htmlFor="video-upload-input"
                            ref={dropzoneRef}
                            onDrop={handleManualDrop}
                            onDragOver={handleManualDragOver}
                            className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer transition-colors hover:border-brand-accent hover:bg-brand-accent/10 flex flex-col items-center justify-center h-48"
                        >
                            <UploadIcon />
                            <p className="mt-2 text-white font-semibold">Drag & drop video or click to upload</p>
                            <p className="text-xs text-white/50 mt-1">MP4, MOV, WEBM</p>
                        </label>
                        <input id="video-upload-input" type="file" className="hidden" accept="video/*" onChange={(e) => handleFileSelect(e.target.files[0])} />

                        {videoUrl && (
                            <div className="space-y-4">
                                <video src={videoUrl} controls className="w-full rounded-lg" />
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <LoadingSpinner /> : 'Analyze Video (1 Credit)'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- Right Column: Analysis Results --- */}
                    <div className="lg:col-span-3 bg-black/20 border border-white/10 rounded-2xl p-6 min-h-[300px]">
                        <h3 className="text-xl font-bold text-white mb-4">AI Analysis</h3>
                        {isLoading ? (
                            <DynamicLoader />
                        ) : analysisResult ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <ScoreCircle score={analysisResult.virality_score} />
                                    </div>
                                    <div className="space-y-4">
                                        <MetricMeter label="Hook Strength" score={analysisResult.key_metrics.hook_strength} />
                                        <MetricMeter label="Visual Clarity" score={analysisResult.key_metrics.visual_clarity} />
                                        <MetricMeter label="Engagement Potential" score={analysisResult.key_metrics.engagement_potential} />
                                    </div>
                                </div>
                                
                                <p className="text-sm text-white/80 italic text-center bg-white/5 p-3 rounded-md">{analysisResult.analysis_summary}</p>

                                {analysisResult.detailed_breakdown.map((item, i) => (
                                    <div key={i}>
                                        <h4 className="font-semibold text-white mb-1">{item.area}</h4>
                                        <p className="text-sm text-white/70 mb-2">{item.feedback}</p>
                                        <p className="text-sm text-brand-accent bg-brand-accent/10 p-2 rounded-md"><strong>Suggestion:</strong> {item.suggestion}</p>
                                    </div>
                                ))}

                                <div>
                                    <h4 className="font-semibold text-white mb-2">Creative Suggestions</h4>
                                    <div className="space-y-3 text-sm">
                                        <p><strong className="text-purple-300">Alternative Hooks:</strong> "{analysisResult.creative_suggestions.alternative_hooks[0]}", "{analysisResult.creative_suggestions.alternative_hooks[1]}"</p>
                                        <p><strong className="text-purple-300">Thumbnail Text:</strong> {analysisResult.creative_suggestions.thumbnail_text}</p>
                                        <p><strong className="text-purple-300">Audio Suggestion:</strong> {analysisResult.creative_suggestions.audio_suggestion}</p>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/50"><p>Your analysis will appear here.</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
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
                <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
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
