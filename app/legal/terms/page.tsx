'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last Updated: December 2, 2025</p>

          <div className="prose dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using QuizMe ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">2. Service Description</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                QuizMe is an educational tool that uses artificial intelligence to generate practice quizzes from user-uploaded learning materials. The Service is provided "as is" for educational purposes only.
              </p>
            </section>

            {/* User Content & Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">3. User Content & Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>3.1 Your Responsibilities:</strong> You represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>You own or have the necessary rights, licenses, and permissions to upload and use any materials you provide to the Service</li>
                <li>Your uploaded materials do not infringe upon any third-party intellectual property rights, including but not limited to copyrights, trademarks, or patents</li>
                <li>You will not upload materials that are illegal, harmful, threatening, abusive, or otherwise objectionable</li>
                <li>You are solely responsible for ensuring you have the right to use all uploaded content</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>3.2 File Storage:</strong> We may store your uploaded files temporarily or permanently as needed to provide and improve the Service. Files may be:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Processed immediately and deleted after quiz generation</li>
                <li>Stored temporarily for optimization purposes</li>
                <li>Retained for your account to regenerate quizzes</li>
                <li>Used anonymously to improve our AI models (with personal information removed)</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>3.3 License Grant:</strong> By uploading content, you grant QuizMe a non-exclusive, worldwide, royalty-free license to use, reproduce, and process your content solely for the purpose of providing the Service.
              </p>
            </section>

            {/* AI-Generated Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">4. AI-Generated Content</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>4.1 Accuracy Disclaimer:</strong> Quiz questions and answers are generated using artificial intelligence and may contain errors, inaccuracies, or inappropriate content. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>AI-generated content should not be considered 100% accurate</li>
                <li>You should verify important information independently</li>
                <li>The Service is intended for study assistance, not as a sole source of learning</li>
                <li>We make no guarantees about the quality or correctness of generated quizzes</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">5. Limitation of Liability & Indemnification</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.1 No Warranty:</strong> THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.2 Limitation of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUIZME AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.3 User Indemnification:</strong> You agree to indemnify, defend, and hold harmless QuizMe, its operators, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights, including intellectual property rights</li>
                <li>Any content you upload or submit to the Service</li>
              </ul>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>5.4 No Legal Action:</strong> By using this Service, you agree not to sue QuizMe, its operators, developers, or any affiliated parties for any reason whatsoever related to your use of the Service, except where prohibited by law.
              </p>
            </section>

            {/* Acceptable Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">6. Acceptable Use Policy</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>Upload copyrighted materials without authorization</li>
                <li>Use the Service for any illegal purposes</li>
                <li>Attempt to reverse engineer or hack the Service</li>
                <li>Upload malicious files, viruses, or harmful code</li>
                <li>Abuse, harass, or harm other users</li>
                <li>Scrape or data mine the Service without permission</li>
                <li>Use the Service to cheat on exams or violate academic integrity policies</li>
              </ul>
            </section>

            {/* Account Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">7. Account Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for violating these Terms or for any other reason at our sole discretion.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of modified terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">9. Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about these Terms, please contact us at:{' '}
                <a href="mailto:my.stationptot@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  my.stationptot@gmail.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              By using QuizMe, you acknowledge that you have read and understood these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
