import React, { useState, useEffect } from 'react';
import { Camera, Mic, X } from 'lucide-react';

export default function PermissionsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasVisitedBefore', 'true');
    setIsOpen(false);
  };

  const handleAllow = async () => {
    try {
      // Just request it once so the browser prompts
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('Permissions denied or not available.', err);
    } finally {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enhance Your Experience</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
            To get the most out of our AI features, you can allow access to your camera and microphone. This lets you solve problems with images and use voice chat.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Camera Access</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">For Image Solver & scanning documents</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Microphone Access</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">For hands-free voice chat</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Don't Allow
            </button>
            <button 
              onClick={handleAllow}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors shadow-sm"
            >
              Allow Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
