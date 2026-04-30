'use client';

import { useState } from 'react';
import { SetupForm } from '@/components/SetupForm';
import { InterviewRoom } from '@/components/InterviewRoom';
import { FeedbackDashboard } from '@/components/FeedbackDashboard';

type AppState = 'setup' | 'interview' | 'feedback';

interface InterviewConfig {
  role: string;
  background: string;
  focusArea: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [feedback, setFeedback] = useState<string>('');

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setAppState('interview');
  };

  const handleFinish = (finalFeedback: string) => {
    setFeedback(finalFeedback);
    setAppState('feedback');
  };

  const handleRestart = () => {
    setAppState('setup');
    setConfig(null);
    setFeedback('');
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {appState === 'setup' && <SetupForm onStart={handleStart} />}
      {appState === 'interview' && config && (
        <InterviewRoom config={config} onFinish={handleFinish} />
      )}
      {appState === 'feedback' && (
        <FeedbackDashboard feedback={feedback} onRestart={handleRestart} />
      )}
    </main>
  );
}
