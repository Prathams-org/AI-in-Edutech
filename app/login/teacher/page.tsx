"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginTeacher, registerTeacher } from "@/lib/auth";

export default function TeacherAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  // Register state
  const [regData, setRegData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((p) => ({ ...p, [name]: value }));
    if (loginErrors[name]) setLoginErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    setLoginMessage(null);

    if (!loginData.email || !loginData.password) {
      setLoginMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setLoginLoading(true);
    try {
      const result = await loginTeacher(loginData.email, loginData.password);
      if (result.success) {
        setLoginMessage({
          type: "success",
          text: "Login successful! Redirecting...",
        });
        setTimeout(() => router.push("/teacher"), 1500);
      } else {
        setLoginMessage({
          type: "error",
          text: result.error || "Login failed",
        });
      }
    } catch {
      setLoginMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegData((p) => ({ ...p, [name]: value }));
    if (regErrors[name]) setRegErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors({});
    setRegMessage(null);

    if (regData.password.length < 6) {
      setRegErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setRegLoading(true);
    try {
      const result = await registerTeacher(
        { name: regData.name, email: regData.email },
        regData.password
      );
      if (result.success) {
        setRegMessage({
          type: "success",
          text: "Registration successful! Redirecting...",
        });
        setTimeout(() => router.push("/teacher"), 1500);
      } else {
        setRegMessage({
          type: "error",
          text: result.error || "Registration failed",
        });
      }
    } catch {
      setRegMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/teacher.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div className="relative z-10 flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT PANEL */}
          <div className="hidden md:flex flex-col justify-center items-center gap-6 
               bg-gradient-to-br from-purple-600 to-pink-500 text-white 
               rounded-3xl p-10 shadow-2xl relative">
            <div className="z-10 flex flex-col items-center text-center gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight">
                Teach. Inspire. Grow.
              </h2>

              <p className="mt-1 text-purple-100 max-w-sm">
                A dedicated space for teachers to manage classes, students and resources — secure and simple.
              </p>

              <div
                className="mt-4 flex justify-center items-center rounded-3xl p-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
                style={{ width: mode === "login" ? 320 : 360, height: mode === "login" ? 320 : 360 }}
              >
                <img
                  src="/teacher-.png"
                  alt="Teacher"
                  className={
                    "object-contain max-w-full max-h-full rounded-2xl " +
                    (mode === "login" ? "w-[400px] h-[400px]" : "w-[450px] h-[450px]")
                  }
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {mode === "login" ? "Teacher Login" : "Create Teacher Account"}
                </h1>
                <p className="text-sm text-gray-500">
                  {mode === "login"
                    ? "Welcome back — please sign in."
                    : "Start your teaching journey with us."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode("login")}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    mode === "login" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    mode === "register" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6">
              <div className="flex-1">

                {/* LOGIN FORM */}
                {mode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="you@gmail.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showLoginPass ? "text" : "password"}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                        >
                          {showLoginPass ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    {loginMessage && (
                      <div
                        className={`p-3 rounded-lg ${
                          loginMessage.type === "success"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {loginMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 
                                 text-white font-semibold shadow-md hover:scale-[1.02] transition-transform"
                    >
                      {loginLoading ? "logging in..." : "log in"}
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600">
                        Are you a student?{" "}
                        <Link
                          href="/login/student"
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Click here
                        </Link>
                      </p>
                    </div>
                  </form>
                ) : (

                  /* REGISTER FORM — scrollbar removed */
                  <form onSubmit={handleRegSubmit} className="flex flex-col space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={regData.name}
                        onChange={handleRegChange}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={regData.email}
                        onChange={handleRegChange}
                        placeholder="you@gmail.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showRegPass ? "text" : "password"}
                          name="password"
                          value={regData.password}
                          onChange={handleRegChange}
                          placeholder="Minimum 6 characters"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                        >
                          {showRegPass ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={regData.confirmPassword}
                        onChange={handleRegChange}
                        placeholder="Re-enter password"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 
                                 text-white font-semibold shadow-md hover:scale-[1.02] transition-transform"
                    >
                      {regLoading ? "Registering..." : "Register"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-400 text-center">
              By continuing, you agree to our{" "}
              <Link href="#" className="underline">Terms</Link> and{" "}
              <Link href="#" className="underline">Privacy Policy</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
