'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PrivacyPolicyPage() {
  const [gridDirection, setGridDirection] = useState('40px 40px')

  useEffect(() => {
    const directions = ['40px 40px', '-40px 40px', '40px -40px', '-40px -40px']
    const changeDirection = () => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]
      setGridDirection(randomDirection)
    }
    const intervalId = setInterval(changeDirection, 8000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none animate-grid-pan"
        style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          '--grid-end-position': gridDirection,
        } as React.CSSProperties & { '--grid-end-position': string }}
      ></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last Updated: December 2, 2025</p>

          <div className="prose dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                QuizMe ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Information We Collect</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>2.1 Account Information:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Email address</li>
                <li>Full name</li>
                <li>Institution and program (optional)</li>
                <li>Password (encrypted and never stored in plain text)</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>2.2 Uploaded Content:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Learning materials you upload (PDFs, documents, images, presentations, etc.)</li>
                <li>File metadata (name, size, type, upload date)</li>
                <li>AI-generated quizzes based on your uploaded materials</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>2.3 Usage Data:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Quiz attempts and scores</li>
                <li>Quiz history and performance analytics</li>
                <li>Browser type and version</li>
                <li>IP address</li>
                <li>Time zone and locale settings</li>
                <li>Pages visited and features used</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Provide and maintain the Service</li>
                <li>Generate AI-powered quizzes from your uploaded materials</li>
                <li>Store your quizzes and track your learning progress</li>
                <li>Send you account-related emails (verification, password resets)</li>
                <li>Improve our AI models and Service quality (using anonymized data)</li>
                <li>Respond to your support requests and feedback</li>
                <li>Detect and prevent fraud, abuse, or technical issues</li>
              </ul>
            </section>

            {/* File Storage & Processing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. File Storage & Processing</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>4.1 Storage Duration:</strong> We may store your uploaded files:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Temporarily:</strong> Files may be processed immediately and deleted after quiz generation</li>
                <li><strong>Short-term:</strong> Files may be cached temporarily for optimization purposes</li>
                <li><strong>Long-term:</strong> Files may be retained in your account to allow quiz regeneration and history tracking</li>
                <li><strong>Permanently:</strong> We reserve the right to store files as needed to provide and improve the Service</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>4.2 AI Processing:</strong> Your uploaded files are processed by third-party AI services (Google Gemini) to generate quiz content. These services may temporarily process your content according to their own privacy policies.
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>4.3 Content Deletion:</strong> You can request deletion of your uploaded files and generated quizzes by contacting us. We will make reasonable efforts to delete your data, subject to backup retention policies and legal obligations.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Data Sharing & Third Parties</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.1 Third-Party Services:</strong> We use the following third-party services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Supabase:</strong> Authentication and database hosting</li>
                <li><strong>Google Gemini:</strong> AI-powered quiz generation</li>
                <li><strong>Vercel:</strong> Application hosting and deployment</li>
                <li><strong>FormSubmit.co:</strong> Feedback email delivery</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Each of these services has their own privacy policies governing how they handle data.
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.2 We Do NOT:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Sell your personal information to third parties</li>
                <li>Share your uploaded files publicly without your consent</li>
                <li>Use your data for advertising or marketing purposes</li>
                <li>Share your quiz results with your institution or educators</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Data Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement reasonable security measures to protect your data, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Encrypted password storage</li>
                <li>HTTPS/SSL encryption for data transmission</li>
                <li>Secure authentication via Supabase</li>
                <li>Regular security updates and monitoring</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your account information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your quiz data</li>
                <li><strong>Object:</strong> Object to certain processing of your data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:my.stationptot@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  my.stationptot@gmail.com
                </a>
              </p>
            </section>

            {/* Cookies & Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Cookies & Local Storage</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and browser local storage to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Keep you logged in</li>
                <li>Remember your preferences (theme, settings)</li>
                <li>Store quiz data locally for offline access (if not logged in)</li>
                <li>Improve performance and user experience</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can disable cookies in your browser settings, but this may affect functionality.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our Service is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Email:{' '}
                <a href="mailto:my.stationptot@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  my.stationptot@gmail.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              By using QuizMe, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
