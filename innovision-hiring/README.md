# Innovision Global â€” UAE Hiring & Assessment Platform
**Version 1.0.0** | Â© 2024 Innovision Global Pvt. Ltd.

---

## ðŸ“ File Structure

```
innovision-hiring/
â”œâ”€â”€ index.html              â† Main entry point (open this in browser)
â”œâ”€â”€ css/
â”‚   â””â”€â”€ styles.css          â† All styles
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ data.js             â† Roles, question bank, admin credentials, storage
â”‚   â”œâ”€â”€ auth.js             â† Login / logout / session
â”‚   â”œâ”€â”€ candidate.js        â† Candidate portal flow & scoring
â”‚   â”œâ”€â”€ admin.js            â† Admin dashboard, tables, modal
â”‚   â”œâ”€â”€ questionbank.js     â† Question bank management & file upload
â”‚   â””â”€â”€ app.js              â† App init, navigation, toast notifications
â”œâ”€â”€ assets/
â”‚   â””â”€â”€ favicon.svg         â† Site icon
â””â”€â”€ README.md               â† This file
```

---

## ðŸš€ Deployment Options

### Option 1 â€” Static Web Hosting (Recommended)
Upload all files to any static hosting service **as-is**, preserving the folder structure.

| Service | Steps |
|---------|-------|
| **cPanel / FTP** | Upload entire `innovision-hiring/` folder to `public_html/hiring/` â†’ Access at `yourdomain.com/hiring/` |
| **Netlify** | Drag & drop the folder at netlify.com/drop â†’ Live instantly |
| **GitHub Pages** | Push to a GitHub repo â†’ Enable Pages â†’ Live at `yourname.github.io/innovision-hiring/` |
| **Vercel** | `vercel deploy` from the folder |
| **AWS S3** | Enable static hosting on bucket â†’ Upload all files |

### Option 2 â€” Embed in Existing Website
Add a link on your Innovision website homepage:
```html
<a href="/hiring/index.html">Apply Now â€” UAE Jobs</a>
```

### Option 3 â€” iframe Embed
```html
<iframe src="/hiring/index.html" width="100%" height="800px" frameborder="0"></iframe>
```

---

## ðŸ” Changing Admin Passwords

Edit `js/data.js`, find the `ADMINS` object at the top:

```javascript
const ADMINS = {
  'admin':      { password: 'YOUR_NEW_PASSWORD', role: 'Super Admin',  display: 'Admin' },
  'hr_manager': { password: 'YOUR_NEW_PASSWORD', role: 'HR Manager',   display: 'HR Manager' },
  'recruiter':  { password: 'YOUR_NEW_PASSWORD', role: 'Recruiter',    display: 'Recruiter' }
};
```

You can add/remove admins freely. **Important:** For production, replace this with a proper server-side API.

---

## â“ Managing Questions (Question Bank)

### Via Admin Dashboard
1. Log in â†’ Sidebar â†’ **Question Bank**
2. Select a role section
3. Either:
   - **Upload CSV/JSON** â€” drag & drop or click browse
   - **Add manually** â€” fill the form and click "Add Question"

### CSV Format
```
type,question,passage
situational,"Describe how you handle conflict at a UAE worksite.",
reading,"What does this passage say about PPE?","All workers must wear helmets and safety boots..."
comprehension,"What would you do if you noticed an unsafe condition?",
```

**Valid types:** `reading` | `comprehension` | `situational`

### JSON Format
```json
[
  {
    "type": "situational",
    "question": "Describe how you would handle a conflict at a UAE worksite."
  },
  {
    "type": "reading",
    "question": "What does the passage say about PPE requirements?",
    "passage": "All workers must wear helmets and safety boots at all times on UAE sites."
  }
]
```

---

## ðŸ“Š Data Storage

- **Current:** Browser `localStorage` â€” data persists per device/browser
- **Limitation:** Each browser/device has its own data; no shared multi-user database

### For Production (Recommended Upgrade)
Replace `loadAdminData()` and `saveAdminData()` in `js/data.js` with API calls:

```javascript
// Example with Firebase Firestore
async function loadAdminData() {
  const snap = await getDocs(collection(db, 'candidates'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveAdminData(data) {
  // write last record to Firestore
}
```

**Recommended backend options:** Firebase, Supabase, or a simple Node.js/Express + MongoDB API.

---

## ðŸŽ¨ Customisation

### Company Colours
Edit CSS variables at the top of `css/styles.css`:
```css
:root {
  --gold:  #c9a84c;   /* Primary brand gold */
  --gold2: #e8c97a;   /* Light gold */
  --blue:  #1e6fff;   /* Accent blue */
}
```

### Adding a New Job Role
In `js/data.js`, add to `ROLES`:
```javascript
const ROLES = {
  ...
  cook: {
    label: 'Cook / Kitchen Staff',
    icon:  'ðŸ³',
    desc:  'Cooking staff for UAE hotel & restaurant clients.'
  }
};
```
Then add questions under `QB.cook = [...]`.

### Company Name / Branding
Search and replace `Innovision Global` in `index.html` with your brand name.

---

## ðŸ“± Browser Support
- Chrome 80+ âœ…
- Firefox 75+ âœ…
- Safari 13+ âœ…
- Edge 80+ âœ…
- Mobile (iOS Safari, Android Chrome) âœ…

**Voice recording** uses the Web Speech API â€” supported on Chrome and Edge. Falls back to demo mode on Firefox/Safari.

---

## ðŸ“ž Technical Support
For deployment help, backend integration, or custom features, contact your web development team.

**Platform:** Innovision Global Pvt. Ltd.
**Compliance:** MOIA Registered Â· UAE Labour Law Â· PDPA Data Guidelines

