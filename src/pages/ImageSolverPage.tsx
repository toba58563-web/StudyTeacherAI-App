import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Upload, Loader2, Sparkles, X, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ImageSolverPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!selectedImage && !textInput.trim()) return;
    
    setIsProcessing(true);
    try {
      let imageData = null;
      if (selectedImage && fileMimeType) {
          // extract base64 data without prefix
          const base64Data = selectedImage.split(',')[1];
          imageData = {
              mimeType: fileMimeType,
              data: base64Data
          };
      }

      const response = await fetch("/api/solve-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, textInput }),
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Failed to analyze image");
      
      setResult(data.result);
    } catch (err: any) {
      console.warn("ImageSolver error:", err.message);
      setResult("Failed to analyze the image: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-secondary-500/10 rounded-2xl mb-4">
          <Camera className="w-8 h-8 text-secondary-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Image Doubt Solver</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload a photo of your math problem or science diagram.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8">
        
        {!selectedImage ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-secondary-500 transition-colors group">
              <div className="w-16 h-16 bg-secondary-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-secondary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Take Photo</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Use your camera to capture</p>
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-primary-500 transition-colors group">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Upload Image</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Choose from gallery</p>
            </button>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-900 flex justify-center mb-6 max-h-[400px]">
             <img src={selectedImage} alt="Preview" className="max-w-full h-auto object-contain" />
             <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-colors"
              >
               <X className="w-5 h-5" />
             </button>
          </div>
        )}

        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
        />
        <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
        />

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
           <input 
             type="text"
             value={textInput}
             onChange={(e) => setTextInput(e.target.value)}
             placeholder="Optional: What do you want to know about this image?"
             className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary-500 text-gray-900 dark:text-white"
           />
           <button 
             onClick={handleSolve}
             disabled={isProcessing || (!selectedImage && !textInput.trim())}
             className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-xl disabled:opacity-50 transition-colors flex justify-center items-center space-x-2"
           >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
             <span>{isProcessing ? "Analyzing..." : "Solve Now"}</span>
           </button>
        </div>
      </div>

      {result && (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8">
          <h2 className="text-xl font-bold flex items-center space-x-2 mb-6 text-gray-900 dark:text-white">
            <span className="w-8 h-8 rounded-full bg-secondary-500/20 text-secondary-500 flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </span>
            <span>Solution Explained</span>
          </h2>
          <div className="markdown-body prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
