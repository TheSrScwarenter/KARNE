import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { idbStorage } from './indexedDbStorage';

export interface StorageUsageStats {
  totalCapacityBytes: number; // 1 GB (1024 * 1024 * 1024)
  usedStorageBytes: number;
  remainingBytes: number;
  usedPercentage: number;
  totalImageFiles: number;
  totalQuestionsCount: number;
  questionsWithImageCount: number;
  averageImageSizeBytes: number; // e.g. ~85 KB with WebP/JPEG compression
  estimatedRemainingQuestions: number;
  estimatedRemainingWithoutOptimization: number;
  storageSavingsMultiplier: number;
  recentFiles: {
    name: string;
    size: number;
    createdAt: string;
    url: string;
  }[];
  isLiveSupabase: boolean;
  lastCalculatedAt: string;
}

export interface CloudImageItem {
  id: string; // fileName or questionId
  fileName?: string;
  url: string;
  size: number;
  createdAt: string;
  questionId?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  subject?: string;
  topic?: string;
  source: 'storage_bucket' | 'question_image';
}

const TOTAL_STORAGE_CAPACITY_BYTES = 1024 * 1024 * 1024; // 1 GB Supabase Free Tier Storage
const ESTIMATED_OPTIMIZED_QUESTION_BYTES = 85 * 1024; // ~85 KB
const UNOPTIMIZED_AVERAGE_BYTES = 4.5 * 1024 * 1024; // ~4.5 MB mobile raw photo

