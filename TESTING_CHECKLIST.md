# QuizMe Deployment Testing Checklist

## Overview
This checklist covers all changes made in the recent deployment fixes. Test these scenarios to ensure everything works correctly before deploying to production.

---

## Phase 1: Critical Fixes

### Issue #1: Email Confirmation Redirect

**Test Scenario 1.1: New User Signup with Email Verification** ✅ PASSED
1. Navigate to `/auth/signup`
2. Fill out the signup form with a valid email
3. Check the "I agree to the Terms of Service and Privacy Policy" checkbox
4. Click "Create Account"
5. **Expected:** Success screen shows "Please Verify Your Email" with email icon (blue, not green)
6. **Expected:** Message shows the email address you entered
7. **Expected:** Tip about checking spam folder is visible
8. **Expected:** "Back to Login" button is present (no auto-redirect)
9. Check your email inbox
10. **Expected:** Email contains verification link with production URL (not localhost:3000)
11. Click the email verification link
12. **Expected:** Redirects to production site, not localhost
13. **Expected:** Account is verified and you can login

**Test Scenario 1.2: Environment Variable Configuration** ✅ PASSED
1. Check `.env.local` file exists with `NEXT_PUBLIC_SITE_URL`
2. In production/Vercel, verify environment variable is set to `https://quizme-virid.vercel.app`
3. **Expected:** All email links use production URL in production environment

---

### Issue #5: User Feedback After Signup

**Test Scenario 5.1: Signup Success Message** ✅ PASSED
1. Sign up with a new email address
2. Agree to terms and submit
3. **Expected:** See "Please Verify Your Email" screen (not "Account Created!")
4. **Expected:** Email icon is blue, not green checkmark
5. **Expected:** Clear instructions about email verification
6. **Expected:** NO auto-redirect after 2 seconds
7. **Expected:** "Back to Login" button is visible and clickable
8. Click "Back to Login"
9. **Expected:** Navigates to `/auth/login`

**Test Scenario 5.2: Signup Error Handling** ✅ PASSED
1. Try to sign up without checking the terms checkbox
2. **Expected:** Error message: "You must agree to the Terms of Service and Privacy Policy to continue"
3. Try to sign up with an email that already exists
4. **Expected:** Error message: "This email is already registered. Please login instead."

---

### Issue #7: Feedback Functionality

**Test Scenario 7.1: Submit Feedback from Home Page** ✅ PASSED
1. Go to home page `/`
2. Click the blue "i" info button in the top bar
3. Feedback drawer opens
4. Fill in name, email, and message
5. Click "Send Feedback"
6. **Expected:** Success message appears
7. **Expected:** Drawer closes after a delay
8. Check email `my.stationptot@gmail.com`
9. **Expected:** Feedback email is received

**Test Scenario 7.2: Submit Feedback from Login Page** ✅ PASSED
1. Go to `/auth/login`
2. Click the blue "i" info button
3. Submit feedback
4. **Expected:** Works the same as home page

**Test Scenario 7.3: Submit Feedback from Signup Page** ✅ PASSED
1. Go to `/auth/signup`
2. Click the blue "i" info button
3. Submit feedback
4. **Expected:** Works the same as home page

---

### Terms of Service & Privacy Policy

**Test Scenario T.1: Terms Page Accessibility** ✅ PASSED
1. Navigate to `/legal/terms`
2. **Expected:** Terms of Service page loads with proper styling
3. **Expected:** Dark mode works correctly
4. **Expected:** "Back to Home" link works
5. Scroll through entire page
6. **Expected:** All sections are readable and properly formatted

**Test Scenario T.2: Privacy Page Accessibility** ✅ PASSED
1. Navigate to `/legal/privacy`
2. **Expected:** Privacy Policy page loads
3. **Expected:** All 11 sections are visible and readable
4. **Expected:** Contact email link works
5. **Expected:** Dark mode support

**Test Scenario T.3: Terms Agreement on Signup** ✅ PASSED
1. Go to `/auth/signup`
2. Fill out form but DON'T check terms checkbox
3. Try to submit
4. **Expected:** Submit button is disabled
5. **Expected:** Error message appears if clicked
6. Check the terms checkbox
7. **Expected:** Submit button becomes enabled
8. Click "Terms of Service" link
9. **Expected:** Opens in new tab at `/legal/terms`
10. Click "Privacy Policy" link
11. **Expected:** Opens in new tab at `/legal/privacy`

---

## Phase 2: UX Improvements

### Issue #2: Info Bubble on Auth Pages

