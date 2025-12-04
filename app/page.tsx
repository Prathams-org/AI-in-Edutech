import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            AI in Edutech
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your learning experience with AI-powered education
          </p>
        </div>

        {/* Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Card */}
          <Link href="/login/student">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
              <div className="text-center">
                <div className="inline-block p-6 bg-linear-to-r from-blue-500 to-indigo-600 rounded-full mb-6">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Student</h2>
                <p className="text-gray-600 mb-6">
                  Access your courses, assignments, and learning resources
                </p>
                <div className="inline-flex items-center text-blue-600 font-semibold">
                  Login as Student
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Teacher Card */}
          <Link href="/login/teacher">
            <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
              <div className="text-center">
                <div className="inline-block p-6 bg-linear-to-r from-purple-500 to-pink-600 rounded-full mb-6">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Teacher</h2>
                <p className="text-gray-600 mb-6">
                  Manage classrooms, create assignments, and track student progress
                </p>
                <div className="inline-flex items-center text-purple-600 font-semibold">
                  Login as Teacher
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">Why Choose Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered</h4>
              <p className="text-gray-600">
                Smart recommendations and personalized learning paths
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Analytics</h4>
              <p className="text-gray-600">
                Track progress and performance with detailed insights
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Secure</h4>
              <p className="text-gray-600">
                Your data is protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
