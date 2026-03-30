import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Sillok</p>
            <p className="mt-1 text-xs text-gray-400">
              Korean Historical Figures Archive
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-xs text-gray-500">
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Explore</p>
              <Link href="/persons" className="block hover:text-gray-900">Figures</Link>
              <Link href="/age-flow" className="block hover:text-gray-900">Age Flow</Link>
              <Link href="/articles" className="block hover:text-gray-900">Articles</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Company</p>
              <Link href="/about" className="block hover:text-gray-900">About</Link>
              <Link href="/terms" className="block hover:text-gray-900">Terms of Service</Link>
              <Link href="/privacy" className="block hover:text-gray-900">Privacy Policy</Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Contact</p>
              <a href="mailto:contact@sillok.kr" className="block hover:text-gray-900">contact@sillok.kr</a>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Sillok. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
