import React from "react";
import { Link } from "react-router";
import { Brain, Sparkles, BookOpen, Clock, Target, ArrowRight, PlayCircle } from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center pt-20 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/20" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500/20 blur-3xl rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-primary-600 dark:text-blue-400 px-4 py-2 rounded-full font-medium text-sm mb-8 border border-blue-100 dark:border-blue-800/50">
              <Sparkles className="w-4 h-4" />
              <span>Available 24/7 for you</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-gray-900 dark:text-white"
          >
            Learn Anything With<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
              Study Teacher AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12"
          >
            Ask questions and receive instant explanations from your personal AI teacher. Master your subjects with real-time support in English and Hindi.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Link
              to="/auth?mode=signup"
              className="px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>Start Learning Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium rounded-full border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center group">
              <PlayCircle className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors" />
              <span>Watch Demo</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to excel</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Powerful AI features designed specifically for students and learners.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Smart Explanations", icon: Brain, desc: "Get concept breakdowns adapted to your learning level.", color: "text-primary-500", bg: "bg-primary-500/10" },
              { title: "Instant Quizzes", icon: Target, desc: "Test your knowledge with auto-generated contextual quizzes.", color: "text-secondary-500", bg: "bg-secondary-500/10" },
              { title: "Notes Generator", icon: BookOpen, desc: "Convert complex chats into structured revision notes.", color: "text-accent-500", bg: "bg-accent-500/10" },
              { title: "24/7 Availability", icon: Clock, desc: "Learn outside school hours whenever you have a doubt.", color: "text-success-500", bg: "bg-success-500/10" }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-950 py-12 border-t border-gray-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">Study Teacher AI</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">© 2026 Study Teacher AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
