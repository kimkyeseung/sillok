import { Suspense } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import NavigationProgress from '@/components/common/NavigationProgress';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* useSearchParams needs a boundary on statically rendered pages */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
