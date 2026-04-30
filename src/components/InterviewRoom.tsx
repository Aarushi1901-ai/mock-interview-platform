'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InterviewRoomProps {
  config: { role: string; background: string; focusArea: string };
  onFinish: (feedback: string) => void;
}

export function InterviewRoom({ config, onFinish }: InterviewRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turn, setTurn] = useState(0);
  const [evaluatorNotesHistory, setEvaluatorNotesHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const MAX_TURNS = 7;

  useEffect(() => {
    // Start the interview automatically
    if (messages.length === 0 && !isLoading) {
      sendMessage('');
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (overrideMessage?: string) => {
    const userMessage = overrideMessage !== undefined ? overrideMessage : inputValue.trim();
    if (!userMessage && messages.length > 0) return; // Allow empty first message to trigger the bot
    
    setInputValue('');
    setIsLoading(true);

    const newMessages = userMessage 
      ? [...messages, { role: 'user' as const, content: userMessage }]
      : messages;

    if (userMessage) {
      setMessages(newMessages);
    }

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          history: newMessages,
          turn,
          evaluatorNotesHistory
        }),
      });

      const data = await res.json();
      
      if (data.evaluatorNotesHistory) {
        setEvaluatorNotesHistory(data.evaluatorNotesHistory);
      }

      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}. Please check your API key.` }]);
        return;
      }

      if (data.type === 'feedback') {
        onFinish(data.content);
        return;
      }

      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
      setTurn(turn + 1);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const progressPercentage = (turn / MAX_TURNS) * 100;

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 glassmorphism z-10">
        <div>
          <h1 className="text-xl font-semibold">Mock Interview</h1>
          <p className="text-sm text-muted-foreground">{config.role} • {config.focusArea}</p>
        </div>
        <div className="flex flex-col items-end gap-2 w-48">
          <span className="text-sm text-muted-foreground font-medium">Question {Math.min(turn, MAX_TURNS)} / {MAX_TURNS}</span>
          <Progress value={progressPercentage} className="h-2 w-full bg-black/20" />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 z-10" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                {msg.role === 'assistant' ? (
                  <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary">
                    <Bot size={20} />
                  </div>
                ) : (
                  <div className="h-full w-full bg-secondary flex items-center justify-center text-secondary-foreground">
                    <User size={20} />
                  </div>
                )}
              </Avatar>
              
              <div className={`p-4 rounded-2xl max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-card border border-white/10 rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {/* Thinking State */}
          {isLoading && messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 shrink-0 relative z-10">
                  <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary">
                    <Bot size={20} />
                  </div>
                </Avatar>
                {/* Pulsing effect */}
                <motion.div 
                  className="absolute inset-0 rounded-full bg-primary/40 z-0"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="p-4 rounded-2xl bg-card border border-white/10 rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-white/10 z-10">
        <div className="max-w-3xl mx-auto relative flex items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Interviewer is typing..." : "Type your answer..."}
            disabled={isLoading}
            className="pr-12 py-6 rounded-xl bg-black/40 border-white/10 focus-visible:ring-primary/50 text-base shadow-inner"
          />
          <Button 
            size="icon" 
            className="absolute right-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 transition-transform active:scale-95 disabled:opacity-50"
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Press Enter to send. The Evaluator agent is analyzing your responses silently.
        </p>
      </div>
    </div>
  );
}
