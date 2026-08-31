import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Exam, ExamSubjectResult, ExamTopicResult, ExamType, WrongQuestion } from '../types';
export type { Exam, ExamSubjectResult, ExamTopicResult, ExamType };

const STORAGE_KEY = 'karne_exams_cache';
const AI_ANALYSIS_STORAGE_KEY = 'karne_ai_exam_analysis_cache';

export interface AIExamAnalysis {
  weak_subjects: {
    subject: string;
    trend: 'düşüş' | 'sabit' | 'yükseliş';
    reasoning: string;
  }[];
  weak_topics: {
    subject: string;
    topic: string;
    wrong_count: number;
  }[];
  cross_insights: string[];
  analyzed_at?: string;
}

export const examsService = {
  // Calculate Net score: Correct - (Wrong / 4)
  calculateNet(correct: number, wrong: number): number {
    const net = correct - wrong / 4;
    return Number(net.toFixed(2));
  },

  // Calculate Total Net for an exam
  calculateTotalNet(exam: Exam): number {
    if (!exam.subject_results || exam.subject_results.length === 0) return 0;
    const total = exam.subject_results.reduce((sum, sr) => sum + (sr.net || 0), 0);
    return Number(total.toFixed(2));
  },

  // Get all exams with subject and topic results for a student
  async getExams(studentId: string): Promise<Exam[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*, exam_subject_results(*), exam_topic_results(*)')
          .eq('student_id', studentId)
          .order('exam_date', { ascending: false });

        if (!examsError && examsData && examsData.length > 0) {
          return examsData.map((e: any) => ({
            ...e,
            subject_results: e.exam_subject_results || [],
            topic_results: e.exam_topic_results || [],
          }));
        }
      } catch (err) {
        console.warn('Supabase exams fetch failed, using local cache:', err);
      }
    }

    // Local storage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as Exam[];
        return list.filter((e) => !e.student_id || e.student_id === studentId);
      } catch {
        return [];
      }
    }

    return [];
  },

  // Add a new exam with subject results and optional topic results
  async addExam(payload: {
    student_id: string;
    exam_name: string;
    exam_type: ExamType;
    exam_date: string;
    subjects: {
      subject: string;
      correct: number;
      wrong: number;
      blank: number;
      net: number;
    }[];
    topics?: {
      subject: string;
      topic: string;
      wrong_count: number;
    }[];
  }): Promise<Exam> {
    const examId = 'exam-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const subjectResults: ExamSubjectResult[] = payload.subjects.map((s, idx) => ({
      id: `sr-${examId}-${idx}`,
      exam_id: examId,
      subject: s.subject,
      correct: s.correct,
      wrong: s.wrong,
      blank: s.blank,
      net: s.net,
    }));

    const topicResults: ExamTopicResult[] = (payload.topics || []).map((t, idx) => ({
      id: `tr-${examId}-${idx}`,
      exam_id: examId,
      subject: t.subject,
      topic: t.topic,
      wrong_count: t.wrong_count,
    }));

    const newExam: Exam = {
      id: examId,
      student_id: payload.student_id,
      exam_name: payload.exam_name,
      exam_type: payload.exam_type,
      exam_date: payload.exam_date,
      created_at: new Date().toISOString(),
      subject_results: subjectResults,
      topic_results: topicResults,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data: examData, error: examErr } = await supabase
          .from('exams')
          .insert([
            {
              student_id: payload.student_id,
              exam_name: payload.exam_name,
              exam_type: payload.exam_type,
              exam_date: payload.exam_date,
            },
          ])
          .select()
          .single();

        if (!examErr && examData) {
          const insertedExamId = examData.id;

          // Insert subject results
          if (payload.subjects.length > 0) {
            await supabase.from('exam_subject_results').insert(
              payload.subjects.map((s) => ({
                exam_id: insertedExamId,
                subject: s.subject,
                correct: s.correct,
                wrong: s.wrong,
                blank: s.blank,
                net: s.net,
              }))
            );
          }

          // Insert topic results
          if (payload.topics && payload.topics.length > 0) {
            await supabase.from('exam_topic_results').insert(
              payload.topics.map((t) => ({
                exam_id: insertedExamId,
                subject: t.subject,
                topic: t.topic,
                wrong_count: t.wrong_count,
              }))
            );
          }

          return {
            ...examData,
            subject_results: subjectResults,
            topic_results: topicResults,
          };
        }
      } catch (err) {
        console.warn('Supabase insert exam failed, falling back to localStorage:', err);
      }
    }

    // Local storage persistence
    const existing = await this.getExams(payload.student_id);
    const updated = [newExam, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newExam;
  },

  // Delete an exam
  async deleteExam(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('exams').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete exam failed:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as Exam[];
        const updated = list.filter((e) => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  },

  // Trigger AI Analysis endpoint
  async analyzeExamsWithAI(
    studentId: string,
    exams: Exam[],
    wrongQuestions: WrongQuestion[]
  ): Promise<AIExamAnalysis> {
    if (!exams || exams.length === 0) {
      this.clearCachedAIAnalysis(studentId);
      return {
        weak_subjects: [],
        weak_topics: [],
        cross_insights: [
          'Henüz kayıtlı deneme sınavı bulunmuyor. Deneme ekledikçe yapay zeka analizleri burada otomatik olarak listelenecektir.',
        ],
        analyzed_at: new Date().toISOString(),
      };
    }

    // Collect all subject_results with exam metadata
    const allSubjectResults: any[] = [];
    const allTopicResults: any[] = [];

    exams.forEach((ex) => {
      (ex.subject_results || []).forEach((sr) => {
        allSubjectResults.push({
          exam_id: ex.id,
          exam_name: ex.exam_name,
          exam_type: ex.exam_type,
          exam_date: ex.exam_date,
          subject: sr.subject,
          correct: sr.correct,
          wrong: sr.wrong,
          blank: sr.blank,
          net: sr.net,
        });
      });

      (ex.topic_results || []).forEach((tr) => {
        allTopicResults.push({
          exam_id: ex.id,
          exam_name: ex.exam_name,
          exam_date: ex.exam_date,
          subject: tr.subject,
          topic: tr.topic,
          wrong_count: tr.wrong_count,
        });
      });
    });

    try {
      const response = await fetch('/api/ai/analyze-exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_subject_results: allSubjectResults,
          exam_topic_results: allTopicResults,
          wrong_questions: wrongQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error('AI analizi sunucudan hata döndürdü.');
      }

      const data: AIExamAnalysis = await response.json();
      data.analyzed_at = new Date().toISOString();

      // Save to localStorage for quick restoration
      localStorage.setItem(`${AI_ANALYSIS_STORAGE_KEY}_${studentId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('AI exam analysis API error, generating local fallback:', err);
      // Derive local analysis from actual user data
      const weakTopicsMap: Record<string, { subject: string; topic: string; count: number }> = {};
      allTopicResults.forEach((tr) => {
        if (!tr.topic) return;
        const k = `${tr.subject}-${tr.topic}`;
        if (!weakTopicsMap[k]) weakTopicsMap[k] = { subject: tr.subject, topic: tr.topic, count: 0 };
        weakTopicsMap[k].count += tr.wrong_count || 1;
      });
      wrongQuestions.forEach((wq) => {
        if (!wq.topic) return;
        const k = `${wq.subject}-${wq.topic}`;
        if (!weakTopicsMap[k]) weakTopicsMap[k] = { subject: wq.subject, topic: wq.topic, count: 0 };
        weakTopicsMap[k].count += 1;
      });

      const topWeakTopics = Object.values(weakTopicsMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((t) => ({ subject: t.subject, topic: t.topic, wrong_count: t.count }));

      const fallback: AIExamAnalysis = {
        weak_subjects: [],
        weak_topics: topWeakTopics,
        cross_insights: topWeakTopics.length > 0
          ? [`En çok hata yapılan konu: ${topWeakTopics[0].subject} - ${topWeakTopics[0].topic} (${topWeakTopics[0].wrong_count} hata).`]
          : ['Girilen deneme kayıtlarına göre kritik bir konu kümelenmesi saptanmadı.'],
        analyzed_at: new Date().toISOString(),
      };
      localStorage.setItem(`${AI_ANALYSIS_STORAGE_KEY}_${studentId}`, JSON.stringify(fallback));
      return fallback;
    }
  },

  // Get cached AI analysis
  getCachedAIAnalysis(studentId: string): AIExamAnalysis | null {
    const saved = localStorage.getItem(`${AI_ANALYSIS_STORAGE_KEY}_${studentId}`);
    if (!saved) return null;
    try {
      return JSON.parse(saved) as AIExamAnalysis;
    } catch {
      return null;
    }
  },

  // Clear cached AI analysis
  clearCachedAIAnalysis(studentId: string): void {
    try {
      localStorage.removeItem(`${AI_ANALYSIS_STORAGE_KEY}_${studentId}`);
      localStorage.removeItem(AI_ANALYSIS_STORAGE_KEY);
    } catch {}
  },
};
