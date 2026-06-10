"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CircleStop,
  Mic,
  MicOff,
  Play,
  Sparkles,
  Trash2,
  Video
} from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}



type HistoryItem = {
  id: string;
  date: string;
  role: string;
  question: string;
  answer: string;
  feedback: string;
  score?: number | null;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [role, setRole] = useState("SDE Intern");
  const [level, setLevel] = useState("Intern");
  const [resume, setResume] = useState("");
  const [question, setQuestion] = useState("");
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ai-interview-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  function saveHistory(items: HistoryItem[]) {
    setHistory(items);
    localStorage.setItem("ai-interview-history", JSON.stringify(items));
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch {
      alert("Camera/mic permission denied. You can still type your answer manually.");
    }
  }

  function startRecording() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) {
      alert("Start camera first.");
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    };

    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function startTranscription() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Voice transcription is not supported in this browser. Please test the app in Google Chrome."
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-IN";

  const existingAnswer = answer.trim();

  recognition.onresult = (event: any) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = 0; i < event.results.length; i++) {
      const spokenText = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += spokenText + " ";
      } else {
        interimTranscript += spokenText;
      }
    }

    const completeText = [
      existingAnswer,
      finalTranscript.trim(),
      interimTranscript.trim()
    ]
      .filter(Boolean)
      .join(" ");

    setAnswer(completeText);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech-recognition error:", event.error);
    setListening(false);
    alert("Voice transcription stopped. Please try again in Google Chrome.");
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.start();
  recognitionRef.current = recognition;
  setListening(true);
}

function stopTranscription() {
  recognitionRef.current?.stop();
  recognitionRef.current = null;
  setListening(false);
}

  async function generateQuestion() {
    setLoadingQuestion(true);
    setFeedback("");
    setScore(null);

    try {
      const res = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, resume, previousQuestions })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate question");

      setQuestion(data.question);
      setPreviousQuestions((prev) => [...prev, data.question]);
      setAnswer("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function getFeedback() {
    if (!question || !answer.trim()) {
      alert("Generate a question and write/paste your answer first.");
      return;
    }

    setLoadingFeedback(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, question, answer })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate feedback");

      setFeedback(data.feedback);
      setScore(data.score ?? null);

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleString(),
        role,
        question,
        answer,
        feedback: data.feedback,
        score: data.score ?? null
      };

      saveHistory([newItem, ...history].slice(0, 10));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingFeedback(false);
    }
  }

  function clearHistory() {
    saveHistory([]);
  }

  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div>
            <div className="badge">AI + Video + Full Stack Project</div>
            <h1>AI Video Mock Interview Platform</h1>
            <p className="subtitle">
              Practice role-specific interviews, record your answer, and get AI feedback on
              clarity, structure, technical depth, and improvement areas.
            </p>
          </div>
          <div className="score">{score ?? "--"}</div>
        </div>

        <div className="grid">
          <section className="card">
            <h2>1. Interview Setup</h2>

            <label className="label">Target Role</label>
            <input
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="SDE Intern, AI Intern, Data Analyst..."
            />

            <label className="label">Level</label>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Intern</option>
              <option>Entry Level</option>
              <option>Intermediate</option>
            </select>

          <label className="label">Resume / Project Context</label>
<textarea
  className="textarea"
  value={resume}
  onChange={(e) => setResume(e.target.value)}
  placeholder="Paste your resume points or project details here. Example: Stock exchange simulator, React, Express, Socket.IO..."
/>

            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={generateQuestion} disabled={loadingQuestion}>
                <Sparkles size={17} /> {loadingQuestion ? "Generating..." : "Generate Question"}
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setPreviousQuestions([]);
                  setQuestion("");
                  setAnswer("");
                  setFeedback("");
                  setScore(null);
                }}
              >
                Reset
              </button>
            </div>

            <p className="small">
              Tip: Paste 3–5 resume bullets. The questions will become much more personalized.
            </p>

            <h2 style={{ marginTop: 24 }}>2. Camera Recording</h2>

            <div className="videoBox">
              <video ref={videoRef} autoPlay muted playsInline />
            </div>

            <div className="row">
              <button className="btn secondary" onClick={startCamera}>
                <Camera size={17} /> Start Camera
              </button>

              {!recording ? (
                <button className="btn success" onClick={startRecording} disabled={!cameraReady}>
                  <Video size={17} /> Record
                </button>
              ) : (
                <button className="btn danger" onClick={stopRecording}>
                  <CircleStop size={17} /> Stop
                </button>
              )}
            </div>

            {videoUrl && (
              <>
                <p className="small">Recorded answer preview:</p>
                <div className="videoBox">
                  <video src={videoUrl} controls />
                </div>
              </>
            )}
          </section>

          <section className="card">
            <h2>3. Interview Question</h2>

            {question ? (
              <div className="question">{question}</div>
            ) : (
              <p className="small">Click “Generate Question” to start your interview.</p>
            )}

            <label className="label">Your Answer / Transcript</label>

<textarea
  className="textarea"
  value={answer}
  onChange={(e) => setAnswer(e.target.value)}
  placeholder="Click Start Voice Transcription and speak your answer. You can also edit the generated text manually."
  style={{ minHeight: 180 }}
/>

<div className="row" style={{ marginTop: 10 }}>
  {!listening ? (
    <button className="btn secondary" onClick={startTranscription}>
      <Mic size={17} /> Start Voice Transcription
    </button>
  ) : (
    <button className="btn danger" onClick={stopTranscription}>
      <MicOff size={17} /> Stop Transcription
    </button>
  )}

  <span className="small">
    Your spoken answer will appear automatically in the text box.
  </span>
</div>

<div className="row" style={{ marginTop: 14 }}>
  <button className="btn" onClick={getFeedback} disabled={loadingFeedback}>
    <Play size={17} /> {loadingFeedback ? "Evaluating..." : "Get AI Feedback"}
  </button>
</div>

            <h2 style={{ marginTop: 24 }}>4. Feedback</h2>
            {feedback ? (
              <div className="feedback">{feedback}</div>
            ) : (
              <p className="small">Your feedback will appear here after evaluation.</p>
            )}
          </section>
        </div>

        <section className="card" style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Session History</h2>
            <button className="btn secondary" onClick={clearHistory}>
              <Trash2 size={17} /> Clear
            </button>
          </div>

          {history.length === 0 ? (
            <p className="small">No sessions yet.</p>
          ) : (
            history.map((item) => (
              <div className="historyItem" key={item.id}>
                <b>{item.role}</b> · <span className="small">{item.date}</span>
                <p><b>Q:</b> {item.question}</p>
                <p className="small"><b>Score:</b> {item.score ?? "N/A"}/10</p>
              </div>
            ))
          )}
        </section>

        <p className="footer">
Built with Next.js, TypeScript, Gemini API, browser MediaRecorder, and Web Speech API.        </p>
      </div>
    </main>
  );
}
