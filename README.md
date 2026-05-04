# PrepWise: A Multi-Agent Orchestration Case Study

![PrepWise Demo](./public/demo.webp)

This repository contains the source code for an adaptive, AI-driven Mock Interview Assistant. Rather than relying on a generic conversational loop, this project implements a **Multi-Agent Orchestration architecture** designed to simulate a rigorous, adaptive, and context-aware technical interview.

The primary objective of this project was to design a system that dynamically adjusts its questioning difficulty based on real-time candidate evaluation, enforcing a "tough but fair" interview standard.

## 🛠️ The Tech Stack

- **Framework:** Next.js 14+ (App Router) for serverless execution and seamless full-stack integration.
- **Frontend:** React, Tailwind CSS v4, Shadcn/UI, and Framer Motion for a fluid, high-performance UI.
- **AI Integration:** Google Generative AI SDK (`@google/genai`) utilizing the `gemini-2.5-flash` model for low-latency inference.

---

## 🏛️ Architecture & Data Flow

The system employs a multi-agent workflow executed within a serverless Next.js API route (`/api/orchestrator`). The execution flow is bifurcated between silent evaluation and conversational generation.

### Text-Based Architecture Diagram

```text
[ Client (React State) ]
       │
       │ (1) User Input + Conversation History + Shadow State
       ▼
[ Next.js API Route (Stateless Orchestrator) ]
       │
       ├─► [ Agent 1: The Evaluator (Shadow Agent) ]
       │      └─► Analyzes response -> Returns Structured JSON (Strengths, Gaps, Vagueness)
       │
       ├─► [ Agent 2: The Interviewer ]
       │      └─► Ingests User Input + Evaluator JSON -> Generates Adaptive Response
       │
       ▼
[ Client (React State) ]
       │
       │ (2) Displays Interviewer Response
       │ (3) Appends Evaluator JSON to hidden state buffer
       │
      ... (After N Turns) ...
       │
       ▼
[ Agent 3: The Career Coach ]
       └─► Ingests Full Transcript + Array of Evaluator JSONs -> Generates Markdown Report
```

---

## 🧠 Engineering Decisions: The Logic

### Managing Conversation State via Stateless Execution
The Next.js backend is entirely stateless. To maintain context across the interview, the client manages a dual-state architecture:
1. **Public History:** The standard array of messages (`role`, `content`).
2. **Shadow State (`evaluatorNotesHistory`):** An array of parsed JSON objects containing the Evaluator's hidden assessments for every turn.

By passing the entire conversation context and the shadow state buffer in each POST request, the API route avoids the need for a database lookup or persistent server memory, enabling high concurrency and trivial horizontal scaling.

### Schema Constraints & Data Parsing
To ensure deterministic behavior from the Evaluator agent, the prompt is tightly constrained and the `responseMimeType` is strictly set to `application/json`. The schema mandates the output of a boolean flag (`vagueness_detected`) and a `suggested_follow_up`. This JSON payload is dynamically injected into the Interviewer's prompt template during the same request lifecycle.

---

## ⚡ Performance Optimization & Latency Mitigation

The hardest technical hurdle was minimizing the delay between the user finishing a sentence and the AI responding, given that the architecture requires **two sequential LLM calls** (Evaluator -> Interviewer) per turn.

1. **Model Selection:** The system utilizes `gemini-2.5-flash` specifically to mitigate the latency of sequential calls, trading the heavier parameter footprint of Pro models for sub-second TTFB (Time to First Byte).
2. **Token Optimization:** The Interviewer agent is strictly instructed via its system prompt to remain concise ("1-3 sentences max"). This bounds the output token generation time, significantly reducing overall latency.
3. **Perceived Performance:** To prevent UX degradation during the synchronous double-call, the frontend leverages Framer Motion to immediately render a complex, pulsing "thinking" state. This masks the network latency and provides immediate visual feedback to the user.

---

## 🎯 Prompt Engineering: The "Tough But Fair" Interactor

To prevent the Interviewer from devolving into a generic, overly-agreeable chatbot, the system prompt is engineered with conditional execution branches tied to the Evaluator's JSON output:

- **Vagueness Probing:** If the Evaluator's JSON returns `"vagueness_detected": true`, the Interviewer prompt forces the model to abandon its planned trajectory and probe the specific gap identified in the `suggested_follow_up` node.
- **Graceful Pivoting:** If the candidate explicitly fails a question, the Interviewer is instructed to avoid providing the direct answer, and instead pivot to a foundational concept to establish a baseline.

---

## 🚀 Running the Project Locally

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file and inject your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:3000`.
