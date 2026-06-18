import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { updateProfile, signOut } from "firebase/auth";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User, LogOut, Save, Edit2, Loader2, Award, Book, Flame } from "lucide-react";
import { useNavigate } from "react-router";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleLogout = async () => {
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
    </div>
  );
}
