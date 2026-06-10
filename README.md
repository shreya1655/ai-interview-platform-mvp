# AI Video Mock Interview Platform

A fast resume-ready MVP built with Next.js.

## Features
- Role + resume based interview setup
- AI-generated interview questions
- Camera preview and answer recording using MediaRecorder
- Manual answer/transcript input
- AI feedback with score, strengths, weaknesses, and improved answer
- Session history stored in browser localStorage
- Works in mock mode if API key is missing

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open: http://localhost:3000

## API Key
Add your OpenAI API key in `.env.local`:

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
```

## Resume bullets
AI Video Mock Interview Platform | Next.js, TypeScript, OpenAI API, WebRTC/MediaRecorder
- Built an AI-powered mock interview platform generating role-specific technical and behavioral questions from resume context.
- Implemented browser-based video recording using MediaRecorder and structured AI feedback with scoring, strengths, gaps, and improved answers.
- Designed session history and performance dashboard to track interview readiness across multiple attempts.
