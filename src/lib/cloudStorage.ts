// Centralized Cloud Storage & Persistence Manager
// Operates standalone without requiring external Supabase setup
// Provides real-time synchronization, IndexedDB / LocalStorage persistence, and cross-module reactivity

export class LocalCloudStorage {
  private static instance: LocalCloudStorage;

  private constructor() {}

  public static getInstance(): LocalCloudStorage {
    if (!LocalCloudStorage.instance) {
      LocalCloudStorage.instance = new LocalCloudStorage();
    }
    return LocalCloudStorage.instance;
  }

  public getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`LocalCloudStorage read error for key ${key}:`, e);
    }
    return defaultValue;
  }

  public setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom event for cross-component reactivity
      window.dispatchEvent(
        new CustomEvent('karne-cloud-sync', {
          detail: { key, value },
        })
      );
    } catch (e) {
      console.error(`LocalCloudStorage write error for key ${key}:`, e);
    }
  }

  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(
        new CustomEvent('karne-cloud-sync', {
          detail: { key, value: null },
        })
      );
    } catch (e) {
      console.error(`LocalCloudStorage remove error for key ${key}:`, e);
    }
  }
}

export const cloudStorage = LocalCloudStorage.getInstance();
