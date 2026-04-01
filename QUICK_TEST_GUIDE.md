<!-- Quick Start: Testing Dark Mode / Light Mode -->

# Dark Mode & Light Mode - Quick Test Guide

## 🚀 How to Test It

### Step 1: Open Any PathPilot Page
- Open `index.html` (landing) or `dashboard.html` (logged in)

### Step 2: Look for the Theme Toggle
- Find the **moon icon 🌙** or **sun icon ☀️** in the navbar
- Located between nav links and Sign Out button

### Step 3: Click to Switch
- Click the icon
- Theme switches instantly with smooth transitions
- Toast notification appears: "Switched to ☀️ Light mode" or "🌙 Dark mode"

### Step 4: Refresh Page
- Press F5 or Ctrl+R
- Theme persists! Your choice is saved

---

## 🎨 Visual Comparison

### Dark Mode (Default)
- Background: Deep noir (#060910)
- Text: Cool white (#f0f4ff)
- Best for: Evening, low-light environments
- Icon: Moon 🌙

### Light Mode
- Background: Soft white (#f8f9fc)
- Text: Dark gray (#1f2937)
- Best for: Daytime, accessibility, printing
- Icon: Sun ☀️

---

## ✅ What to Check

- [ ] Toggle button appears on all pages
- [ ] Clicking toggles theme instantly
- [ ] Smooth fade transition (not jarring)
- [ ] All text is readable in both modes
- [ ] Colors match the design (no weird colors)
- [ ] LocalStorage saves preference (open DevTools → Application → localStorage → `pp-theme`)
- [ ] Preference persists after page refresh
- [ ] Preference loads on first visit if system theme is set

---

## 🔧 Developer Testing

Open browser DevTools (F12) and test:

```javascript
// Check current theme
window.themeManager.getCurrentTheme()
// Returns: "dark" or "light"

// Switch theme programmatically
window.themeManager.setTheme('light', true)
window.themeManager.toggle()

// Check localStorage
localStorage.getItem('pp-theme')
// Returns: "light" or "dark"
```

---

## 📱 Browser Compatibility

Works in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

---

## 🎯 All Pages with Theme Support

1. `index.html` - Landing page
2. `dashboard.html` - Main dashboard
3. `career.html` - Career exploration
4. `focus.html` - Focus timer
5. `leaderboard.html` - Leaderboard
6. `wellness.html` - Wellness tracker
7. `roadmap.html` - Roadmap builder
8. `ai.html` - AI assistant

**Every page has the theme toggle button!**

---

## 🐛 Troubleshooting

**Toggle button not showing?**
- Ensure `js/theme.js` is loaded before other scripts
- Check browser console for errors (F12)

**Theme not switching?**
- Clear browser cache and reload
- Check localStorage is enabled
- Try in a different browser

**Colors look wrong?**
- Inspect element with DevTools
- Check if CSS variables are applied: `html { --bg: ... }`
- Verify `data-theme` attribute on `<html>` element

---

## 📝 Implementation Files

All changes are in these files:

**New:**
- `frontend/js/theme.js` - Theme manager logic (auto-loads)

**Modified:**
- `frontend/css/main.css` - Added light mode variables + transitions + button style
- `frontend/*.html` - All 8 pages: added toggle button + script integration

**No breaking changes** - Everything is backwards compatible!

---

## 🎉 That's It!

Your PathPilot now has a professional dark mode / light mode system.

**Next steps:**
1. Test on all pages
2. Show users the new toggle button
3. Enjoy the improved UX! 🌙☀️
