import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  MessageSquare,
  FileText,
  Target,
  Flame,
  Brain,
  Calculator,
  TestTube,
  Microscope,
  Trophy,
  Zap,
  Star,
  Camera,
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Bell,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../components/AuthProvider";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { incrementUserProgress } from "../lib/progress";

interface StudyGoal {
  id: string;
  text: string;
  completed: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [newGoalText, setNewGoalText] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      },
      (error) => {
        console.error("Error listening to user profile:", error);
      },
    );
    return () => unsub();
  }, [user]);

  // Load admin goals & broadcasts
  useEffect(() => {
    const initGoals = async () => {
      const saved = localStorage.getItem("studyGoals");
      let currentLocal: StudyGoal[] = [];
      if (saved) {
        try {
          currentLocal = JSON.parse(saved);
        } catch (e) {}
      }

      // get global goals
      const gs = await getDocs(collection(db, "admin_content"));
      const globalGoals: string[] = [];
      gs.forEach((d) => {
        if (d.id.startsWith("goal_")) globalGoals.push(d.data().text);
      });

      // Merge defaults if none locally
      if (currentLocal.length === 0) {
        const mapped = globalGoals.map((tg, i) => ({
          id: `global_${i}`,
          text: tg,
          completed: false,
        }));
        if (mapped.length === 0) {
          currentLocal = [
            { id: "1", text: "Learn 10 English words", completed: false },
            { id: "2", text: "Solve 2 Math problems", completed: false },
          ];
        } else {
          currentLocal = mapped;
        }
      } else {
        // Auto-add new global goals that aren't in local list
        globalGoals.forEach((gText, idx) => {
          if (!currentLocal.find((cg) => cg.text === gText)) {
            currentLocal.push({
              id: `global_new_${Date.now()}_${idx}`,
              text: gText,
              completed: false,
            });
          }
        });
      }
      setStudyGoals(currentLocal);
    };

    initGoals();

    if (
      "Notification" in window &&
      Notification.permission !== "denied" &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // Save goals & Notification Reminder
  useEffect(() => {
    if (studyGoals.length > 0) {
      localStorage.setItem("studyGoals", JSON.stringify(studyGoals));
    }

    const checkReminder = () => {
      if (studyGoals.length === 0) return;
      const allCompleted = studyGoals.every((g) => g.completed);
      const h = new Date().getHours();

      // Remind if it's past 8 PM (20:00) and not all goals are completed
      if (!allCompleted && h >= 20) {
        const lastNotified = localStorage.getItem("lastGoalReminder");
        const todayStr = new Date().toDateString();

        if (
          lastNotified !== todayStr &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("Study Reminder 📚", {
            body: "You haven't completed your daily study goals yet! Keep going!",
          });
          localStorage.setItem("lastGoalReminder", todayStr);
        }
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, [studyGoals]);

  const toggleGoal = async (id: string, currentlyCompleted: boolean) => {
    const updatedGoals = studyGoals.map((g) =>
      g.id === id ? { ...g, completed: !currentlyCompleted } : g,
    );
    setStudyGoals(updatedGoals);

    if (!currentlyCompleted && user) {
      await incrementUserProgress(user.uid, "goalsCompleted", 10);
    }
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    setStudyGoals([
      ...studyGoals,
      { id: Date.now().toString(), text: newGoalText.trim(), completed: false },
    ]);
    setNewGoalText("");
  };

  const removeGoal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudyGoals(studyGoals.filter((g) => g.id !== id));
  };

  const stats = [
    {
      name: "Questions Asked",
      value: profile?.questionsAsked || 0,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      name: "Quizzes Completed",
      value: profile?.quizzesCompleted || 0,
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      name: "Notes Generated",
      value: profile?.notesGenerated || 0,
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      name: "Learning Streak",
      value: `${profile?.streak || 0} Days`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  const subjects = [
    { id: "math", name: "Mathematics", icon: Calculator, color: "bg-blue-500" },
    { id: "physics", name: "Physics", icon: Brain, color: "bg-purple-500" },
    {
      id: "chemistry",
      name: "Chemistry",
      icon: TestTube,
      color: "bg-emerald-500",
    },
    { id: "biology", name: "Biology", icon: Microscope, color: "bg-rose-500" },
  ];

  const weeklyData = [
    { name: "Mon", xp: 0 },
    { name: "Tue", xp: 0 },
    { name: "Wed", xp: 0 },
    { name: "Thu", xp: 0 },
    { name: "Fri", xp: 0 },
    { name: "Sat", xp: 0 },
    { name: "Sun", xp: 0 },
  ];

  const quizPerformance = [
    { week: "W1", score: 0 },
    { week: "W2", score: 0 },
    { week: "W3", score: 0 },
    { week: "W4", score: 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {profile?.displayName || "Student"}! Here is your
            learning progress.
          </p>
        </div>

        {/* Gamification Profile */}
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-3 pr-6 rounded-full border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-slate-800">
              L{profile?.level || 1}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
              <Trophy className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-1">
              <span>
                {profile?.level && profile.level > 10 ? "Scholar" : "Learner"}
              </span>
              <Star className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-secondary-500" />
              <span>{profile?.xp || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4"
          >
            <div className={`p-3 md:p-4 rounded-xl ${stat.bg} w-fit`}>
              <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Weekly Learning Activity (XP)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.2}
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
                  cursor={{ fill: "#94a3b8", opacity: 0.1 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="xp"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Quiz Performance Matrix
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizPerformance}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  domain={[0, 100]}
                />
                <RechartsTooltip
                  cursor={{ fill: "#94a3b8", opacity: 0.1 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={4}
                  dot={{
                    r: 6,
                    fill: "#10B981",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Learning Tools & Study Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Learning Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Link
              to="/chat"
              className="group relative overflow-hidden bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <MessageSquare className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">AI Teacher</h3>
                <p className="text-blue-100 text-sm">Ask any question.</p>
              </div>
            </Link>

            <Link
              to="/image-solver"
              className="group relative overflow-hidden bg-gradient-to-br from-secondary-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <Camera className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <Camera className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">Image Solver</h3>
                <p className="text-teal-100 text-sm">Scan math problems.</p>
              </div>
            </Link>

            <Link
              to="/analyzer"
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <FileText className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <FileText className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">Doc Analyzer</h3>
                <p className="text-purple-100 text-sm">Summarize uploads.</p>
              </div>
            </Link>

            <Link
              to="/flashcards"
              className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                <Target className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <Target className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2">Flashcards</h3>
                <p className="text-orange-100 text-sm">Memorize and revise.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Daily Study Planner */}
        <div className="lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            Daily Study Planner
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm flex-1 flex flex-col h-full max-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Today's Goals
                </p>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${studyGoals.length > 0 ? (studyGoals.filter((g) => g.completed).length / studyGoals.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                {studyGoals.filter((g) => g.completed).length} /{" "}
                {studyGoals.length}
              </span>
            </div>

            <div className="overflow-y-auto pr-2 space-y-2 mb-4 flex-1 custom-scrollbar">
              {studyGoals.length === 0 ? (
                <p className="text-gray-500 text-sm text-center italic py-4">
                  No goals yet! Add some below.
                </p>
              ) : (
                studyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                      goal.completed
                        ? "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-70"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start space-x-3 overflow-hidden">
                      <div className="mt-0.5 shrink-0">
                        {goal.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-primary-400 transition-colors" />
                        )}
                      </div>
                      <span
                        className={`text-sm select-none break-words line-clamp-2 ${goal.completed ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200 font-medium"}`}
                      >
                        {goal.text}
                      </span>
                    </div>
                    <button
                      onClick={(e) => removeGoal(goal.id, e)}
                      className="text-gray-400 hover:text-danger-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addGoal} className="mt-auto relative">
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Add a new goal..."
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newGoalText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-500 text-white rounded-lg disabled:opacity-50 hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Subject Explorer */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Subject Explorer
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/chat/${subject.id}`}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors group text-center"
            >
              <div
                className={`w-14 h-14 mx-auto rounded-full ${subject.color} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}
              >
                <subject.icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                {subject.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
