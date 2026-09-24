import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to Sillok with Google, Discord, or email.',
  robots: { index: false, follow: false },
};

const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginForm />;
}
