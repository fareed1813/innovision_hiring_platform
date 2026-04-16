# Innovision Overseas — UAE Hiring & Assessment Platform
**Version 1.0.0** | © 2024 Innovision Overseas Pvt. Ltd.

---

## 📁 File Structure

```
innovision-hiring/
├── index.html              ← Main entry point (open this in browser)
├── css/
│   └── styles.css          ← All styles
├── js/
│   ├── data.js             ← Roles, question bank, admin credentials, storage
│   ├── auth.js             ← Login / logout / session
│   ├── candidate.js        ← Candidate portal flow & scoring
│   ├── admin.js            ← Admin dashboard, tables, modal
│   ├── questionbank.js     ← Question bank management & file upload
│   └── app.js              ← App init, navigation, toast notifications
├── assets/
│   └── favicon.svg         ← Site icon
└── README.md               ← This file
```

---

## 🚀 Deployment Options

### Option 1 — Static Web Hosting (Recommended)
Upload all files to any static hosting service **as-is**, preserving the folder structure.

| Service | Steps |
|---------|-------|
| **cPanel / FTP** | Upload entire `innovision-hiring/` folder to `public_html/hiring/` → Access at `yourdomain.com/hiring/` |
| **Netlify** | Drag & drop the folder at netlify.com/drop → Live instantly |
| **GitHub Pages** | Push to a GitHub repo → Enable Pages → Live at `yourname.github.io/innovision-hiring/` |
| **Vercel** | `vercel deploy` from the folder |
| **AWS S3** | Enable static hosting on bucket → Upload all files |

### Option 2 — Embed in Existing Website
Add a link on your Innovision website homepage:
```html
<a href="/hiring/index.html">Apply Now — UAE Jobs</a>
```

### Option 3 — iframe Embed
```html
<iframe src="/hiring/index.html" width="100%" height="800px" frameborder="0"></iframe>
```

---

## 🔐 Changing Admin Passwords

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

## ❓ Managing Questions (Question Bank)

### Via Admin Dashboard
1. Log in → Sidebar → **Question Bank**
2. Select a role section
3. Either:
   - **Upload CSV/JSON** — drag & drop or click browse
   - **Add manually** — fill the form and click "Add Question"

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

## 📊 Data Storage

- **Current:** Browser `localStorage` — data persists per device/browser
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

## 🎨 Customisation

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
    icon:  '🍳',
    desc:  'Cooking staff for UAE hotel & restaurant clients.'
  }
};
```
Then add questions under `QB.cook = [...]`.

### Company Name / Branding
Search and replace `Innovision Overseas` in `index.html` with your brand name.

---

## 📱 Browser Support
- Chrome 80+ ✅
- Firefox 75+ ✅
- Safari 13+ ✅
- Edge 80+ ✅
- Mobile (iOS Safari, Android Chrome) ✅

**Voice recording** uses the Web Speech API — supported on Chrome and Edge. Falls back to demo mode on Firefox/Safari.

---

## 📞 Technical Support
For deployment help, backend integration, or custom features, contact your web development team.

**Platform:** Innovision Overseas Pvt. Ltd.
**Compliance:** MOIA Registered · UAE Labour Law · PDPA Data Guidelines
