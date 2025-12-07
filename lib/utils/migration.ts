// Migration utility to preserve user data during rebrand
export const migrateUserData = () => {
  // Migrate theme preference
  const oldTheme = localStorage.getItem('quizme-theme');
  if (oldTheme) {
    localStorage.setItem('kwizme-theme', oldTheme);
    localStorage.removeItem('quizme-theme');
  }

  // Add other data migrations as needed
  console.log('User data migration completed');
};