import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright & Takedown | Sillok',
  description:
    'How to report content on Sillok that infringes your copyright, and how we handle takedown notices and counter-notices.',
  alternates: { canonical: '/copyright' },
};

const CONTACT = 'contact@sillok.kr';

// Public, no login: rights holders are usually not Sillok members.
// Notice-and-takedown process for user uploads (Korean Copyright Act Art. 102–103, US DMCA §512).
export default function CopyrightPage() {
  return (
    <article className="prose prose-gray mx-auto max-w-3xl px-4 py-12">
      <h1>Copyright &amp; Takedown</h1>
      <p className="text-sm text-gray-500">Last updated: November 5, 2026</p>

      <p>
        Threads, comments and images on Sillok are posted by users. Sillok does not review uploads
        before they appear, but we respect the rights of creators and remove infringing material
        promptly when we are notified. You do not need a Sillok account to send a notice.
      </p>

      <h2>Reporting infringement</h2>
      <p>
        Email <a href={`mailto:${CONTACT}?subject=Copyright%20notice`}>{CONTACT}</a> with the subject
        &ldquo;Copyright notice&rdquo; and include:
      </p>
      <ol>
        <li>The copyrighted work you believe is infringed (for example, the film or series title and scene).</li>
        <li>The URL of each page on Sillok where the material appears.</li>
        <li>Your name, and if you act for the rights holder, the name of the rights holder.</li>
        <li>Your contact details: email address, and a postal address or phone number.</li>
        <li>
          A statement that you believe in good faith that the use is not authorized by the rights
          holder, its agent, or the law.
        </li>
        <li>
          A statement that the information in your notice is accurate and that you are the rights
          holder or authorized to act on its behalf.
        </li>
        <li>Your physical or electronic signature (typing your full name is fine).</li>
      </ol>

      <h2>What happens next</h2>
      <ul>
        <li>
          We remove or disable access to the reported material, normally within 2 business days of a
          complete notice, and let you know.
        </li>
        <li>We notify the user who posted it and forward the notice, with your contact details removed if you ask.</li>
        <li>Incomplete notices may delay removal — we will tell you what is missing.</li>
      </ul>

      <h2>Counter-notice</h2>
      <p>
        If your content was removed and you believe that was a mistake, or that you have the right to
        use it, email <a href={`mailto:${CONTACT}?subject=Counter-notice`}>{CONTACT}</a> with the
        subject &ldquo;Counter-notice&rdquo;, the URL of the removed content, why you believe the
        removal was a mistake, your contact details, and your signature. We forward it to the person
        who sent the original notice and may restore the content unless they tell us they have taken
        legal action.
      </p>

      <h2>Repeat infringers</h2>
      <p>
        Accounts that repeatedly post infringing material are suspended, and may be terminated.
      </p>

      <h2>Misuse</h2>
      <p>
        Please only send a notice for material you own or represent. Knowingly false notices or
        counter-notices may make the sender liable for damages.
      </p>
    </article>
  );
}
