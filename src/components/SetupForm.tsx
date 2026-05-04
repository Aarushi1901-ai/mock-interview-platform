'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SetupFormProps {
  onStart: (config: { role: string; background: string; focusArea: string }) => void;
}

export function SetupForm({ onStart }: SetupFormProps) {
  const [role, setRole] = useState('Frontend Developer');
  const [background, setBackground] = useState('3 years working with React and Next.js, familiar with Tailwind.');
  const [focusArea, setFocusArea] = useState('System Design and React Performance');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ role, background, focusArea });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-lg glassmorphism border-white/10 shadow-2xl z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">PrepWise Mock Interview</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Configure your mock interview session.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Target Role</Label>
              <Input 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                placeholder="e.g. Senior Frontend Engineer"
                className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background">Your Background / Resume Summary</Label>
              <Textarea 
                id="background" 
                value={background} 
                onChange={(e) => setBackground(e.target.value)} 
                placeholder="Briefly describe your experience..."
                className="bg-black/20 border-white/10 focus-visible:ring-primary/50 min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focusArea">Focus Area</Label>
              <Input 
                id="focusArea" 
                value={focusArea} 
                onChange={(e) => setFocusArea(e.target.value)} 
                placeholder="e.g. System Design, Algorithms, Behavioral"
                className="bg-black/20 border-white/10 focus-visible:ring-primary/50"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 text-lg">
              Start Interview
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
