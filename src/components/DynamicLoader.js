import React, { useState, useEffect } from 'react';

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

const DynamicLoader = () => {
    const [currentStep, setCurrentStep] = useState(0);

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
    }, []);

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

export default DynamicLoader;
