import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Sillok',
  description: 'Terms of Service for Sillok — Korean Historical Figures Archive.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <article className="prose prose-gray mx-auto max-w-3xl px-4 py-12">
      <h1>Terms of Service</h1>
      <p className="text-sm text-gray-500">Last updated: November 5, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Sillok (&ldquo;the Service&rdquo;), you agree to be bound by these
        Terms of Service. If you do not agree, please do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Sillok is a community-driven archive dedicated to Korean historical figures. The Service
        provides biographical information, community discussion threads, curated collections, and
        educational content related to Korean history.
      </p>

      <h2>3. User Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You must be at least 13 years of age to use the Service.</li>
      </ul>

      <h2>4. User Content</h2>
      <ul>
        <li>
          You retain ownership of content you submit (threads, comments, collections). By posting,
          you grant Sillok a non-exclusive, royalty-free license to display and distribute your
          content within the Service.
        </li>
        <li>
          You agree not to post content that is defamatory, harassing, hateful, or that violates any
          applicable law.
        </li>
        <li>
          You are responsible for the content you post, including images. Only post material you
          created, have permission to use, or may use under the law (for example quotation, commentary
          or parody, or public-domain and openly licensed works). Credit the source when you can.
        </li>
        <li>
          Sillok hosts user content and does not review it before it appears. Sillok reserves the
          right to remove content that violates these Terms.
        </li>
      </ul>

      <h2>4a. Copyright Complaints</h2>
      <ul>
        <li>
          If you believe content on Sillok infringes your copyright, send a notice as described on
          our <a href="/copyright">Copyright &amp; Takedown</a> page. No account is needed.
        </li>
        <li>
          We remove reported material promptly, notify the user who posted it, and accept
          counter-notices.
        </li>
        <li>
          Accounts that repeatedly post infringing material are suspended, and may be terminated.
        </li>
      </ul>

      <h2>5. Prohibited Conduct</h2>
      <ul>
        <li>Attempting to gain unauthorized access to the Service or other accounts.</li>
        <li>Using automated tools to scrape or collect data without permission.</li>
        <li>Impersonating another person or entity.</li>
        <li>Uploading malicious code or content.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        The Sillok name, logo, and original site content are the property of Sillok. Historical
        information presented is sourced from public records and scholarly works. User-contributed
        content remains the property of its respective authors.
      </p>

      <h2>7. Disclaimer of Warranties</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. Sillok does not
        guarantee the accuracy or completeness of historical information presented on the platform.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        Sillok shall not be liable for any indirect, incidental, or consequential damages arising
        from your use of the Service.
      </p>

      <h2>9. Termination</h2>
      <p>
        Sillok may suspend or terminate your account at any time for violation of these Terms or for
        any other reason at its discretion.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes
        constitutes acceptance of the revised Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these Terms, email{' '}
        <a href="mailto:contact@sillok.kr">contact@sillok.kr</a>.
      </p>
    </article>
  );
}