**Test Scenario 2.1: Info Bubble on Login Page** ✅ PASSED
1. Navigate to `/auth/login`
2. Look at top bar
3. **Expected:** Blue "i" info button is visible next to ThemeToggle
4. Click the info button
5. **Expected:** FeedbackDrawer opens from the right
6. **Expected:** Same functionality as home page
7. Close drawer with X or by clicking overlay
8. **Expected:** Drawer closes smoothly

**Test Scenario 2.2: Info Bubble on Signup Page** ✅ PASSED
1. Navigate to `/auth/signup`
2. **Expected:** Blue "i" info button is visible
3. Click it and verify FeedbackDrawer works
4. Submit feedback
5. **Expected:** Feedback submits successfully

---

### Issue #3: Forgot Password

**Test Scenario 3.1: Forgot Password Flow - Happy Path** ✅ PASSED
1. Go to `/auth/login`
2. Look below the password field
3. **Expected:** "Forgot Password?" link is visible
4. Click "Forgot Password?"
5. **Expected:** Modal appears with "Reset Password" title
6. Enter a valid email address
7. Click "Send Reset Link"
8. **Expected:** Success message: "Password reset link sent! Check your email."
9. **Expected:** Modal auto-closes after 3 seconds
10. Check email inbox
11. **Expected:** Receive password reset email
12. Click reset link in email
13. **Expected:** Redirects to `/auth/reset-password`
14. Enter new password (at least 6 characters)
15. Enter same password in confirm field
16. Click "Reset Password"
17. **Expected:** Success screen with green checkmark
18. **Expected:** Message: "Password Reset!"
19. **Expected:** Auto-redirects to login after 2 seconds
20. Try logging in with new password
21. **Expected:** Login succeeds

**Test Scenario 3.2: Forgot Password - Validation Errors** ✅ PASSED
1. Open forgot password modal
2. Enter invalid email format
3. **Expected:** Browser validation error
4. Successfully send reset link
5. Go to reset password page
6. Enter password less than 6 characters
7. Click submit
8. **Expected:** Error: "Password must be at least 6 characters"
9. Enter valid password but different confirm password
10. **Expected:** Error: "Passwords do not match"

**Test Scenario 3.3: Forgot Password Modal - UI/UX** ✅ PASSED
1. Open forgot password modal
2. Click X button in top right
3. **Expected:** Modal closes
4. Open modal again
5. Click outside modal (on overlay)
6. **Expected:** Modal closes
7. Open modal and submit with error
8. **Expected:** Error message appears in red box
9. Submit successfully
10. **Expected:** Success message in green box
11. **Expected:** Modal auto-closes after 3 seconds

**Test Scenario 3.4: Reset Password Page - Direct Access** ✅ PASSED
1. Navigate directly to `/auth/reset-password` without token
2. Try to reset password
3. **Expected:** Should show error (no valid session)

---

### Issue #4: Clickable QuizMe Banner

**Test Scenario 4.1: Banner Click on Main Page**
1. Go to home page `/`
2. Scroll down to middle or bottom of page
3. Click "QuizMe" text in the top bar
4. **Expected:** Page smoothly scrolls to the top
5. **Expected:** Hover over banner shows cursor pointer
6. **Expected:** Hover shows opacity change

**Test Scenario 4.2: Banner Click on Login Page**
1. Go to `/auth/login`
2. Click "QuizMe" text in top bar
3. **Expected:** Navigates to home page `/`
4. **Expected:** Hover shows cursor pointer and opacity change

