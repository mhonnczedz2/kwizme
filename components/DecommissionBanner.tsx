export default function DecommissionBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
        <div className="text-5xl mb-4">
          <span role="img" aria-label="heart">💛</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Thank You, Kwizme Fam
        </h1>

        <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
          <p>
            It&apos;s been an incredible journey building Kwizme and watching so
            many of you use it to study, learn, and crush your exams. Every
            quiz generated, every score celebrated — that was all you.
          </p>

          <p>
            Kwizme has <strong className="text-red-500 dark:text-red-400">shut down as of May 17, 2026</strong>.
            We know change is hard, and we&apos;re grateful for every moment
            you spent here.
          </p>

          <p>
            But this isn&apos;t really goodbye — Kwizme is now{' '}
            <strong className="text-green-600 dark:text-green-400">open source</strong>!
            If you&apos;d like to keep using it, you can run your own server:
          </p>

          <a
            href="https://github.com/mhonnczedz2/kwizme.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 font-mono text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors break-all"
          >
            github.com/mhonnczedz2/kwizme
          </a>

          <p>
            Feel free to reach out anytime:
          </p>

          <a
            href="mailto:my.stationptot@gmail.com"
            className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            my.stationptot@gmail.com
          </a>

          <p className="italic text-gray-500 dark:text-gray-400">
            Good luck on your studies — we&apos;re rooting for you, always.
          </p>
        </div>
      </div>
    </div>
  );
}