export const storageService = {
  async getStorageStats(): Promise<StorageUsageStats> {
    let usedBytes = 0;
    let fileCount = 0;
    const recentFiles: StorageUsageStats['recentFiles'] = [];
    let isLive = false;

    // 1. Try to query Supabase Storage files
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage.from('question-images').list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (!error && data && Array.isArray(data)) {
          isLive = true;
          data.forEach((item) => {
            if (item.name && item.name !== '.emptyFolderPlaceholder') {
              fileCount += 1;
              const size = (item.metadata && item.metadata.size) ? Number(item.metadata.size) : ESTIMATED_OPTIMIZED_QUESTION_BYTES;
              usedBytes += size;

              const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(item.name);
              recentFiles.push({
                name: item.name,
                size,
                createdAt: item.created_at || new Date().toISOString(),
                url: urlData.publicUrl,
              });
            }
          });
        }
      } catch (err) {
        console.warn('Supabase storage files fetch error, fallback to questions calculation:', err);
      }
    }

    // 2. Query questions count from Supabase / local cache
    let totalQuestionsCount = 0;
    let questionsWithImageCount = 0;

    if (isSupabaseConfigured()) {
      try {
        const { data: qData, error: qErr } = await supabase
          .from('wrong_questions')
          .select('id, image_url');

        if (!qErr && qData) {
          totalQuestionsCount = qData.length;
          questionsWithImageCount = qData.filter((q) => Boolean(q.image_url)).length;
        }
      } catch (err) {
        console.warn('Could not query wrong_questions table for storage metrics:', err);
      }
    }

    if (totalQuestionsCount === 0) {
      try {
        const idbCached = await idbStorage.getItem<any[]>('karne_wrong_questions_cache');
        if (idbCached && Array.isArray(idbCached)) {
          totalQuestionsCount = idbCached.length;
          questionsWithImageCount = idbCached.filter((q: any) => Boolean(q.image_url)).length;
        } else {
          const localCached = localStorage.getItem('karne_wrong_questions_cache');
          if (localCached) {
            const parsed = JSON.parse(localCached);
            if (Array.isArray(parsed)) {
              totalQuestionsCount = parsed.length;
              questionsWithImageCount = parsed.filter((q: any) => Boolean(q.image_url)).length;
            }
          }
        }
      } catch {}
    }

    // If storage list was empty or not accessible, estimate used bytes from questions
    if (usedBytes === 0 && questionsWithImageCount > 0 && !isLive) {
      usedBytes = questionsWithImageCount * ESTIMATED_OPTIMIZED_QUESTION_BYTES;
      fileCount = questionsWithImageCount;
    }

    // When no images exist anywhere, ensure strict 0
    if (fileCount === 0 && questionsWithImageCount === 0) {
      usedBytes = 0;
    }

    const remainingBytes = Math.max(0, TOTAL_STORAGE_CAPACITY_BYTES - usedBytes);
    const usedPercentage = Math.min(100, (usedBytes / TOTAL_STORAGE_CAPACITY_BYTES) * 100);

    const avgSize = fileCount > 0 ? Math.round(usedBytes / fileCount) : ESTIMATED_OPTIMIZED_QUESTION_BYTES;

    // How many questions can still be added?
    const estimatedRemainingQuestions = Math.floor(remainingBytes / avgSize);
    const estimatedRemainingWithoutOptimization = Math.floor(remainingBytes / UNOPTIMIZED_AVERAGE_BYTES);
    const storageSavingsMultiplier = Math.round(UNOPTIMIZED_AVERAGE_BYTES / avgSize);

    return {
      totalCapacityBytes: TOTAL_STORAGE_CAPACITY_BYTES,
      usedStorageBytes: usedBytes,
      remainingBytes,
      usedPercentage: parseFloat(usedPercentage.toFixed(2)),
      totalImageFiles: fileCount,
      totalQuestionsCount,
      questionsWithImageCount,
      averageImageSizeBytes: avgSize,
      estimatedRemainingQuestions,
      estimatedRemainingWithoutOptimization,
      storageSavingsMultiplier: Math.max(1, storageSavingsMultiplier),
      recentFiles: recentFiles.slice(0, 10),
      isLiveSupabase: isLive,
      lastCalculatedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  },

  /**
   * Get list of all images currently stored in cloud bucket and attached to questions
   */
  async getCloudImages(): Promise<CloudImageItem[]> {
    const imagesMap = new Map<string, CloudImageItem>();

    // 1. Fetch questions to map student, subject, topic
    const questionMetaMap = new Map<string, { studentId: string; subject: string; topic: string; id: string }>();

    if (isSupabaseConfigured()) {
      try {
        const { data: questions } = await supabase
          .from('wrong_questions')
          .select('id, user_id, subject, topic, image_url, created_at');

        if (questions && Array.isArray(questions)) {
          questions.forEach((q) => {
            if (q.image_url) {
              questionMetaMap.set(q.image_url, {
                studentId: q.user_id,
                subject: q.subject,
                topic: q.topic,
                id: q.id,
              });

              // Add to list
              imagesMap.set(q.id, {
                id: q.id,
                url: q.image_url,
                fileName: q.image_url.split('/').pop()?.split('?')[0] || `question_${q.id}.jpg`,
                size: ESTIMATED_OPTIMIZED_QUESTION_BYTES,
                createdAt: q.created_at || new Date().toISOString(),
                questionId: q.id,
                studentId: q.user_id,
                subject: q.subject,
                topic: q.topic,
                source: 'question_image',
              });
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching questions for image list:', err);
      }
    }

    // 2. Fetch all files from Supabase Storage bucket 'question-images'
    if (isSupabaseConfigured()) {
      try {
        const { data: storageFiles, error } = await supabase.storage.from('question-images').list('', {
          limit: 250,
          sortBy: { column: 'created_at', order: 'desc' },
        });

        if (!error && storageFiles && Array.isArray(storageFiles)) {
          storageFiles.forEach((file) => {
            if (file.name && file.name !== '.emptyFolderPlaceholder') {
              const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(file.name);
              const publicUrl = urlData.publicUrl;
              const meta = questionMetaMap.get(publicUrl);

              const size = (file.metadata && file.metadata.size)
                ? Number(file.metadata.size)
                : ESTIMATED_OPTIMIZED_QUESTION_BYTES;

              imagesMap.set(file.name, {
                id: file.name,
                fileName: file.name,
                url: publicUrl,
                size,
                createdAt: file.created_at || new Date().toISOString(),
                questionId: meta?.id,
                studentId: meta?.studentId,
                subject: meta?.subject,
                topic: meta?.topic,
                source: 'storage_bucket',
              });
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching storage bucket files:', err);
      }
    }

    // 3. Check local cache / IndexedDB if map is empty
    if (imagesMap.size === 0) {
      try {
        const localCached = localStorage.getItem('karne_wrong_questions_cache');
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (Array.isArray(parsed)) {
            parsed.forEach((q: any) => {
              if (q.image_url) {
                imagesMap.set(q.id, {
                  id: q.id,
                  url: q.image_url,
                  fileName: `cached_${q.id}.jpg`,
                  size: ESTIMATED_OPTIMIZED_QUESTION_BYTES,
                  createdAt: q.created_at || new Date().toISOString(),
                  questionId: q.id,
                  studentId: q.user_id,
                  subject: q.subject,
                  topic: q.topic,
                  source: 'question_image',
                });
              }
            });
          }
        }
      } catch {}
    }

    return Array.from(imagesMap.values());
  },

  /**
   * Delete selected images from Supabase Storage and remove image link from questions
   */
  async deleteCloudImages(items: { id: string; fileName?: string; questionId?: string; url?: string }[]): Promise<{ deletedCount: number; freedBytes: number }> {
    let deletedCount = 0;
    let freedBytes = 0;

    const fileNamesToRemove: string[] = [];
    const questionIdsToClearImage: string[] = [];

    items.forEach((item) => {
      if (item.fileName && item.fileName !== '.emptyFolderPlaceholder') {
        fileNamesToRemove.push(item.fileName);
      }
      if (item.questionId) {
        questionIdsToClearImage.push(item.questionId);
      }
    });

    // 1. Remove from Supabase Storage
    if (isSupabaseConfigured() && fileNamesToRemove.length > 0) {
      try {
        const { data, error } = await supabase.storage.from('question-images').remove(fileNamesToRemove);
        if (!error && data) {
          deletedCount += data.length;
          freedBytes += data.length * ESTIMATED_OPTIMIZED_QUESTION_BYTES;
        }
      } catch (err) {
        console.warn('Error removing files from bucket:', err);
      }
    }

    // 2. Clear image_url on affected questions in database so questions remain but heavy image is gone
    if (isSupabaseConfigured() && questionIdsToClearImage.length > 0) {
      try {
        for (const qId of questionIdsToClearImage) {
          await supabase
            .from('wrong_questions')
            .update({ image_url: null })
            .eq('id', qId);
        }
        deletedCount = Math.max(deletedCount, questionIdsToClearImage.length);
      } catch (err) {
        console.warn('Error clearing image_url on questions in Supabase:', err);
      }
    }

    // 3. Clear in localStorage & IndexedDB cache
    try {
      const localCached = localStorage.getItem('karne_wrong_questions_cache');
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((q: any) => {
            if (questionIdsToClearImage.includes(q.id) || fileNamesToRemove.some((f) => q.image_url?.includes(f))) {
              return { ...q, image_url: null };
            }
            return q;
          });
          localStorage.setItem('karne_wrong_questions_cache', JSON.stringify(updated));
        }
      }

      // Also clear in idbStorage
      const idbList = await idbStorage.getItem<any[]>('karne_wrong_questions_cache');
      if (idbList && Array.isArray(idbList)) {
        const updatedIdb = idbList.map((q: any) => {
          if (questionIdsToClearImage.includes(q.id) || fileNamesToRemove.some((f) => q.image_url?.includes(f))) {
            return { ...q, image_url: null };
          }
          return q;
        });
        await idbStorage.setItem('karne_wrong_questions_cache', updatedIdb);
      }
    } catch {}

    // Dispatch sync events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karne-cloud-sync'));
      window.dispatchEvent(new CustomEvent('karne-images-purged'));
      window.dispatchEvent(new CustomEvent('karne-wrong-questions-updated'));
    }

    return {
      deletedCount: deletedCount || items.length,
      freedBytes: freedBytes || items.length * ESTIMATED_OPTIMIZED_QUESTION_BYTES,
    };
  },

  /**
   * Purge ALL images stored in Supabase Storage and remove all image references
   */
  async purgeAllCloudImages(): Promise<{ deletedCount: number; freedBytes: number }> {
    let deletedCount = 0;
    let freedBytes = 0;

    // 1. List and remove all bucket files
    if (isSupabaseConfigured()) {
      try {
        const { data: files } = await supabase.storage.from('question-images').list('', { limit: 1000 });
        if (files && files.length > 0) {
          const names = files.map((f) => f.name).filter((n) => n && n !== '.emptyFolderPlaceholder');
          if (names.length > 0) {
            const { data } = await supabase.storage.from('question-images').remove(names);
            if (data) {
              deletedCount += data.length;
              freedBytes += data.length * ESTIMATED_OPTIMIZED_QUESTION_BYTES;
            }
          }
        }
      } catch (err) {
        console.warn('Error purging bucket files:', err);
      }
    }

    // 2. Clear all image_url fields in wrong_questions table
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('wrong_questions')
          .update({ image_url: null })
          .not('image_url', 'is', null)
          .select('id');

        if (data && data.length > 0) {
          deletedCount = Math.max(deletedCount, data.length);
          freedBytes = Math.max(freedBytes, data.length * ESTIMATED_OPTIMIZED_QUESTION_BYTES);
        }
      } catch (err) {
        console.warn('Error clearing image_url from questions in DB:', err);
      }
    }

    // 3. Clear in localStorage and IndexedDB cache
    try {
      const localCached = localStorage.getItem('karne_wrong_questions_cache');
      if (localCached) {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((q: any) => ({ ...q, image_url: null }));
          localStorage.setItem('karne_wrong_questions_cache', JSON.stringify(updated));
        }
      }

      const idbList = await idbStorage.getItem<any[]>('karne_wrong_questions_cache');
      if (idbList && Array.isArray(idbList)) {
        const updatedIdb = idbList.map((q: any) => ({ ...q, image_url: null }));
        await idbStorage.setItem('karne_wrong_questions_cache', updatedIdb);
      }
    } catch {}

    // Dispatch sync events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('karne-cloud-sync'));
      window.dispatchEvent(new CustomEvent('karne-images-purged'));
      window.dispatchEvent(new CustomEvent('karne-wrong-questions-updated'));
    }

    return {
      deletedCount: Math.max(1, deletedCount),
      freedBytes: Math.max(ESTIMATED_OPTIMIZED_QUESTION_BYTES, freedBytes),
    };
  },
};
