import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useVideoProcessor } from '../useVideoProcessor';

// --- SVG Icons ---
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const UploadIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 mx-auto mb-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;

// --- Dynamic Loader Component ---
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
    }, [loadingSteps.length]);

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


// --- Main ViralVideoAnalyzer Component ---
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

export default ViralVideoAnalyzer;
