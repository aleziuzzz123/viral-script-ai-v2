import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // We'll create this CSS file next

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-headline">Stop Guessing. Start Going Viral.</h1>
          <p className="hero-subheadline">
            Generate proven, high-impact video hooks and scripts in seconds.
            Transform your ideas into content that captivates and converts.
          </p>
          <button onClick={() => navigate('/app')} className="hero-cta">
            Generate Your First Script For Free
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;