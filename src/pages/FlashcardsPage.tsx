import React, { useState } from "react";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, Brain, Loader2 } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Failed to generate flashcards");
      
      setCards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      console.warn("Flashcards error:", err.message);
      alert("Failed to generate flashcards: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-orange-500/10 rounded-2xl mb-4">
          <Layers className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flashcard Learning System</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Generate smart flashcards instantly on any topic.</p>
      </div>

      {!cards.length && (
         <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">What do you want to memorize?</h2>
            <div className="flex flex-col space-y-4">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. World War 2 dates, Newton's Laws..."
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
              />
              <button 
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl disabled:opacity-50 transition-colors flex justify-center items-center space-x-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                <span>{isGenerating ? "Generating Magic..." : "Generate Flashcards"}</span>
              </button>
            </div>
         </div>
      )}

      {cards.length > 0 && (
         <div className="max-w-2xl mx-auto">
             <div className="flex justify-between items-center mb-6 text-gray-500 dark:text-gray-400 font-medium">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <button onClick={() => { setCards([]); setTopic(""); }} className="hover:text-orange-500 flex items-center space-x-1 text-sm">
                   <RotateCcw className="w-4 h-4" /> <span>Start Over</span>
                </button>
             </div>

             <div className="perspective-1000 w-full h-[400px]">
                <div 
                   onClick={() => setIsFlipped(!isFlipped)}
                   className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? "rotate-y-180" : ""}`}
                >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-lg">
                       <span className="absolute top-6 left-6 text-orange-500 font-bold tracking-widest uppercase text-sm">Question</span>
                       <p className="text-2xl text-center font-medium text-gray-800 dark:text-gray-100 leading-tight">
                         {cards[currentIndex].front}
                       </p>
                       <span className="absolute bottom-6 text-gray-400 text-sm flex items-center space-x-1">
                          <RotateCcw className="w-4 h-4" /> <span>Click to flip</span>
                       </span>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-500 to-amber-500 border border-orange-400 rounded-3xl shadow-lg text-white">
                       <span className="absolute top-6 left-6 text-white/70 font-bold tracking-widest uppercase text-sm">Answer</span>
                       <p className="text-2xl text-center font-medium leading-tight">
                         {cards[currentIndex].back}
                       </p>
                       <span className="absolute bottom-6 text-white/70 text-sm flex items-center space-x-1">
                          <RotateCcw className="w-4 h-4" /> <span>Click to flip back</span>
                       </span>
                    </div>
                </div>
             </div>

             <div className="flex justify-center mt-8 space-x-6">
                <button 
                  onClick={prevCard} 
                  disabled={currentIndex === 0}
                  className="p-4 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                   <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex items-center space-x-4">
                   <button className="flex items-center space-x-2 px-6 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-colors font-medium">
                      <CheckCircle className="w-5 h-5" /> <span>Got It</span>
                   </button>
                </div>
                <button 
                  onClick={nextCard} 
                  disabled={currentIndex === cards.length - 1}
                  className="p-4 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                   <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
             </div>
         </div>
      )}
    </div>
  );
}
