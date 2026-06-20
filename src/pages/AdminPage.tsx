import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import {
  Lock,
  Users,
  Activity,
  MessageSquare,
  Bell,
  Target,
  ArrowRight,
  Shield,
  Layers,
  LogOut,
  Trash2,
  Plus,
  RefreshCw,
  Ban,
  ShieldCheck,
  Download,
  Calendar,
  X,
  Menu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Login State
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Dashboard State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "analytics" | "content" | "notifications" | "audit"
  >("dashboard");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Forms & Validations
  const [newGoal, setNewGoal] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [newFlashcardQ, setNewFlashcardQ] = useState("");
  const [newFlashcardA, setNewFlashcardA] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastImage, setBroadcastImage] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [formError, setFormError] = useState("");

  // Users Table
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserChats, setSelectedUserChats] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Bulk Actions State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const adminEmail = "admin@studyteacher.com";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setActiveTab("users");
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Ctrl+Shift+A to jump to audit logs
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "a"
      ) {
        e.preventDefault();
        setActiveTab("audit");
      }
      // Ctrl+S to save content
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Fire generic submit if a form is focused/active
        const submitBtn = document.querySelector(
          'form button[type="submit"]',
        ) as HTMLButtonElement | null;
        if (submitBtn) {
          submitBtn.click();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let unsubscribeUsers: () => void;
    // Redirect if it's already a logged in student wandering here
    if (user && user.email !== adminEmail) {
      window.location.href = "/dashboard";
      return;
    }

    if (user && user.email === adminEmail && localStorage.getItem("adminToken") === "true") {
      setIsAdmin(true);
      fetchAdminData();
      
      // Real-time listener for users
      unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const uList: any[] = [];
        snapshot.forEach((doc) => {
          uList.push({ id: doc.id, ...doc.data() });
        });
        setUsersList(uList);
      });
    } else {
      setIsAdmin(false);
    }
    setLoading(false);

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [user]);

  const fetchAdminData = async () => {
    try {
      // Users are now fetched via onSnapshot above

      // Fetch goals & flashcards
      const contentSnap = await getDocs(collection(db, "admin_content"));
      const gList: any[] = [];
      const fList: any[] = [];
      contentSnap.forEach((doc) => {
        if (doc.id.startsWith("goal_")) {
          gList.push({ id: doc.id, ...doc.data() });
        }
        if (doc.id.startsWith("flashcard_")) {
          fList.push({ id: doc.id, ...doc.data() });
        }
      });
      setGoals(gList);
      setFlashcards(fList);

      // Fetch audit logs
      const auditSnap = await getDocs(
        query(collection(db, "admin_audit"), orderBy("timestamp", "desc")),
      );
      const aList: any[] = [];
      auditSnap.forEach((doc) => {
        aList.push({ id: doc.id, ...doc.data() });
      });
      setAuditLogs(aList);
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
  };

  const logAuditActivity = async (action: string, details?: string) => {
    try {
      await setDoc(doc(collection(db, "admin_audit")), {
        action,
        details: details || "",
        timestamp: Timestamp.now(),
        adminEmail,
      });
      // Optionally re-fetch, but to avoid too many reads we could just refresh on mount or manually.
      // fetchAdminData();
    } catch (e) {
      console.error("Failed to log audit", e);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, adminEmail, password);
      localStorage.setItem("adminToken", "true");
      localStorage.removeItem("studentToken");
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        try {
          await createUserWithEmailAndPassword(auth, adminEmail, password);
          localStorage.setItem("adminToken", "true");
          localStorage.removeItem("studentToken");
        } catch (createErr: any) {
          setLoginError(createErr.message);
        }
      } else {
        setLoginError(err.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    signOut(auth);
  };

  const handleSelectUserDetails = async (u: any) => {
    setSelectedUser(u);
    setSelectedUserChats([]);
    try {
      const chatsSnap = await getDocs(
        query(
          collection(db, "users", u.id, "chats"),
          orderBy("createdAt", "desc"),
        ),
      );
      const cList: any[] = [];
      chatsSnap.forEach((snap) => {
        cList.push({ id: snap.id, ...snap.data() });
      });
      setSelectedUserChats(cList);
    } catch (err) {
      console.error(err);
    }
  };

  const executeBulk = async () => {
    if (selectedUserIds.length === 0 || !bulkAction) return;
    
    let msg = "";
    if (bulkAction === "notify") {
      if (!bulkMessage.trim()) {
        showToast("Please enter a notification message.", "error");
        return;
      }
      msg = bulkMessage.trim();
    } else if (bulkAction === "test-notify") {
      msg = "This is a test notification from the system administrator.";
    }

    if (bulkAction === "delete" || bulkAction === "ban") {
      const actionVerb = bulkAction === "delete" ? "delete" : "ban";
      try {
        if (!window.confirm(`Are you sure you want to ${actionVerb} ${selectedUserIds.length} users?`)) {
          return;
        }
      } catch (e) {
        // Fallback for iframe sandbox environments where modals are blocked
        console.warn("window.confirm was blocked by sandbox, skipping confirmation.");
      }
    }

    setIsProcessing(true);
    setFormError("");

    try {
      if (bulkAction === "delete") {
        for (const id of selectedUserIds) {
          await deleteDoc(doc(db, "users", id));
        }
        await logAuditActivity(
          "Bulk Delete Users",
          `Deleted ${selectedUserIds.length} users. IDs: ${selectedUserIds.join(", ")}`,
        );
        showToast(`Successfully deleted ${selectedUserIds.length} users.`, "success");
      } else if (bulkAction === "notify" || bulkAction === "test-notify") {
        for (const id of selectedUserIds) {
          // create a unique notification doc
          const newNotifRef = doc(collection(db, "users", id, "notifications"));
          await setDoc(newNotifRef, {
            title: bulkAction === "test-notify" ? "Test Notification" : "Admin Notice",
            message: msg,
            createdAt: Timestamp.now(),
            read: false,
          });
          // optionally update latest for backwards compatibility 
          await updateDoc(doc(db, "users", id), {
            latestNotification: msg,
            notificationDate: Timestamp.now(),
          });
        }
        await logAuditActivity(
          bulkAction === "test-notify" ? "Bulk Test Notify Users" : "Bulk Notify Users",
          `Sent notification to ${selectedUserIds.length} users. Message: ${msg}`,
        );
        showToast("Notifications sent successfully.", "success");
      } else if (bulkAction === "ban") {
        for (const id of selectedUserIds) {
          await updateDoc(doc(db, "users", id), { isBanned: true });
        }
        await logAuditActivity(
          "Bulk Ban Users",
          `Banned ${selectedUserIds.length} users. IDs: ${selectedUserIds.join(", ")}`,
        );
        showToast(`Successfully banned ${selectedUserIds.length} users.`, "success");
      }
      setSelectedUserIds([]);
      setBulkAction("");
      setBulkMessage("");
      fetchAdminData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Bulk action failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAllUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedUserIds(usersList.map((u) => u.id));
    else setSelectedUserIds([]);
  };

  const handleSelectOneUser = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.target.checked) setSelectedUserIds((prev) => [...prev, id]);
    else setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
  };

  const handleResetUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        xp: 0,
        level: 1,
        questionsAsked: 0,
        quizzesCompleted: 0,
        notesGenerated: 0,
        goalsCompleted: 0,
      });
      await logAuditActivity("Reset User Progress", `User ID: ${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isBanned: true });
      await logAuditActivity("Ban User", `User ID: ${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { isAdmin: true });
      await logAuditActivity("Promote to Admin", `User ID: ${userId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCSV = () => {
    const headers = [
      "ID",
      "Level",
      "XP",
      "QuestionsAsked",
      "Quizzes",
      "Goals",
      "IsBanned",
    ];
    const rows = usersList.map((u) =>
      [
        u.id,
        u.level || 1,
        u.xp || 0,
        u.questionsAsked || 0,
        u.quizzesCompleted || 0,
        u.goalsCompleted || 0,
        u.isBanned || false,
      ].join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) {
      setFormError("Goal text cannot be empty.");
      return;
    }
    setFormError("");
    try {
      const gId = "goal_" + Date.now();
      await setDoc(doc(db, "admin_content", gId), {
        text: newGoal.trim(),
        scheduledDate: newGoalDate || "Anytime",
        createdAt: Timestamp.now(),
      });
      await logAuditActivity("Add Goal", `Goal: ${newGoal.trim()}`);
      setNewGoal("");
      setNewGoalDate("");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setFormError("Failed to add goal.");
    }
  };

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlashcardQ.trim() || !newFlashcardA.trim()) {
      setFormError("Both question and answer are required.");
      return;
    }
    setFormError("");
    try {
      const fId = "flashcard_" + Date.now();
      await setDoc(doc(db, "admin_content", fId), {
        question: newFlashcardQ.trim(),
        answer: newFlashcardA.trim(),
        createdAt: Timestamp.now(),
      });
      await logAuditActivity("Add Flashcard", `Q: ${newFlashcardQ.trim()}`);
      setNewFlashcardQ("");
      setNewFlashcardA("");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setFormError("Failed to add flashcard.");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, "admin_content", id));
      await logAuditActivity("Delete Content", `ID: ${id}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !broadcastTitle.trim()) {
      setFormError("Title and message are required for broadcast.");
      return;
    }
    setFormError("");
    try {
      await setDoc(doc(db, "admin_content", "broadcast"), {
        title: broadcastTitle.trim(),
        message: broadcastMsg.trim(),
        image: broadcastImage.trim() || null,
        timestamp: Timestamp.now(),
      });
      await logAuditActivity(
        "Push Broadcast",
        `Title: ${broadcastTitle.trim()}`,
      );
      setBroadcastTitle("");
      setBroadcastMsg("");
      setBroadcastImage("");
      alert("Broadcast sent successfully!");
    } catch (err) {
      console.error(err);
      setFormError("Failed to send broadcast.");
    }
  };

  // Filter and Sort Users
  const sortedAndFilteredUsers = React.useMemo(() => {
    let filtered = usersList;
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = usersList.filter(
        (u) =>
          u.id?.toLowerCase().includes(lowerQ) ||
          u.email?.toLowerCase().includes(lowerQ),
      );
    }

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key] || 0;
        let bVal = b[sortConfig.key] || 0;
        if (sortConfig.key === "createdAt" && a.createdAt)
          aVal = a.createdAt.seconds || 0;
        if (sortConfig.key === "createdAt" && b.createdAt)
          bVal = b.createdAt.seconds || 0;
        if (sortConfig.key === "id") {
          aVal = a.id;
          bVal = b.id;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [usersList, searchQuery, sortConfig]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">
        Loading...
      </div>
    );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-300 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/20">
              <Shield className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Secure authentication required.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <span>Authenticate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-slate-600 text-center mt-4">
              For demo: Initial login sets the password.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalUsers = usersList.length;
  const totalXP = usersList.reduce(
    (acc, current) => acc + (current.xp || 0),
    0,
  );
  const avgLevel =
    usersList.length > 0
      ? Math.floor(
          usersList.reduce((acc, current) => acc + (current.level || 1), 0) /
            usersList.length,
        )
      : 1;

  const activityData = [
    {
      name: "Chat",
      value: usersList.reduce((acc, cur) => acc + (cur.questionsAsked || 0), 0),
      color: "#3b82f6",
    },
    {
      name: "Quizzes",
      value: usersList.reduce(
        (acc, cur) => acc + (cur.quizzesCompleted || 0),
        0,
      ),
      color: "#10b981",
    },
    {
      name: "Notes",
      value: usersList.reduce((acc, cur) => acc + (cur.notesGenerated || 0), 0),
      color: "#f59e0b",
    },
    {
      name: "Goals",
      value: usersList.reduce((acc, cur) => acc + (cur.goalsCompleted || 0), 0),
      color: "#8b5cf6",
    },
  ];

  // Mock heatmap 30 days data
  const heatmapData = Array.from({ length: 30 }).map((_, i) => ({
    name: `Day ${i + 1}`,
    activeUsers: Math.floor(Math.random() * 50) + 10,
  }));

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-primary-500/30">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 transition-all duration-300 transform translate-y-0 opacity-100 ${
            toast.type === "success" 
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {toast.type === "success" ? <ShieldCheck className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      <div className="flex h-screen overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:relative z-50 w-64 bg-slate-900 border-r border-slate-800/60 flex-col h-full transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } flex`}
        >
          <div className="p-6 flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-white text-lg tracking-tight">
              Admin Console
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: Target },
              { id: "users", label: "User Management", icon: Users },
              { id: "content", label: "Content Mgmt", icon: Layers },
              { id: "notifications", label: "Announcements", icon: Bell },
              { id: "analytics", label: "Analytics", icon: Activity },
              { id: "audit", label: "Audit Logs", icon: ShieldCheck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all group"
            >
              <LogOut className="w-5 h-5 mb-1 text-slate-500 group-hover:text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Terminate Session
              </span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 bg-slate-800 text-white rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight capitalize">
                  {activeTab.replace("-", " ")}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Manage platform metrics and data.
                </p>
              </div>
            </div>
            <div className="flex space-x-4 items-center">
              <button
                onClick={downloadCSV}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export Data CSV</span>
              </button>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Total XP Global
                </p>
                <p className="text-xl font-mono text-primary-400">
                  {totalXP.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Registered
                </p>
                <p className="text-xl font-mono text-emerald-400">
                  {totalUsers}
                </p>
              </div>
            </div>
          </header>

          {formError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-sm font-medium">{formError}</p>
              <button
                onClick={() => setFormError("")}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">
                    System Audit Logs
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Record of high-level administrative operational changes.
                  </p>
                </div>

                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      No audit logs found.
                    </p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="mt-1 w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                            <p className="text-sm font-bold text-white">
                              {log.action}
                            </p>
                            <span className="text-xs text-slate-500 font-mono mt-1 sm:mt-0">
                              {log.timestamp
                                ? new Date(
                                    log.timestamp.seconds * 1000,
                                  ).toLocaleString()
                                : ""}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {log.details}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Origin: {log.adminEmail}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
                    Total Active Users
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {totalUsers}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Download className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
                    App Installs / Downloads
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">1,204</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Activity className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
                    Global User XP
                  </p>
                  <p className="text-3xl font-bold text-white mt-2 font-mono">
                    {totalXP.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                  Recent Activity Stream
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      time: "10 mins ago",
                      action: "New user registered",
                      author: "user_4821@gmail.com",
                      icon: Users,
                      color: "text-emerald-400",
                      bg: "bg-emerald-500/10",
                    },
                    {
                      time: "1 hour ago",
                      action: "Completed Daily Goal",
                      author: "sarah.j@school.edu",
                      icon: Target,
                      color: "text-purple-400",
                      bg: "bg-purple-500/10",
                    },
                    {
                      time: "3 hours ago",
                      action: "Generated Study Notes",
                      author: "student99@gmail.com",
                      icon: Layers,
                      color: "text-blue-400",
                      bg: "bg-blue-500/10",
                    },
                    {
                      time: "5 hours ago",
                      action: "Requested Flashcard Deck",
                      author: "mike_study@gmail.com",
                      icon: Activity,
                      color: "text-amber-400",
                      bg: "bg-amber-500/10",
                    },
                  ].map((act, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-4 border-b border-slate-800/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div
                        className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.bg}`}
                      >
                        <act.icon className={`w-4 h-4 ${act.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {act.action}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {act.author} • {act.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 gap-4">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <span className="text-sm font-medium text-slate-400 shrink-0">
                    {selectedUserIds.length} selected
                  </span>
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    {bulkAction === "notify" && (
                      <input
                        type="text"
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        placeholder="Enter notification message..."
                        className="bg-slate-950 border border-slate-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-primary-500 w-full md:w-64"
                        disabled={isProcessing}
                      />
                    )}
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-primary-500 w-full md:w-auto"
                      disabled={isProcessing}
                    >
                      <option value="">Bulk Action</option>
                      <option value="test-notify">Send Test Notification</option>
                      <option value="notify">Notify Selected</option>
                      <option value="ban">Ban Selected</option>
                      <option value="delete">Delete Selected</option>
                    </select>
                    <button
                      onClick={executeBulk}
                      disabled={selectedUserIds.length === 0 || !bulkAction || isProcessing}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                          Processing...
                        </>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-64">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search users (Ctrl+K)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-primary-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="px-6 py-4 w-12 cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={handleSelectAllUsers}
                          checked={
                            sortedAndFilteredUsers.length > 0 &&
                            selectedUserIds.length ===
                              sortedAndFilteredUsers.length
                          }
                          className="w-4 h-4 rounded border-slate-700 text-primary-500 focus:ring-primary-500/50 bg-slate-950"
                        />
                      </th>
                      <th
                        onClick={() => requestSort("id")}
                        className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                      >
                        User ID / Email{" "}
                        {sortConfig?.key === "id"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </th>
                      <th
                        onClick={() => requestSort("level")}
                        className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                      >
                        Level{" "}
                        {sortConfig?.key === "level"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </th>
                      <th
                        onClick={() => requestSort("xp")}
                        className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                      >
                        Total XP{" "}
                        {sortConfig?.key === "xp"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </th>
                      <th
                        onClick={() => requestSort("createdAt")}
                        className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-300 transition-colors"
                      >
                        Joined (approx){" "}
                        {sortConfig?.key === "createdAt"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sortedAndFilteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          u.isBanned ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            onChange={(e) => handleSelectOneUser(e, u.id)}
                            checked={selectedUserIds.includes(u.id)}
                            className="w-4 h-4 rounded border-slate-700 text-primary-500 focus:ring-primary-500/50 bg-slate-950"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-slate-200">
                            {u.email ?? (u.id ? (u.id.length > 10 ? u.id.slice(0, 10) + "..." : u.id) : "N/A")}{" "}
                            {u.isAdmin && (
                              <span className="ml-2 text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                                ADMIN
                              </span>
                            )}
                            {u.isBanned && (
                              <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                BANNED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Lvl {u.level || 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-slate-300">
                          {u.xp || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {u.lastLoginAt
                            ? new Date(
                                u.lastLoginAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleSelectUserDetails(u)}
                              title="View Details"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors border border-slate-700 text-xs font-semibold uppercase tracking-wider"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleResetUser(u.id)}
                              title="Reset Progress"
                              className="p-1.5 bg-slate-800 hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 rounded-lg transition-colors border border-slate-700"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleBanUser(u.id)}
                              title="Ban User"
                              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-700"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            {!u.isAdmin && (
                              <button
                                onClick={() => handlePromoteUser(u.id)}
                                title="Promote to Admin"
                                className="p-1.5 bg-slate-800 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 rounded-lg transition-colors border border-slate-700"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                  Tool Usage Distribution
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {activityData
                          .filter((d) => d.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#f8fafc",
                        }}
                        itemStyle={{ color: "#f8fafc" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {activityData.map((d) => (
                    <div key={d.name} className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      ></span>
                      <span className="text-sm text-slate-400">
                        {d.name} ({d.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">
                  User Activity Volume
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#1e293b"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#1e293b", opacity: 0.5 }}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#f8fafc",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-white mb-6">
                  30-Day Activity Heatmap
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heatmapData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#1e293b"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        dy={10}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#1e293b", opacity: 0.5 }}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#f8fafc",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="activeUsers"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Daily Goals Planner
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Manage the overarching study goals pushed to all students.
                </p>

                <form
                  onSubmit={handleAddGoal}
                  className="flex flex-col space-y-3 mb-6"
                >
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="E.g., Read 1 chapter of Science"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 [color-scheme:dark]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center space-x-2 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule Goal</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {goals.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-col p-4 bg-slate-950 rounded-xl border border-slate-800 group relative"
                    >
                      <span className="text-slate-200">{g.text}</span>
                      <span className="text-xs text-primary-400 mt-2 font-medium">
                        Scheduled: {g.scheduledDate || "Anytime"}
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="absolute right-4 top-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {goals.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">
                      No global goals set.
                    </p>
                  )}
                </div>
              </div>

              {/* Flashcards CMS */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Flashcards CMS
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Add and edit community flashcard decks.
                </p>

                <form
                  onSubmit={handleAddFlashcard}
                  className="flex flex-col space-y-3 mb-6"
                >
                  <input
                    type="text"
                    value={newFlashcardQ}
                    onChange={(e) => setNewFlashcardQ(e.target.value)}
                    placeholder="Question (e.g. What is the powerhouse of the cell?)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <input
                    type="text"
                    value={newFlashcardA}
                    onChange={(e) => setNewFlashcardA(e.target.value)}
                    placeholder="Answer (e.g. Mitochondria)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Flashcard</span>
                  </button>
                </form>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {flashcards.map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-col p-4 bg-slate-950 rounded-xl border border-slate-800 group relative"
                    >
                      <span className="text-slate-200 font-medium mb-1">
                        Q: {f.question}
                      </span>
                      <span className="text-slate-400 text-sm">
                        A: {f.answer}
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(f.id)}
                        className="absolute right-4 top-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {flashcards.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-4">
                      No global flashcards set.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Broadcast Message
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Send a global alert or announcement to all active connections.
                </p>

                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="E.g., System Maintenance"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={broadcastImage}
                      onChange={(e) => setBroadcastImage(e.target.value)}
                      placeholder="https://example.com/image.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Message Body
                    </label>
                    <textarea
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                      rows={4}
                      placeholder="Type your announcement here..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-8 py-3 rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Broadcast Now</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center space-x-3">
                <Users className="w-6 h-6 text-primary-500" />
                <span>User Intelligence Report</span>
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 bg-slate-800 rounded-lg hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              {/* Simulated Data */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Account Analytics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Level</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {selectedUser.level || 1}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">
                      Global XP
                    </p>
                    <p className="text-2xl font-mono text-primary-400 mt-1">
                      {selectedUser.xp || 0}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">
                      Quizzes
                    </p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {selectedUser.quizzesCompleted || 0}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Status</p>
                    <p
                      className={`text-sm font-bold mt-2 ${
                        selectedUser.isBanned
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedUser.isBanned ? "BANNED" : "ACTIVE"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Recent AI Teacher Conversations
                </h4>
                <div className="space-y-4">
                  {selectedUserChats.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No recent conversations found.
                    </p>
                  ) : (
                    selectedUserChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-primary-400 font-bold px-2 py-1 bg-primary-500/10 rounded-md">
                            {chat.subjectId}
                          </span>
                          <span className="text-xs text-slate-500">
                            {chat.lastMessageAt
                              ? new Date(
                                  chat.lastMessageAt.seconds * 1000,
                                ).toLocaleString()
                              : ""}
                          </span>
                        </div>
                        <div className="space-y-2 mt-3 text-sm text-slate-300 max-h-48 overflow-y-auto">
                          {chat.messages &&
                            chat.messages.map((m: any, i: number) => (
                              <div
                                key={i}
                                className={`p-2 rounded-lg ${
                                  m.role === "user"
                                    ? "bg-slate-800 text-slate-200"
                                    : "bg-primary-900/20 text-slate-400"
                                }`}
                              >
                                <span className="font-bold text-xs uppercase opacity-50 mr-2">
                                  {m.role}:
                                </span>
                                {m.content}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-medium"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
