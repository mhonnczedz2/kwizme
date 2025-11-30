'use client'

interface FeedbackDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackDrawer({ isOpen, onClose }: FeedbackDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Feedback Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Feedback & Support</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
              aria-label="Close feedback"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs text-gray-700 mb-4">
              Have feedback or a feature request? Report a bug below!
            </p>

            {/* Feedback Form */}
            <form
              className="space-y-3"
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;

                // Validate form
                if (!form.checkValidity()) {
                  const inputs = form.querySelectorAll('input[required], textarea[required]');
                  inputs.forEach(input => {
                    if (!(input as HTMLInputElement).validity.valid) {
                      input.classList.add('border-red-300');
                    }
                  });
                  return;
                }

                try {
                  const formData = new FormData(form);
                  const response = await fetch('/api/submit-feedback', {
                    method: 'POST',
                    body: formData,
                  });

                  const result = await response.json();

                  if (result.success) {
                    alert('Thank you for your feedback! We\'ll review it shortly.');
                    form.reset();
                    onClose();
                  } else {
                    alert('Failed to send feedback. Please try again.');
                  }
                } catch (error) {
                  console.error('Feedback submission error:', error);
                  alert('Failed to send feedback. Please try again.');
                }
              }}
            >
              <input type="hidden" name="_subject" value="QuizMe Feedback" />
              <input type="hidden" name="_captcha" value="false" />

              <div>
                <label htmlFor="feedback-name" className="block text-xs font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Juan Dela Cruz"
                  required
                  onInput={(e) => {
                    // Remove error styling when user starts typing
                    e.currentTarget.classList.remove('border-red-300');
                  }}
                />
              </div>

              <div>
                <label htmlFor="feedback-email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  placeholder="jdc21@up.edu.ph"
                  required
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-300');
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Feedback Type *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-orange-50', 'border-orange-200', 'text-orange-700');
                      e.currentTarget.classList.add('bg-orange-500', 'text-white', 'border-transparent');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'bug';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-transparent bg-orange-500 text-white shadow-sm"
                  >
                    Bug Report
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-blue-50', 'border-blue-200');
                      e.currentTarget.classList.add('bg-blue-600', 'text-white', 'border-transparent');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'feature';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Feature Request
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const buttons = e.currentTarget.parentElement?.querySelectorAll('button');
                      buttons?.forEach(btn => {
                        btn.classList.remove('bg-orange-500', 'bg-blue-600', 'bg-green-600', 'text-white', 'border-transparent');
                        btn.classList.add('border-2');
                      });
                      buttons?.forEach(btn => {
                        if (btn.textContent?.includes('Bug')) btn.classList.add('bg-orange-50', 'text-orange-700', 'border-orange-200');
                        if (btn.textContent?.includes('Feature')) btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
                        if (btn.textContent?.includes('General')) btn.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
                      });
                      e.currentTarget.classList.remove('bg-green-50', 'border-green-200');
                      e.currentTarget.classList.add('bg-green-600', 'text-white', 'border-transparent');
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const typeInput = form.querySelector('input[name="type"]') as HTMLInputElement;
                        if (typeInput) typeInput.value = 'feedback';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-full text-xs font-medium transition-all border-2 bg-green-50 text-green-700 border-green-200"
                  >
                    General Feedback
                  </button>
                </div>
                <input type="hidden" name="type" value="bug" required />
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-xs font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="feedback-message"
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe the issue or your suggestion..."
                  required
                  onInput={(e) => {
                    e.currentTarget.classList.remove('border-red-300');
                  }}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
              >
                Send Feedback
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Or contact directly:</p>
              <a
                href="mailto:my.stationptot@gmail.com"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium break-all"
              >
                my.stationptot@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
