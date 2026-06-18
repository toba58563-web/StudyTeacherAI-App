import React from "react";
import { Link, useLocation } from "react-router";
import { BookOpen, Sparkles, Menu, X, User } from "lucide-react";
import { useState } from "react";

export default function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === "/auth";

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-primary-500 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                Study Teacher AI
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Features</Link>
            <Link to="/subjects" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Subjects</Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors">Dashboard</Link>
            ) : null}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/chat"
                  className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Teacher</span>
                </Link>
                <Link
                  to="/profile"
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex flex-col items-center justify-center border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth?mode=login" className="text-gray-600 dark:text-gray-300 hover:text-primary-500 font-medium transition-colors">Login</Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-300">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <Link to="/features" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Features</Link>
          <Link to="/subjects" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Subjects</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md">Dashboard</Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            </>
          ) : (
            <div className="pt-4 flex flex-col space-y-2">
              <Link to="/auth?mode=login" onClick={() => setIsOpen(false)} className="w-full text-center px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-full font-medium">Login</Link>
              <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)} className="w-full text-center px-4 py-2 bg-primary-500 text-white rounded-full font-medium">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
