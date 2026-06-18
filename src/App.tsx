import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import ImageSolverPage from "./pages/ImageSolverPage";
import DocumentAnalyzerPage from "./pages/DocumentAnalyzerPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import PermissionsModal from "./components/PermissionsModal";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./lib/firebase";
import { Bell, X } from "lucide-react";

function MainAppLayout() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [broadcast, setBroadcast] = useState<any>(null);
  const [dismissedBroadcast, setDismissedBroadcast] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(
      doc(db, "admin_content", "broadcast"),
      (docSnap) => {
        if (docSnap.exists()) {
          setBroadcast(docSnap.data());
          setDismissedBroadcast(false);
        }
      },
    );
    return () => unsub();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col font-sans transition-colors duration-300 pb-16 md:pb-0 relative">
      <PermissionsModal />
      <Navbar isAuthenticated={isAuthenticated} />

      {/* Global Toast Notification */}
      {broadcast && !dismissedBroadcast && isAuthenticated && (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-50 bg-primary-600 shadow-2xl rounded-2xl overflow-hidden flex flex-col text-white border border-primary-400/50 animate-in slide-in-from-top-4 fade-in duration-300">
          {broadcast.image && (
             <img src={broadcast.image} alt="Announcement" className="w-full h-32 object-cover bg-primary-700" />
          )}
          <div className="p-4 flex items-start space-x-3">
             <div className="mt-0.5 shrink-0 bg-white/20 p-2 rounded-full text-white">
               <Bell className="w-5 h-5" />
             </div>
             <div className="flex-1 pt-0.5">
               <h4 className="font-bold text-sm">{broadcast.title || "System Announcement"}</h4>
               <p className="text-sm text-primary-100 mt-1 leading-relaxed">
                 {broadcast.message}
               </p>
             </div>
             <button
               onClick={() => setDismissedBroadcast(true)}
               className="text-primary-200 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1.5 rounded-lg"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col pt-16">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              !isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />}
          />
          <Route
            path="/chat"
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/chat/:subjectId"
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/image-solver"
            element={
              isAuthenticated ? <ImageSolverPage /> : <Navigate to="/auth" />
            }
          />
          <Route
            path="/analyzer"
            element={
              isAuthenticated ? (
                <DocumentAnalyzerPage />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/flashcards"
            element={
              isAuthenticated ? <FlashcardsPage /> : <Navigate to="/auth" />
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? <ProfilePage /> : <Navigate to="/auth" />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {isAuthenticated && <BottomNav />}
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Purely standalone Admin layout
  if (location.pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

  return <MainAppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