**Test Scenario 4.3: Banner Click on Signup Page**
1. Go to `/auth/signup`
2. Click "QuizMe" banner
3. **Expected:** Navigates to home page
4. Fill out signup form (don't submit)
5. Click "QuizMe" banner
6. **Expected:** Still navigates to home (form data lost - this is expected behavior)

**Test Scenario 4.4: Banner Click on Signup Success Screen**
1. Complete signup successfully
2. On "Please Verify Your Email" screen
3. Click "QuizMe" banner in top bar
4. **Expected:** Navigates to home page

**Test Scenario 4.5: Banner Click on Reset Password Page**
1. Go to `/auth/reset-password` (with valid token)
2. Click "QuizMe" banner
3. **Expected:** Navigates to home page

---

## Phase 3: Polish

### Issue #6: Quiz History Review UX

**Test Scenario 6.1: Quiz History Card Interaction**
1. Login to the app
2. Complete at least one quiz (if none exist)
3. Go to Quiz History tab
4. Expand a quiz to see session history
5. Hover over a completed session card
6. **Expected:** Border changes to blue
7. **Expected:** Shadow becomes more prominent (shadow-md)
8. **Expected:** "Review →" arrow slides to the right slightly
9. **Expected:** "Review →" text color darkens
10. **Expected:** Cursor shows pointer
11. Click anywhere on the session card
12. **Expected:** Navigates to quiz review page
13. **Expected:** All answers and scores are displayed correctly

**Test Scenario 6.2: Visual Feedback Consistency**
1. Open Quiz History
2. Hover over different session cards
3. **Expected:** All cards show consistent hover effects
4. **Expected:** Arrow animation is smooth, not jerky
5. Move mouse quickly on/off cards
6. **Expected:** Transitions are smooth

---

## Cross-Feature Integration Tests

### Integration Test 1: Complete User Journey - New User
1. Go to home page
2. Click "Get Started" or navigate to signup
3. Fill out signup form with valid data
4. Forget to check terms checkbox
5. **Expected:** Can't submit
6. Click "Terms of Service" link
7. **Expected:** Opens in new tab, read terms
8. Close tab, return to signup
9. Click "Privacy Policy" link
10. **Expected:** Opens in new tab, read privacy
11. Close tab, check terms checkbox
12. Submit signup
13. **Expected:** See email verification screen
14. Click "Back to Login"
15. Try to login (email not verified yet)
16. **Expected:** Should still work (email verification is optional)
17. Check email, click verification link
18. **Expected:** Account is verified
19. Login successfully
20. **Expected:** Redirected to home page

### Integration Test 2: Password Reset Journey
1. Go to login page
2. Click "Forgot Password?"
3. Enter email
4. Submit and wait for success
5. Check email
6. Click reset link
7. Enter new password
8. Submit reset
9. Wait for auto-redirect
10. Login with new password
11. **Expected:** Login successful
12. Access all features normally

### Integration Test 3: Feedback from All Pages
1. Submit feedback from home page
2. Submit feedback from login page
3. Submit feedback from signup page
4. **Expected:** All feedbacks arrive at my.stationptot@gmail.com
5. **Expected:** All have proper formatting
6. **Expected:** All reference correct page origins

### Integration Test 4: Navigation Flow
1. Start at home page
2. Click login → Click QuizMe banner → Back to home
3. Click signup → Click QuizMe banner → Back to home
4. Click login → Click "Forgot Password?" → Close modal → Click QuizMe banner → Home
5. Click "Back" button in browser after each navigation
6. **Expected:** Browser history works correctly
7. **Expected:** No broken navigation loops

---

## Dark Mode Testing

### Dark Mode Test 1: All Pages Support Dark Mode
Test dark mode on each page:
1. Home page `/`
2. Login page `/auth/login`
3. Signup page `/auth/signup`
4. Reset password `/auth/reset-password`
5. Terms page `/legal/terms`
6. Privacy page `/legal/privacy`
7. Forgot password modal

**Expected for all:**
- Proper contrast between text and background
- All buttons visible and readable
- Form inputs have proper styling
- Hover states work correctly
- No white flashes or unstyled content

### Dark Mode Test 2: Toggle During User Flow
1. Start signup form in light mode
2. Toggle to dark mode mid-form
3. **Expected:** Form data persists
4. Submit form
5. **Expected:** Success screen respects dark mode
6. Toggle dark mode on feedback drawer
7. **Expected:** Smooth transition

---

## Mobile Responsiveness Testing

### Mobile Test 1: Auth Pages on Mobile
Test on mobile viewport (375px width or actual mobile device):
1. Login page
   - **Expected:** Form is readable and usable
   - **Expected:** "Forgot Password?" link is tappable (min 44x44px)
   - **Expected:** Info button is tappable
2. Signup page
   - **Expected:** All form fields are accessible
   - **Expected:** Terms checkbox is large enough to tap
   - **Expected:** Terms links are tappable
3. Reset password page
   - **Expected:** Password fields with show/hide toggles work

### Mobile Test 2: Modals and Drawers
1. Open forgot password modal on mobile
2. **Expected:** Modal fits screen, overlay works
3. **Expected:** Can close with X button
4. Open feedback drawer
5. **Expected:** Drawer slides in properly
6. **Expected:** Form is usable on mobile

### Mobile Test 3: Quiz History on Mobile
1. View Quiz History on mobile
2. **Expected:** Session cards are tappable
3. Tap on session card
4. **Expected:** Navigates to review
5. **Expected:** Hover states don't interfere with tap

---

## Error Handling & Edge Cases

### Edge Case Test 1: Network Failures
1. Turn off internet/disconnect
2. Try to submit signup form
3. **Expected:** Error message about network
4. Try to submit feedback
5. **Expected:** Proper error handling
6. Try forgot password
7. **Expected:** Shows error, doesn't crash

### Edge Case Test 2: Invalid Email Formats
1. Try signup with invalid emails:
   - `notanemail`
   - `@example.com`
   - `user@`
   - `user @example.com`
2. **Expected:** Browser validation catches these
3. Try forgot password with same invalid emails
4. **Expected:** Validation works

### Edge Case Test 3: Already Signed Up User
1. Sign up with email `test@example.com`
2. Try to sign up again with same email
3. **Expected:** Error: "This email is already registered. Please login instead."
4. Click "Sign in" link at bottom
5. **Expected:** Navigates to login
6. Login with that email
7. **Expected:** Successful login

### Edge Case Test 4: XSS Prevention
1. Try to enter HTML/script tags in:
   - Signup name field: `<script>alert('xss')</script>`
   - Feedback message: `<img src=x onerror=alert(1)>`
2. Submit forms
3. **Expected:** Tags are escaped/sanitized, no scripts execute

### Edge Case Test 5: Empty Submissions
1. Try to submit signup with empty required fields
2. **Expected:** Browser validation prevents submission
3. Try to submit forgot password with empty email
4. **Expected:** Validation error
5. Try to submit reset password with empty fields
6. **Expected:** Validation errors

---

## Performance Testing

### Performance Test 1: Page Load Times
1. Measure time to load each page:
   - Home page
   - Login page
   - Signup page
   - Terms page
   - Privacy page
2. **Expected:** All pages load in < 2 seconds
3. **Expected:** No layout shifts (CLS < 0.1)

### Performance Test 2: Animation Smoothness
1. Test all animations:
   - Background grid animation
   - Modal open/close
   - Drawer slide
   - Arrow slide on quiz history hover
   - Scroll to top on banner click
2. **Expected:** 60fps, smooth transitions
3. **Expected:** No janky animations

---

## Browser Compatibility Testing

### Browser Test: Test on Multiple Browsers
Test all scenarios on:
1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest, macOS/iOS)
4. Edge (latest)

