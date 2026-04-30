import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { evaluatorPrompt } from '../../../../prompts/evaluator';
import { interviewerPrompt } from '../../../../prompts/interviewer';
import { coachPrompt } from '../../../../prompts/coach';

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      role, 
      background, 
      focusArea, 
      history, // Array of { role: 'user' | 'assistant', content: string }
      evaluatorNotesHistory, // Array of parsed JSON notes
      turn 
    } = body;

    // Get the latest user message
    const userMessage = history[history.length - 1]?.content || "";

    // 1. Evaluator Agent (Shadow Agent)
    // Runs after every user turn to analyze the response
    let evaluatorNotes = null;
    let newEvaluatorNotesHistory = [...(evaluatorNotesHistory || [])];

    if (userMessage) {
      const evalPrompt = evaluatorPrompt
        .replace('{role}', role || 'Software Engineer')
        .replace('{background}', background || 'None')
        .replace('{focusArea}', focusArea || 'General');

      const evalContext = `
Conversation History:
${history.map((h: any) => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n')}

Candidate's Latest Response:
${userMessage}
`;
      const evalResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: evalPrompt + '\n\n' + evalContext }] }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      try {
        if (evalResponse.text) {
          evaluatorNotes = JSON.parse(evalResponse.text);
          newEvaluatorNotesHistory.push(evaluatorNotes);
        }
      } catch (e) {
        console.error("Failed to parse evaluator JSON:", e);
      }
    }

    // 2. Determine Phase: Interview or Feedback
    if (turn >= 7) {
      // Coach Agent Phase
      const cPrompt = coachPrompt
        .replace('{role}', role || 'Software Engineer')
        .replace('{background}', background || 'None')
        .replace('{focusArea}', focusArea || 'General');

      const coachContext = `
Complete Interview Transcript:
${history.map((h: any) => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n')}

Consolidated Evaluator Notes (Hidden Shadow Assessments):
${JSON.stringify(newEvaluatorNotesHistory, null, 2)}
`;
      
      const coachResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: cPrompt + '\n\n' + coachContext }] }
        ]
      });

      return NextResponse.json({
        type: 'feedback',
        content: coachResponse.text,
        evaluatorNotes,
        evaluatorNotesHistory: newEvaluatorNotesHistory
      });

    } else {
      // Interviewer Agent Phase
      const intPrompt = interviewerPrompt
        .replace('{role}', role || 'Software Engineer')
        .replace('{background}', background || 'None')
        .replace('{focusArea}', focusArea || 'General');

      const interviewContext = `
Evaluator Notes on latest response (Shadow Agent Assessment):
${evaluatorNotes ? JSON.stringify(evaluatorNotes, null, 2) : 'No notes available yet (start of interview).'}

Please generate your next response/question for the Candidate. Keep it concise.
`;

      // Build Gemini history
      const geminiHistory = history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));

      // Start chat with history
      const chat = ai.chats.create({
        model: modelName,
        config: {
          systemInstruction: intPrompt
        },
        history: geminiHistory.slice(0, -1) // Exclude the latest user message as we send it below
      });

      // Send the latest user message along with the hidden evaluator notes
      const promptToInterviewer = `
Candidate says: "${userMessage}"

${interviewContext}
`;
      const interviewResponse = await chat.sendMessage({
        message: userMessage ? promptToInterviewer : 'Start the interview.'
      });

      return NextResponse.json({
        type: 'interview',
        content: interviewResponse.text,
        evaluatorNotes,
        evaluatorNotesHistory: newEvaluatorNotesHistory
      });
    }

  } catch (error: any) {
    console.error("Orchestrator error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
