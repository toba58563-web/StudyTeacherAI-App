import "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  educationLevel?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "teacher";
  content: string;
  timestamp: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
}