**Expected:** All features work consistently across browsers

---

## Production Environment Testing

### Production Test 1: Environment Variables
After deploying to Vercel:
1. Check that emails have production URLs
2. **Expected:** Links point to `https://quizme-virid.vercel.app`, not localhost
3. Test feedback submission
4. **Expected:** Uses production URL in headers

### Production Test 2: Supabase Configuration
1. Verify in Supabase Dashboard:
   - Site URL is set to production
   - Redirect URLs include production domain
2. Test email confirmation flow in production
3. **Expected:** Redirects work correctly

---

## Regression Testing

### Regression Test 1: Existing Features Still Work
1. Create a quiz from uploaded file
2. Take a quiz
3. View quiz results
4. Check quiz history
5. Delete a quiz
6. **Expected:** All core features work as before

### Regression Test 2: Existing UI Elements
1. Theme toggle works everywhere
2. Back buttons work
3. Form validations work
4. Error messages display correctly
5. Success messages display correctly

---

## Summary Checklist

Use this quick checklist for final verification:

- [ ] Email links use production URL (not localhost)
- [ ] Signup shows email verification screen (not auto-redirect)
- [ ] Terms checkbox required on signup
- [ ] Terms and Privacy pages load correctly
- [ ] Feedback works from all pages
- [ ] Info bubble present on login and signup pages
- [ ] Forgot password modal works
- [ ] Reset password page works
- [ ] Password reset emails received
- [ ] QuizMe banner clickable on all pages
- [ ] Quiz History hover effects work
- [ ] All features work in dark mode
- [ ] Mobile responsive on all pages
- [ ] No console errors on any page
- [ ] All links navigate correctly
- [ ] Browser back button works properly
- [ ] Forms validate properly
- [ ] Error handling works
- [ ] No XSS vulnerabilities
- [ ] Production environment variables set

---

## Testing Priority

**Priority 1 (Must Test):**
- Email confirmation redirect
- Signup success screen
- Terms checkbox validation
- Feedback submission
- Forgot password flow
- QuizMe banner navigation

**Priority 2 (Should Test):**
- Info bubbles on auth pages
- Dark mode on all pages
- Mobile responsiveness
- Error handling

**Priority 3 (Nice to Test):**
- Quiz History hover effects
- Animation smoothness
- Browser compatibility
- Performance metrics

---

## Reporting Issues

If you find any issues during testing, note:
1. Which test scenario failed
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and device used
5. Screenshots/console errors if applicable

Good luck with testing! 🚀
