// ============================================================================
// CLEAR BROWSER LOCAL STORAGE FOR KWIZME (DEVELOPMENT ONLY)
// ============================================================================
//
// PURPOSE: Remove all cached authentication and app data from browser
// USE CASE: Development/Testing - allows fresh signup after DB reset
//
// ⚠️  WARNING: THIS WILL SIGN YOU OUT AND DELETE ALL LOCAL DATA!
//
// WHAT THIS DOES:
// 1. Clears Supabase auth tokens (session, refresh tokens)
// 2. Clears KwizMe theme preferences
// 3. Clears local SQLite database (anonymous user data)
// 4. Clears all KwizMe-related localStorage items
// 5. Clears sessionStorage
// 6. Clears cookies (Supabase auth cookies)
//
// HOW TO USE:
// 1. Open your KwizMe app in browser (http://localhost:XXXX)
// 2. Open DevTools (F12 or Right Click → Inspect)
// 3. Go to Console tab
// 4. Copy and paste this ENTIRE script
// 5. Press Enter to run
// 6. Refresh the page (F5)
//
// ============================================================================

(function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧹 KwizMe Local Storage Cleanup Script');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Track what we're clearing
    let cleared = {
        localStorage: [],
        sessionStorage: [],
        cookies: [],
        databases: []
    };

    // ========================================================================
    // STEP 1: Clear localStorage (auth tokens, app data, theme)
    // ========================================================================
    console.log('📋 Step 1/4: Clearing localStorage...');

    // Get all keys before clearing (for reporting)
    const localStorageKeys = Object.keys(localStorage);

    if (localStorageKeys.length > 0) {
        console.log(`   Found ${localStorageKeys.length} items:`);
        localStorageKeys.forEach(key => {
            console.log(`   • ${key}`);
            cleared.localStorage.push(key);
        });

        // Clear all localStorage
        localStorage.clear();
        console.log('   ✅ Cleared all localStorage items');
    } else {
        console.log('   ℹ️  No localStorage items found');
    }
    console.log('');

    // ========================================================================
    // STEP 2: Clear sessionStorage
    // ========================================================================
    console.log('📋 Step 2/4: Clearing sessionStorage...');

    const sessionStorageKeys = Object.keys(sessionStorage);

    if (sessionStorageKeys.length > 0) {
        console.log(`   Found ${sessionStorageKeys.length} items:`);
        sessionStorageKeys.forEach(key => {
            console.log(`   • ${key}`);
            cleared.sessionStorage.push(key);
        });

        sessionStorage.clear();
        console.log('   ✅ Cleared all sessionStorage items');
    } else {
        console.log('   ℹ️  No sessionStorage items found');
    }
    console.log('');

    // ========================================================================
    // STEP 3: Clear cookies (especially Supabase auth cookies)
    // ========================================================================
    console.log('📋 Step 3/4: Clearing cookies...');

    const cookies = document.cookie.split(';');

    if (cookies.length > 0 && cookies[0] !== '') {
        console.log(`   Found ${cookies.length} cookies`);

        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();

            // Clear cookie for all possible paths and domains
            const clearCookie = (name, path = '/', domain = '') => {
                const domainPart = domain ? `domain=${domain};` : '';
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ${domainPart} path=${path};`;
            };

            // Try multiple paths
            clearCookie(cookieName, '/');
            clearCookie(cookieName, '/', window.location.hostname);
            clearCookie(cookieName, '/', `.${window.location.hostname}`);

            console.log(`   • Cleared: ${cookieName}`);
            cleared.cookies.push(cookieName);
        });

        console.log('   ✅ Cleared all cookies');
    } else {
        console.log('   ℹ️  No cookies found');
    }
    console.log('');

    // ========================================================================
    // STEP 4: Clear IndexedDB (Local SQLite database)
    // ========================================================================
    console.log('📋 Step 4/4: Clearing IndexedDB databases...');

    if (window.indexedDB) {
        // This is async, but we'll try our best
        indexedDB.databases().then(databases => {
            if (databases.length > 0) {
                console.log(`   Found ${databases.length} database(s):`);

                databases.forEach(db => {
                    console.log(`   • Deleting: ${db.name}`);
                    const deleteRequest = indexedDB.deleteDatabase(db.name);

                    deleteRequest.onsuccess = () => {
                        console.log(`   ✅ Deleted: ${db.name}`);
                        cleared.databases.push(db.name);
                    };

                    deleteRequest.onerror = () => {
                        console.error(`   ❌ Failed to delete: ${db.name}`);
                    };
                });
            } else {
                console.log('   ℹ️  No IndexedDB databases found');
            }
        }).catch(err => {
            console.warn('   ⚠️  Could not list IndexedDB databases:', err);
        });
    } else {
        console.log('   ℹ️  IndexedDB not supported');
    }
    console.log('');

    // ========================================================================
    // Summary Report
    // ========================================================================
    setTimeout(() => {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 CLEANUP SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`✅ localStorage:     ${cleared.localStorage.length} items cleared`);
        console.log(`✅ sessionStorage:   ${cleared.sessionStorage.length} items cleared`);
        console.log(`✅ Cookies:          ${cleared.cookies.length} cookies cleared`);
        console.log(`✅ IndexedDB:        ${cleared.databases.length} databases deleted`);
        console.log('');
        console.log('🎯 Key items that were cleared:');

        // Show important Supabase auth items
        const supabaseItems = cleared.localStorage.filter(key =>
            key.includes('supabase') || key.includes('auth')
        );
        if (supabaseItems.length > 0) {
            console.log('   Auth/Session data:');
            supabaseItems.forEach(item => console.log(`   • ${item}`));
        }

        // Show KwizMe app data
        const kwizmeItems = cleared.localStorage.filter(key =>
            key.includes('quizme')
        );
        if (kwizmeItems.length > 0) {
            console.log('   KwizMe app data:');
            kwizmeItems.forEach(item => console.log(`   • ${item}`));
        }

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 NEXT STEPS:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('1. ✅ Local storage cleared!');
        console.log('2. 🔄 Refresh the page (press F5)');
        console.log('3. 📝 You should now be able to sign up with the same email');
        console.log('');
        console.log('⚠️  NOTE: Make sure you also ran the clear_all_data.sql script');
        console.log('   in Supabase Dashboard to clear the database!');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
    }, 1000); // Wait 1 second for IndexedDB operations to complete

})();
