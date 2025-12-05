"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  BookOpen,
  Brain,
  FileText,
  CheckSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Profile",
    href: "/student/profile",
    icon: <Home className="w-5 h-5" />,
  },
  {
    name: "Classroom",
    href: "/student/classroom",
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: "Study Hub",
    href: "/student/study-hub",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    name: "AI Learn Page",
    href: "/student/ai-learn",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    name: "Exam Corner",
    href: "/student/exam-corner",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    name: "Tasks",
    href: "/student/tasks",
    icon: <CheckSquare className="w-5 h-5" />,
  },
];

interface StudentSidebarProps {
  onLogout: () => void;
}

export default function StudentSidebar({ onLogout }: StudentSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-blue-500">
          <h1 className="text-2xl font-bold">EduTech AI</h1>
          <p className="text-blue-200 text-sm mt-1">Student Portal</p>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Padding */}
      <div className="md:ml-64" />
    </>
  );
}
