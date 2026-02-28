import Footer from "../Home/Footer";
import Header from "../Home/Header";

export default function DocsPage() {
    return <div className="min-h-screen bg-white">
  <Header />

  {/* HERO */}
  <section className="bg-white py-20 px-6 border-black">
    <div className="max-w-6xl mx-auto text-center">
      <span className="bg-[#39ff14] text-black font-bold px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
        DOCUMENTATION
      </span>

      <h1 className="text-4xl md:text-6xl font-black text-black mt-8 mb-6">
        DevRoom
      </h1>

      <p className="text-2xl text-gray-700 max-w-4xl mx-auto font-medium leading-relaxed">
        Real-Time Chat & Code Collaboration for Developers
      </p>

      <p className="text-lg text-gray-600 mt-6 max-w-3xl mx-auto">
        DevRoom is an open-source platform that lets developers chat, share
        code, run snippets, and collaborate in real time — perfect for coding
        interviews, pair programming, and learning together.
      </p>
    </div>
  </section>

  {/* PROJECT OVERVIEW */}
  <section className="py-16 px-6 bg-gray-50">
    <div className="max-w-5xl mx-auto">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-primary">
        <h2 className="text-3xl font-black mb-6 text-black">
          Project Overview
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="border-2 border-black p-4 font-bold bg-background">GitHub Stars</div>
          <div className="border-2 border-black p-4 font-bold bg-background">Forks</div>
          <div className="border-2 border-black p-4 font-bold bg-background">License: ISC</div>
          <div className="border-2 border-black p-4 font-bold bg-background">Tech Stack</div>
        </div>
      </div>
    </div>
  </section>

  {/* TECH STACK */}
  <section className="py-20 px-6 bg-white">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl font-secondary text-black text-center mb-12">⚡ Tech Stack</h2>

      <div className="grid md:grid-cols-2 gap-8">

        {/* Core */}
        <div className="border-4 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[#b39ddb]">
          <h3 className="text-2xl font-black mb-4">Core Framework & Backend</h3>
          <ul className="space-y-3 font-bold text-black">
            <li>• MongoDB — NoSQL database for chat & users</li>
            <li>• Express.js — Backend API framework</li>
            <li>• Next.js — React framework (SSR + routing)</li>
            <li>• Node.js — Runtime powering backend</li>
          </ul>
        </div>

        {/* Authentication */}
        <div className="border-4 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-[#39ff14]">
          <h3 className="text-2xl font-black mb-4">Authentication & User Management</h3>
          <ul className="space-y-3 font-bold text-black">
            <li>• Clerk (Optional) — Advanced authentication</li>
            <li>• JWT — Secure token-based auth</li>
            <li>• bcryptjs — Password hashing</li>
          </ul>
        </div>

        {/* Real-time */}
        <div className="border-4 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-background text-primary md:col-span-2">
          <h3 className="text-2xl font-black mb-4">Real-Time Communication</h3>
          <p className="font-bold text-lg">
            • Socket.IO — WebSocket-based real-time messaging
          </p>
        </div>

      </div>
    </div>
  </section>

  {/* FEATURES */}
  <section className="py-20 px-6 bg-gray-50">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl text-black text-center mb-16">🚀 Features</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {[
          "💬 Real-Time Chat",
          "🔐 Secure Authentication",
          "🛡 Role-Based Access Control",
          "💻 Collaborative Code Editor",
          "📂 Shared Scratchpads & Snippets",
          "🎯 Live Interview Mode",
          "📎 File Sharing & Code Preview",
          "⚡ In-Chat Code Execution",
          "👤 Profile Management",
          "🌍 Open Source",
        ]?.map((feature, i) => (
          <div
            key={i}
            className="bg-background border-4 border-black p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
          >
            <h3 className="text-xl font-bold text-primary">{feature}</h3>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* CTA */}
  <section className="py-20 px-6 bg-black text-white">
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-4xl font-black mb-6">
        Start Building with DevRoom
      </h2>
      <p className="text-lg text-gray-300 mb-10">
        Open-source, developer-first, and built for real-time collaboration.
      </p>

      <a
        href="https://github.com/aman1455/DevRoom"
         className="bg-[#39ff14] text-black font-black py-4 px-8 border-4 border-white shadow-[8px_8px_0_0_rgba(255,255,255,1)] hover:-translate-y-1 transition-all">
        View GitHub Repository
      </a>
    </div>
  </section>

  <Footer />
</div>
}