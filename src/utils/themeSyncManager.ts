type ThemeSyncCallback = (theme: 'light' | 'dark') => void;

export class ThemeSyncManager {
  private static instance: ThemeSyncManager;
  private callbacks: Set<ThemeSyncCallback> = new Set();
  private channel: BroadcastChannel | null = null;
  
  private constructor() {
    this.initializeBroadcastChannel();
    this.setupStorageListener();
  }
  
  static getInstance(): ThemeSyncManager {
    if (!ThemeSyncManager.instance) {
      ThemeSyncManager.instance = new ThemeSyncManager();
    }
    return ThemeSyncManager.instance;
  }
  
  private initializeBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('theme-sync');
      this.channel.addEventListener('message', (event) => {
        if (event.data.type === 'THEME_CHANGED') {
          this.notifyCallbacks(event.data.theme);
        }
      });
    }
  }
  
  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme' && event.newValue) {
        try {
          const theme = JSON.parse(event.newValue);
          this.notifyCallbacks(theme);
        } catch (error) {
          console.error('Error parsing theme from storage:', error);
        }
      }
    });
  }
  
  subscribe(callback: ThemeSyncCallback): () => void {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }
  
  broadcastThemeChange(theme: 'light' | 'dark') {
    // Broadcast via BroadcastChannel for same-origin tabs
    if (this.channel) {
      this.channel.postMessage({
        type: 'THEME_CHANGED',
        theme,
        timestamp: Date.now()
      });
    }
    
    // Also update localStorage to trigger storage events
    localStorage.setItem('theme', JSON.stringify(theme));
  }
  
  private notifyCallbacks(theme: 'light' | 'dark') {
    this.callbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme sync callback:', error);
      }
    });
  }
  
  getCurrentTheme(): 'light' | 'dark' | null {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting current theme from storage:', error);
    }
    return null;
  }
  
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.callbacks.clear();
  }
}

// Export singleton instance
export const themeSyncManager = ThemeSyncManager.getInstance();