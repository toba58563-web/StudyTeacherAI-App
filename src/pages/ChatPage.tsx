import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { Send, Bot, User, Loader2, Sparkles, Image as ImageIcon, LayoutList, CheckSquare, Mic, MicOff, Volume2, Square, SquarePlay, Pause, Play, Brain, X, MessageSquare, Clock, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../components/AuthProvider";
import { incrementUserProgress } from "../lib/progress";
import { db } from "../lib/firebase";
import { collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp, getDoc } from "firebase/firestore";

interface Message {
  role: "user" | "teacher";
  content: string;
  mode?: "standard" | "english";
}

interface ChatSession {
  id: string;
  subjectId: string;
  startedAt: Timestamp;
  lastMessageAt: Timestamp;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { subjectId } = useParams();
  const [isEnglishMode, setIsEnglishMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "teacher",
      content: `Hello! I am your AI Teacher${subjectId ? ` for ${subjectId}` : ""}. What would you like to learn today? I can explain concepts, provide examples, generate quizzes, or help you make notes.`,
      mode: "standard"
    },
    {
      role: "teacher",
      content: `Hello! I am your English Coach AI. Let's practice English!`,
      mode: "english"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const activeSpeakIdRef = useRef<number | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "chats"),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const history: ChatSession[] = [];
      snapshot.forEach((docSnap) => {
        history.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
      });
      setChatHistory(history);
    }, (error) => {
      console.warn("Error fetching chat history:", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN'; // Changed to en-IN. hi-IN also works well.

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
         setIsListening(false);
      };
    }
    
    return () => {
       window.speechSynthesis.cancel();
       if (audioSourceRef.current) {
           audioSourceRef.current.stop();
           audioSourceRef.current = null;
       }
       if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListen = () => {
     if (isListening) {
         recognitionRef.current?.stop();
         setIsListening(false);
     } else {
         setInput("");
         recognitionRef.current?.start();
         setIsListening(true);
     }
  };

  const handleSpeakClick = (content: string, index: number) => {
      const selectedText = window.getSelection()?.toString().trim();
      handleSpeak(selectedText || content, index);
  };

  const handleSpeak = async (text: string, index: number) => {
      stopSpeaking();
      setIsPlayingId(index);
      
      const currentSpeakId = Date.now();
      activeSpeakIdRef.current = currentSpeakId;
      
      const abortController = new AbortController();
      ttsAbortControllerRef.current = abortController;
      
      try {
          const response = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, voice: "Kore" }),
              signal: abortController.signal
          });
          const data = await response.json();
          
          if (activeSpeakIdRef.current !== currentSpeakId) return; // Aborted
          
          if (!response.ok) throw new Error(data.error || "Failed to generate audio");
          
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const audioCtx = audioContextRef.current;
          if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
          }

          const binaryString = atob(data.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }

          const float32Array = new Float32Array(bytes.length / 2);
          for (let i = 0; i < bytes.length; i += 2) {
              const int = bytes[i] | (bytes[i + 1] << 8);
              const signed = int >= 0x8000 ? int - 0x10000 : int;
              float32Array[i / 2] = signed / 0x8000;
          }

          const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
          buffer.copyToChannel(float32Array, 0);

          if (activeSpeakIdRef.current !== currentSpeakId) return; // Aborted during processing

          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.onended = () => {
              if (activeSpeakIdRef.current === currentSpeakId) {
                  setIsPlayingId(null);
                  audioSourceRef.current = null;
                  activeSpeakIdRef.current = null;
              }
          };
          source.start();
          audioSourceRef.current = source;
          
      } catch (err: any) {
          if (err.name === 'AbortError') return;
          if (activeSpeakIdRef.current !== currentSpeakId) return;
          
          console.error("TTS Error:", err.message);
          setIsPlayingId(null);
          // Fallback to basic window.speechSynthesis if Gemini API fails
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => {
              if (activeSpeakIdRef.current === currentSpeakId) setIsPlayingId(null);
          };
          window.speechSynthesis.speak(utterance);
      }
  };

  const stopSpeaking = () => {
      window.speechSynthesis.cancel();
      if (ttsAbortControllerRef.current) {
          ttsAbortControllerRef.current.abort();
          ttsAbortControllerRef.current = null;
      }
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
      }
      activeSpeakIdRef.current = null;
      setIsPlayingId(null);
  };
  
  const loadSession = async (session: ChatSession) => {
      if (!user) return;
      setSessionId(session.id);
      setIsSidebarOpen(false);
      
      try {
        const docRef = doc(db, "users", user.uid, "chats", session.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setMessages(docSnap.data().messages || []);
        }
      } catch (err) {
        console.error("Error loading session:", err);
      }
  };
  
  const startNewSession = () => {
      setSessionId(null);
      setMessages([
        {
          role: "teacher",
          content: `Hello! I am your AI Teacher${subjectId ? ` for ${subjectId}` : ""}. What would you like to learn today?`,
          mode: "standard"
        },
        {
          role: "teacher",
          content: `Hello! I am your English Coach AI. Let's practice English!`,
          mode: "english"
        }
      ]);
      setIsSidebarOpen(false);
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string, actionType?: string) => {
    if (e) e.preventDefault();
    const userMsg = customPrompt || input.trim();
    if (!userMsg || isLoading) return;

    if (!customPrompt) setInput("");
    
    const newMessagesUser = [...messages, { role: "user", content: userMsg, mode: isEnglishMode ? "english" : "standard" }];
    setMessages(newMessagesUser as Message[]);
    setIsLoading(true);

    let currentSessionId = sessionId;

    try {
      if (user) {
         if (actionType === 'quiz') {
            await incrementUserProgress(user.uid, 'quizzesCompleted', 20);
         } else {
            await incrementUserProgress(user.uid, 'questionsAsked', 10);
         }
         
         if (!currentSessionId) {
             const docRef = await addDoc(collection(db, "users", user.uid, "chats"), {
                 subjectId: subjectId || "General",
                 startedAt: serverTimestamp(),
                 lastMessageAt: serverTimestamp(),
                 messages: newMessagesUser
             });
             currentSessionId = docRef.id;
             setSessionId(currentSessionId);
         } else {
             await updateDoc(doc(db, "users", user.uid, "chats", currentSessionId), {
                 messages: newMessagesUser,
                 lastMessageAt: serverTimestamp()
             });
         }
      }

      const filteredHistory = messages.filter(msg => (msg.mode || "standard") === (isEnglishMode ? "english" : "standard"));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: filteredHistory, context: subjectId, isEnglishMode }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to get response");
      }
      
      const newMessagesAI = [...newMessagesUser, { role: "teacher", content: data.text, mode: isEnglishMode ? "english" : "standard" }];
      setMessages(newMessagesAI as Message[]);
      
      if (user && currentSessionId) {
         await updateDoc(doc(db, "users", user.uid, "chats", currentSessionId), {
             messages: newMessagesAI,
             lastMessageAt: serverTimestamp()
         });
      }
      
    } catch (error: any) {
      console.warn("Chat error:", error.message);
      setMessages((prev) => [...prev, { role: "teacher", content: "Sorry, I am having trouble connecting to my knowledge base (" + error.message + "). Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full bg-white dark:bg-slate-900 shadow-xl md:rounded-t-3xl border-t border-x border-gray-200 dark:border-slate-800 md:mt-4 relative">
      {/* Header */}
      <div className="sticky top-16 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 flex justify-between items-center z-30 text-center shadow-sm md:rounded-t-3xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center p-1 shadow-md">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-gray-900 dark:text-white leading-tight">
              {isEnglishMode ? "English Coach AI" : `AI Teacher ${subjectId ? `(${subjectId})` : ""}`}
            </h2>
            <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-success-500'}`}></span>
              <span>{isLoading ? 'Typing...' : 'Online'}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                stopSpeaking();
                setIsEnglishMode(!isEnglishMode);
              }}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg border shadow-sm transition-colors text-sm font-medium ${
                isEnglishMode 
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300' 
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
              title="Learn English"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">English Coach</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:text-primary-500 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors" 
              title="Menu"
            >
              <LayoutList className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 pb-8 md:pb-6">
        <div className="text-center my-6">
          <span className="bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium">Session Started</span>
        </div>
        {messages.filter(msg => (msg.mode || "standard") === (isEnglishMode ? "english" : "standard")).map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mx-2 ${msg.role === "user" ? "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300" : "bg-primary-500 text-white mt-1"}`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                    msg.role === "user" 
                    ? "bg-primary-600 text-white rounded-tr-none" 
                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-slate-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="markdown-body text-sm sm:text-base leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* AI Action Quick Buttons */}
                {msg.role === "teacher" && (
                   <div className="flex flex-wrap items-center mt-2 ml-1 gap-2">
                       {isPlayingId === idx ? (
                           <button onClick={stopSpeaking} className="flex items-center space-x-1 text-xs text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 px-2 py-1 rounded-md transition-colors border border-danger-100 dark:border-danger-500/20">
                             <Square className="w-3.5 h-3.5 fill-current" /> <span>Stop</span>
                           </button>
                       ) : (
                           <button onClick={() => handleSpeakClick(msg.content, idx)} className="flex items-center space-x-1 text-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 px-2 py-1 rounded-md transition-colors border border-primary-100 dark:border-primary-500/20">
                             <Volume2 className="w-3.5 h-3.5" /> <span>Listen</span>
                           </button>
                       )}
                       <button onClick={() => handleSend(undefined, "Generate a quick quiz based on your last explanation.", 'quiz')} className="flex items-center space-x-1 text-xs text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10 px-2 py-1 rounded-md transition-colors border border-secondary-100 dark:border-secondary-500/20">
                          <CheckSquare className="w-3.5 h-3.5" /> <span>Quiz Me</span>
                       </button>
                       <button onClick={() => handleSend(undefined, "Explain this to me like I am 5 years old.")} className="flex items-center space-x-1 text-xs text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-2 py-1 rounded-md transition-colors border border-emerald-100 dark:border-emerald-500/20">
                          <Brain className="w-3.5 h-3.5" /> <span>Simplify</span>
                       </button>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mx-2 bg-primary-500 text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-700 flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Teacher is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Sidebar/Menu Overlay */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl z-[60] border-l border-gray-200 dark:border-slate-700 flex flex-col transform transition-transform pt-16 md:pt-0">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Menu</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 shrink-0 bg-white dark:bg-slate-900 z-10 border-b border-gray-100 dark:border-slate-800/50">
                <button onClick={startNewSession} className="w-full text-left px-4 py-2 text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 dark:text-primary-300 dark:bg-primary-500/10 dark:hover:bg-primary-500/20 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium">
                  <MessageSquare className="w-4 h-4" />
                  <span>Start New Chat</span>
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1 sticky top-0 bg-white dark:bg-slate-900 z-10 py-1">Chat History</h4>
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 italic px-1">No chats yet.</p>
                ) : (
                  <div className="space-y-1">
                    {chatHistory.map((session) => (
                      <button 
                        key={session.id} 
                        onClick={() => loadSession(session)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex flex-col space-y-1 ${sessionId === session.id ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <span className="truncate w-full">{session.subjectId}</span>
                        <span className="text-[10px] text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1 inline" /> {session.lastMessageAt?.toDate()?.toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Input Area */}
      <div className="sticky bottom-[64px] md:bottom-0 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-700 z-30 md:rounded-b-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={(e) => handleSend(e)} className="max-w-4xl mx-auto relative flex items-center">
          <div className="absolute left-3 flex items-center space-x-2">
             <button type="button" onClick={toggleListen} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-danger-100 text-danger-500 dark:bg-danger-500/20' : 'text-gray-400 hover:text-primary-500'}`}>
                {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
             </button>
             {isListening && <span className="text-[10px] text-danger-500 animate-pulse hidden sm:inline-block">Listening...</span>}
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={isListening ? "Listening natively..." : "Ask your teacher anything..."}
            className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-full py-4 pl-[4.5rem] pr-16 focus:outline-none focus:ring-2 focus:ring-primary-500 border border-transparent dark:border-slate-700 disabled:opacity-50 transition-all font-medium"
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:hover:bg-primary-500 transition-colors"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
