# Firebase Integration & Community Sync

## Tasks

- [/] Execution
    - [x] Revert `index.html` to table structure with scrollbars
    - [/] Update `app.js` to render user table with password column
    - [ ] Implement `changeUserPassword(userId)` functionality
    - [ ] Style the user management card to match "Station Insights"es
- [x] Load users from Firebase in admin dashboard
- [x] Implement real-time Community Tab sync
    - [x] Global catch/post sync
    - [x] Global likes & comments sync
    - [x] Real-time updates for all users
- [x] Push changes to GitHub
- [/] Unify Emoji Aesthetics: Matching icons and standardized sizes
  - [ ] Standardize map marker font sizes in `style.css`
  - [ ] Standardize filter emoji font sizes in `style.css`
  - [ ] Align freshwater marker icons in `app.js` with filters
  - [ ] Verify visual consistency across tabs
- [ ] Push changes to GitHub
- [x] Fix filter sidebar scrolling
- [x] Disable Manage Subscription for beta
- [x] Verify Admin/Support Logins on Live Site
- [x] Fix Admin Dashboard button visibility
- [/] Security Audit & Remediation
  - [x] Audit for XSS and credential exposure
  - [/] Implement `sanitizeHTML` and secure rendering
  - [ ] Secure administrative credentials
