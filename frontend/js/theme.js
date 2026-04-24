class ThemeManager {
  constructor() {
    this.storageKey = 'pp-theme';
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.init();
  }

  init() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const theme = savedTheme || (this.systemPrefersDark ? 'dark' : 'light');
    this.setTheme(theme, false);
    this.setupMediaQueryListener();
  }

  setTheme(theme, showNotification = true) {
    if (theme !== 'dark' && theme !== 'light') {
      theme = 'dark';
    }

    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.style.colorScheme = theme;
    localStorage.setItem(this.storageKey, theme);

    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      toggleBtn.innerHTML = theme === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    }

    if (showNotification && typeof showToast === 'function') {
      showToast(`Switched to ${theme} mode`, 'info', 2000);
    }
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.setTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
  }

  setupMediaQueryListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (!localStorage.getItem(this.storageKey)) {
        this.setTheme(event.matches ? 'dark' : 'light', false);
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}
