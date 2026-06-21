import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { updateProfile, signOut } from "firebase/auth";
import { doc, updateDoc, onSnapshot, collection, addDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User, LogOut, Save, Edit2, Loader2, Award, Book, Flame, MessageSquare, Send, Star } from "lucide-react";
import { useNavigate } from "react-router";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(5);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    setDisplayName(user.displayName || "Student");

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
    });
    return () => unsub();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
    }
    setIsSaving(false);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !user) return;
    
    setFeedbackSending(true);
    try {
      await addDoc(collection(db, "user_feedback"), {
        userId: user.uid,
        userName: user.displayName || profileData?.displayName || "Student",
        userEmail: user.email,
        rating: rating,
        feedbackText: feedbackText.trim(),
        timestamp: Timestamp.now(),
      });
      setFeedbackText("");
      setRating(5);
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch (err) {
      console.error("Error sending feedback:", err);
    }
    setFeedbackSending(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("studentToken");
    await signOut(auth);
    navigate("/");
  };

  if (!user || !profileData) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account and view your progress.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-slate-900">
               {displayName.charAt(0).toUpperCase()}
             </div>
             <div>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      className="border border-gray-300 dark:border-slate-600 px-3 py-1.5 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.displayName || "Student");
                      }}
                      className="p-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.displayName || "Student"}</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
             </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Log out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col items-center text-center">
          <div className="p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl text-orange-500 mb-3">
            <Award className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Level</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Level {profileData.level || 1}</h3>
          <p className="text-xs text-orange-500 mt-1 font-medium">{profileData.xp || 0} XP</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-500 mb-3">
            <Flame className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Learning Streak</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.streak || 0} Days</h3>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl text-blue-500 mb-3">
            <Book className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Questions Asked</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.questionsAsked || 0}</h3>
        </div>
      </div>

      {/* Send Feedback Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-500/10 text-primary-500 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Send Feedback</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Have an idea or found a bug? Let us know!</p>
        
        <form onSubmit={handleSendFeedback} className="space-y-4">
          <div className="flex flex-col space-y-2 mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate your experience</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 dark:text-slate-600"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Type your feedback here..."
            required
            rows={4}
            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-none"
          />
          <div className="flex items-center justify-between">
            {feedbackSent ? (
               <span className="text-emerald-500 font-medium text-sm animate-in fade-in">Feedback successfully sent! 🎉</span>
            ) : (
               <span className="text-transparent">Placeholder</span>
            )}
            <button
              type="submit"
              disabled={feedbackSending || !feedbackText.trim()}
              className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {feedbackSending ? (
                 <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                 <Send className="w-4 h-4" />
              )}
              <span>Submit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
