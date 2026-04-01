// ═══════════════════════════════════════════
//  PathPilot v2 — Theme Manager
//  Handles dark mode / light mode switching
// ═══════════════════════════════════════════

class ThemeManager {
  constructor() {
    this.storageKey = 'pp-theme';
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const theme = savedTheme || (this.systemPrefersDark ? 'dark' : 'light');
    this.setTheme(theme, false); // Don't show toast on initial load
    this.setupMediaQueryListener();
  }

  setTheme(theme, showNotification = true) {
    if (theme !== 'dark' && theme !== 'light') theme = 'dark';
    
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);

    // Update theme toggle button state if it exists
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      toggleBtn.innerHTML = theme === 'dark' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    }

    if (showNotification) {
      showToast(`Switched to ${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode`, 'info', 2000);
    }
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme, true);
  }

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  setupMediaQueryListener() {
    // Listen for system theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a theme (check if localStorage is empty)
      if (!localStorage.getItem(this.storageKey)) {
        const theme = e.matches ? 'dark' : 'light';
        this.setTheme(theme, false);
      }
    });
  }
}

// Initialize theme manager on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}
