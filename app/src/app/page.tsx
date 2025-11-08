import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">J2P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">JSON2PPTX</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/templates" className="text-gray-600 hover:text-gray-900">
              Templates
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create PowerPoint Presentations
            <span className="block text-blue-600 mt-2">from JSON, Instantly</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Turn structured data into professional presentations.
            20+ slide types, custom themes, and bidirectional conversion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Creating Free
            </Link>
            <Link
              href="/templates"
              className="inline-block px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Browse Templates
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">20+ Slide Types</h3>
            <p className="text-gray-600">
              Complete library of slide templates including charts, tables, timelines, and more.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Themes</h3>
            <p className="text-gray-600">
              Professional themes and color schemes with full customization support.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Export</h3>
            <p className="text-gray-600">
              Generate PowerPoint files in seconds, not hours. No manual work required.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Round-Trip</h3>
            <p className="text-gray-600">
              Convert PPTX back to JSON perfectly. Edit, version, and regenerate.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💻</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">JSON or Visual</h3>
            <p className="text-gray-600">
              Build with code or visual editor. Switch between modes seamlessly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Ready</h3>
            <p className="text-gray-600">
              Optimized for LLM generation. Perfect for automated presentation creation.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to create your first presentation?
          </h2>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started Now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2024 JSON2PPTX. Open source project.</p>
          <div className="mt-4 flex justify-center space-x-6">
            <a href="https://github.com/lhstorm/json2pptx" className="hover:text-gray-900">
              GitHub
            </a>
            <a href="#" className="hover:text-gray-900">
              Documentation
            </a>
            <a href="#" className="hover:text-gray-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
