import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sillok',
  description: 'Privacy Policy for Sillok — Korean Historical Figures Archive.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-gray mx-auto max-w-3xl px-4 py-12">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-gray-500">Last updated: March 29, 2026</p>

      <h2>1. Information We Collect</h2>
      <h3>Account Information</h3>
      <p>
        When you sign up via Google or Discord, we receive your email address and display name from
        the authentication provider. We do not store your social login passwords.
      </p>
      <h3>Usage Data</h3>
      <p>
        We collect anonymized usage data such as page views and interactions to improve the Service.
        This data is aggregated and cannot be used to identify individual users.
      </p>
      <h3>User-Generated Content</h3>
      <p>
        Content you create — including threads, comments, and collections — is stored on our servers
        and displayed publicly within the Service.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the Service.</li>
        <li>To authenticate your identity and manage your account.</li>
        <li>To send notifications related to your activity (e.g., replies to your threads).</li>
        <li>To improve the Service based on aggregated usage patterns.</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>
        Your data is stored securely using Supabase infrastructure with encryption at rest and in
        transit. We implement industry-standard security measures to protect your information.
      </p>

      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — Database and authentication.
        </li>
        <li>
          <strong>Vercel</strong> — Hosting and deployment.
        </li>
        <li>
          <strong>Google / Discord</strong> — Social login authentication.
        </li>
      </ul>
      <p>
        Each third-party service has its own privacy policy governing the data they process on our
        behalf.
      </p>

      <h2>5. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. We do not use
        advertising or tracking cookies.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        Your account data is retained as long as your account is active. If you delete your account,
        we will remove your personal information within 30 days. Publicly posted content (threads,
        comments) may be retained in anonymized form.
      </p>

      <h2>7. Your Rights</h2>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Export your data in a portable format.</li>
      </ul>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for children under 13 years of age. We do not knowingly collect
        personal information from children under 13.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant
        changes by posting a notice on the Service.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related inquiries, please reach out via the contact information provided on the
        Service.
      </p>
    </article>
  );
}
