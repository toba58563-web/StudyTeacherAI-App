import React, { useState, useRef } from "react";
import { Files, Upload, Loader2, FileText, CheckCircle, Brain, Target, BookOpen, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../components/AuthProvider";
import { incrementUserProgress } from "../lib/progress";

export default function DocumentAnalyzerPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    if (file) {
      if (file.type === "application/pdf" || file.name.endsWith(".txt")) {
         setSelectedFile(file);
         setResult(null); // clear old results
      } else {
         alert("Please upload a PDF or TXT file.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await fetch("/api/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64Data,
            mimeType: selectedFile.type || "text/plain",
            filename: selectedFile.name
          }),
        });
        
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Failed to analyze document");
        
        setResult(data.result);
        if (user) {
           await incrementUserProgress(user.uid, 'notesGenerated', 50);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      console.warn("Analyzer error:", err.message);
      setResult("Failed to analyze document: " + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl mb-4">
          <Files className="w-8 h-8 text-purple-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Analyzer</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload your study material and let AI extract key concepts, summaries, and questions.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8">
        {!selectedFile ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl p-12 text-center hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                 <Upload className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Click to Upload or Drag and Drop</h3>
              <p className="text-sm text-gray-500">Supports PDF, TXT (Max 10MB)</p>
            </div>
        ) : (
            <div className="p-6 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between">
               <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                      <FileText className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedFile.name}</h3>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
               </div>
               <div className="flex space-x-3 w-full md:w-auto">
                   <button 
                     onClick={() => setSelectedFile(null)}
                     disabled={isProcessing}
                     className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                   >
                       <Trash2 className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={handleAnalyze}
                     disabled={isProcessing}
                     className="flex-1 md:flex-none px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl disabled:opacity-50 transition-colors flex justify-center items-center space-x-2"
                   >
                     {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                     <span>{isProcessing ? "Analyzing..." : "Analyze Document"}</span>
                   </button>
               </div>
            </div>
        )}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".pdf,.txt" 
            className="hidden" 
        />
      </div>

      {result && (
         <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Nav area simulation */}
            <div className="md:col-span-1 space-y-2">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                   <h3 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Result</h3>
                   <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2 text-purple-500"><CheckCircle className="w-4 h-4"/> <span>Summary Generated</span></li>
                      <li className="flex items-center space-x-2 text-purple-500"><Target className="w-4 h-4"/> <span>Key Questions Extracted</span></li>
                      <li className="flex items-center space-x-2 text-purple-500"><BookOpen className="w-4 h-4"/> <span>Notes Ready</span></li>
                   </ul>
                </div>
            </div>

            <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8">
                <div className="markdown-body prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                   <ReactMarkdown>{result}</ReactMarkdown>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
