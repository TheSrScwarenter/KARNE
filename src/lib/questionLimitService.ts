import { cloudStorage } from './cloudStorage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { idbStorage } from './indexedDbStorage';

export const DEFAULT_MAX_QUESTIONS_PER_STUDENT = 400;
const GLOBAL_LIMIT_KEY = 'karne_max_question_limit';
const CUSTOM_USER_LIMITS_KEY = 'karne_custom_user_question_limits';

export interface QuestionQuotaStatus {
  currentCount: number;
  maxLimit: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  isNearLimit: boolean; // >= 85%
}

class QuestionLimitService {
  private inMemoryGlobalLimit: number | null = null;
  private inMemoryCustomLimits: Record<string, number> | null = null;
  private isInitialized = false;

  constructor() {
    this.initAsync();
  }

  private async initAsync(): Promise<void> {
    try {
      // 1. Local / IndexedDB
      const localLimit = cloudStorage.getItem<number>(GLOBAL_LIMIT_KEY, DEFAULT_MAX_QUESTIONS_PER_STUDENT);
      this.inMemoryGlobalLimit = Number(localLimit) || DEFAULT_MAX_QUESTIONS_PER_STUDENT;

      const customMap = cloudStorage.getItem<Record<string, number>>(CUSTOM_USER_LIMITS_KEY, {});
      this.inMemoryCustomLimits = customMap || {};

      // 2. Supabase Cloud Sync (if table exists)
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('key', 'max_question_limit')
            .maybeSingle();

          if (!error && data && data.value) {
            const parsed = parseInt(data.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
              this.inMemoryGlobalLimit = parsed;
              cloudStorage.setItem(GLOBAL_LIMIT_KEY, parsed);
            }
          }
        } catch {
          // Graceful fallback if system_settings table does not exist
        }
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('QuestionLimitService initAsync error:', e);
      this.inMemoryGlobalLimit = DEFAULT_MAX_QUESTIONS_PER_STUDENT;
    }
  }

  /**
   * Returns current global question limit per student (Default: 400)
   */
  public getGlobalLimit(): number {
    if (this.inMemoryGlobalLimit !== null && this.inMemoryGlobalLimit > 0) {
      return this.inMemoryGlobalLimit;
    }
    const val = cloudStorage.getItem<number>(GLOBAL_LIMIT_KEY, DEFAULT_MAX_QUESTIONS_PER_STUDENT);
    const num = Number(val);
    this.inMemoryGlobalLimit = !isNaN(num) && num > 0 ? num : DEFAULT_MAX_QUESTIONS_PER_STUDENT;
    return this.inMemoryGlobalLimit;
  }

  /**
   * Sets global question limit per student and persists to local, idb and cloud
   */
  public async setGlobalLimit(newLimit: number): Promise<number> {
    const validated = Math.max(10, Math.min(50000, Math.floor(Number(newLimit) || DEFAULT_MAX_QUESTIONS_PER_STUDENT)));
    this.inMemoryGlobalLimit = validated;

    cloudStorage.setItem(GLOBAL_LIMIT_KEY, validated);
    try {
      await idbStorage.setItem(GLOBAL_LIMIT_KEY, validated);
    } catch {}

    // Dispatch global reactivity event
    window.dispatchEvent(
      new CustomEvent('karne-question-limit-updated', {
        detail: { limit: validated },
      })
    );

    // Sync to Supabase system_settings
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('system_settings').upsert(
          [
            {
              key: 'max_question_limit',
              value: String(validated),
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'key' }
        );
      } catch (err) {
        console.warn('Supabase system_settings upsert error:', err);
      }
    }

    return validated;
  }

  /**
   * Returns question limit for a specific user (custom override or global)
   */
  public getUserLimit(userId?: string): number {
    if (userId && this.inMemoryCustomLimits && this.inMemoryCustomLimits[userId]) {
      return this.inMemoryCustomLimits[userId];
    }
    if (userId) {
      const customMap = cloudStorage.getItem<Record<string, number>>(CUSTOM_USER_LIMITS_KEY, {});
      if (customMap[userId]) {
        return customMap[userId];
      }
    }
    return this.getGlobalLimit();
  }

  /**
   * Sets a custom question limit for a specific student
   */
  public async setUserLimit(userId: string, customLimit: number | null): Promise<void> {
    const customMap = cloudStorage.getItem<Record<string, number>>(CUSTOM_USER_LIMITS_KEY, {});
    if (customLimit === null || customLimit <= 0) {
      delete customMap[userId];
    } else {
      customMap[userId] = Math.max(10, Math.min(50000, Math.floor(customLimit)));
    }
    this.inMemoryCustomLimits = customMap;
    cloudStorage.setItem(CUSTOM_USER_LIMITS_KEY, customMap);

    window.dispatchEvent(
      new CustomEvent('karne-question-limit-updated', {
        detail: { userId, limit: customLimit },
      })
    );
  }

  public getLimitForStudent(userId?: string): number {
    return this.getUserLimit(userId);
  }

  public hasCustomLimit(userId?: string): boolean {
    if (!userId) return false;
    if (this.inMemoryCustomLimits && this.inMemoryCustomLimits[userId]) return true;
    const customMap = cloudStorage.getItem<Record<string, number>>(CUSTOM_USER_LIMITS_KEY, {});
    return Boolean(customMap && customMap[userId]);
  }

  public async setCustomLimit(userId: string, customLimit: number): Promise<void> {
    return this.setUserLimit(userId, customLimit);
  }

  public async clearCustomLimit(userId: string): Promise<void> {
    return this.setUserLimit(userId, null);
  }

  /**
   * Check question quota for a student given their current questions count
   */
  public calculateQuotaStatus(currentCount: number, userId?: string): QuestionQuotaStatus {
    const maxLimit = this.getUserLimit(userId);
    const remaining = Math.max(0, maxLimit - currentCount);
    const percentage = Math.min(100, parseFloat(((currentCount / maxLimit) * 100).toFixed(1)));
    const isExceeded = currentCount >= maxLimit;
    const isNearLimit = percentage >= 85;

    return {
      currentCount,
      maxLimit,
      remaining,
      percentage,
      isExceeded,
      isNearLimit,
    };
  }
}

export const questionLimitService = new QuestionLimitService();
