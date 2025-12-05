"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginStudent, registerStudent } from "@/lib/auth";

export default function StudentAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Register state
  const [regData, setRegData] = useState({
    name: "",
    std: "",
    div: "",
    rollNo: "",
    school: "",
    parentsNo: "",
    parentEmail: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // UI helpers
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
      const result = await loginStudent(loginData.email, loginData.password);
      if (result.success) {
        setLoginMessage({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => router.push("/dashboard/student"), 1500);
      } else {
        setLoginMessage({ type: "error", text: result.error || "Login failed" });
      }
    } catch {
      setLoginMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const result = await registerStudent(
        {
          name: regData.name,
          parentEmail: regData.parentEmail,
          std: regData.std,
          div: regData.div,
          rollNo: regData.rollNo,
          school: regData.school,
          parentsNo: regData.parentsNo,
          gender: regData.gender,
        },
        regData.password
      );

      if (result.success) {
        setRegMessage({ type: "success", text: "Registration successful! Redirecting..." });
        setTimeout(() => router.push("/dashboard/student"), 1500);
      } else {
        setRegMessage({ type: "error", text: result.error || "Registration failed" });
      }
    } catch {
      setRegMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      
      {/* Background video */}
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px]"></div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT BLUE BOX WITH LARGE IMAGE */}
          <div className="hidden md:flex flex-col justify-between rounded-3xl p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl overflow-hidden relative">

            {/* Glow element */}
            <div className="absolute -right-28 -top-24 opacity-20 w-96 h-96 rounded-full blur-3xl bg-white/20" />

            {/* Text */}
            <div className="flex flex-col gap-6 relative z-10">
              <h2 className="text-3xl font-extrabold">Welcome Students</h2>
              <p className="text-blue-100 max-w-xs">
                Access assignments and track progress — all in one place.
              </p>
            </div>

            {/* BIG BOTTOM IMAGE */}
            <div className="relative z-10 mt-6 flex justify-center">
              <img
                src="/illustrator.png"
                alt="Student Illustration"
                className={
                  (mode === "register" ? "w-96" : "w-80") +
                  " h-auto object-contain drop-shadow-xl rounded-xl p-4 transform scale-90"
                }
              />
            </div>
          </div>

          {/* RIGHT SIDE FORM CARD */}
          <div className="bg-white/80 rounded-3xl shadow-xl p-8 md:p-10 backdrop-blur-sm border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {mode === "login" ? "Student Login" : "Create Student Account"}
                </h1>
                <p className="text-sm text-slate-600">
                  {mode === "login" ? "Sign in with parent email." : "Fill in details to register."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setMode("login")}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    mode === "login" ? "bg-white text-blue-700" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    mode === "register" ? "bg-white text-blue-700" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* ---------------- LOGIN FORM ---------------- */}
            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="flex flex-col">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Parent Email</label>
                    <input
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="parent@gmail.com"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showLoginPass ? "text" : "password"}
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl pr-12"
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
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
                </div>

                <div className="mt-6 flex flex-col items-center">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    {loginLoading ? "Signing in..." : "Sign in"}
                  </button>
                  </div>
               <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                      Are you a teacher?{" "}
                      <Link
                        href="/login/teacher"
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        login here
                      </Link>
                    </p>
                  </div>
              </form>
            ) : (
              /* ---------------- REGISTER FORM ---------------- */
              <form onSubmit={handleRegSubmit} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[46vh]">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700">Full Name *</label>
                      <input
                        name="name"
                        value={regData.name}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="Student name"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Standard *</label>
                      <input
                        name="std"
                        value={regData.std}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Division *</label>
                      <input
                        name="div"
                        value={regData.div}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="A"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Roll No *</label>
                      <input
                        name="rollNo"
                        value={regData.rollNo}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="Roll number"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Gender *</label>
                      <select
                        name="gender"
                        value={regData.gender}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-700">School Name *</label>
                      <input
                        name="school"
                        value={regData.school}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="School name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm text-slate-700">Parent Email *</label>
                      <input
                        name="parentEmail"
                        type="email"
                        value={regData.parentEmail}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="parent@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Parent Mobile *</label>
                      <input
                        name="parentsNo"
                        value={regData.parentsNo}
                        onChange={handleRegChange}
                        maxLength={10}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="10-digit number"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Password *</label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showRegPass ? "text" : "password"}
                          value={regData.password}
                          onChange={handleRegChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl pr-12"
                          placeholder="Min 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                        >
                          {showRegPass ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-slate-700">Confirm Password *</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        value={regData.confirmPassword}
                        onChange={handleRegChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>

                  {regMessage && (
                    <div
                      className={`p-3 rounded-lg ${
                        regMessage.type === "success"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {regMessage.text}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex-shrink-0 flex flex-col items-center">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    {regLoading ? "Creating account..." : "Create account"}
                  </button>

                  <p className="text-sm text-slate-600 mt-3">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-blue-700 font-semibold underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
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
