import React from "react";
import { Link, useLocation } from "react-router";
import { Home, MessageSquare, Files, Camera, Layers } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 flex justify-between items-center px-6 py-3 z-50">
      <NavItem href="/dashboard" icon={<Home />} label="Home" active={isActive("/dashboard")} />
      <NavItem href="/chat" icon={<MessageSquare />} label="Chat" active={isActive("/chat") || location.pathname.startsWith("/chat/")} />
      <NavItem href="/image-solver" icon={<Camera />} label="Scan" active={isActive("/image-solver")} />
      <NavItem href="/analyzer" icon={<Files />} label="Docs" active={isActive("/analyzer")} />
      <NavItem href="/flashcards" icon={<Layers />} label="Cards" active={isActive("/flashcards")} />
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link to={href} className={`flex flex-col items-center space-y-1 transition-colors ${active ? "text-primary-500" : "text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"}`}>
      <div className={`p-1.5 rounded-full ${active ? "bg-primary-50 dark:bg-primary-500/10" : ""}`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
