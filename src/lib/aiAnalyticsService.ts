import { examsService } from './examsService';
import { booksService } from './booksService';
import { wrongQuestionsService } from './wrongQuestionsService';
import {
  Exam,
  PredictedRankBand,
  WeakTopicDiagnosis,
} from '../types';

class AiAnalyticsService {
  // ---------------------------------------------------------------------------
  // 1. YKS NET TAHMİN MOTORU & SIRALAMA SİMÜLATÖRÜ
  // ---------------------------------------------------------------------------
  public async calculatePredictedRank(studentId: string, studentField: 'SAY' | 'EA' | 'SOZ' | 'DIL' = 'SAY'): Promise<PredictedRankBand> {
    const exams = await examsService.getExams(studentId);

    const tytExams = exams.filter((e) => e.exam_type === 'TYT');
    const aytExams = exams.filter((e) => e.exam_type === 'AYT');

    // Calculate averages
    const calcAvgNet = (list: Exam[]) => {
      if (!list.length) return 0;
      const sum = list.reduce((acc, ex) => acc + examsService.calculateTotalNet(ex), 0);
      return Number((sum / list.length).toFixed(1));
    };

    const avgTyt = calcAvgNet(tytExams);
    const avgAyt = calcAvgNet(aytExams);

    if (exams.length === 0) {
      return {
        exam_type: `YKS_${studentField}` as PredictedRankBand['exam_type'],
        average_tyt_net: 0,
        average_ayt_net: 0,
        estimated_raw_score: 0,
        estimated_placement_score: 0,
        best_rank: 0,
        likely_rank: 0,
        worst_rank: 0,
        confidence_level: 'low',
        exam_count_analyzed: 0,
        trend_direction: 'stable',
        historical_comparison_year: '2024-2025 ÖSYM Yığılma & Zorluk Matrisi',
      };
    }

    // YKS Placement score formula approximation (Standard 2024/2025/2026 ÖSYM weights)
    const rawTytScore = 100 + avgTyt * 3.333;
    const rawAytScore = 100 + avgAyt * 3.75;
    const estimatedRawScore = Number((rawTytScore * 0.4 + rawAytScore * 0.6).toFixed(2));
    
    // Assume average OBP of 85 -> 85 * 0.6 = +51 placement contribution
    const estimatedPlacementScore = Number((estimatedRawScore + 51).toFixed(2));

    // Realistic Turkey Rank estimation curve based on ÖSYM Sayısal/EA yığılma verileri
    let likelyRank = 50000;
    if (estimatedPlacementScore >= 520) likelyRank = 850;
    else if (estimatedPlacementScore >= 490) likelyRank = 3400;
    else if (estimatedPlacementScore >= 460) likelyRank = 8900;
    else if (estimatedPlacementScore >= 430) likelyRank = 18500;
    else if (estimatedPlacementScore >= 400) likelyRank = 34000;
    else if (estimatedPlacementScore >= 370) likelyRank = 58000;
    else if (estimatedPlacementScore >= 330) likelyRank = 98000;
    else if (estimatedPlacementScore >= 290) likelyRank = 165000;
    else likelyRank = 260000;

    const bestRank = Math.max(1, Math.round(likelyRank * 0.68));
    const worstRank = Math.round(likelyRank * 1.45);

    // Trend Direction from last 3 exams
    let trendDirection: PredictedRankBand['trend_direction'] = 'stable';
    if (exams.length >= 3) {
      const recentNets = exams.slice(-3).map((e) => examsService.calculateTotalNet(e));
      if (recentNets[2] > recentNets[0] + 3) trendDirection = 'improving';
      else if (recentNets[2] < recentNets[0] - 3) trendDirection = 'declining';
    }

    const confidence: PredictedRankBand['confidence_level'] =
      exams.length >= 6 ? 'high' : exams.length >= 3 ? 'medium' : 'low';

    return {
      exam_type: `YKS_${studentField}` as PredictedRankBand['exam_type'],
      average_tyt_net: avgTyt,
      average_ayt_net: avgAyt,
      estimated_raw_score: estimatedRawScore,
      estimated_placement_score: estimatedPlacementScore,
      best_rank: bestRank,
      likely_rank: likelyRank,
      worst_rank: worstRank,
      confidence_level: confidence,
      exam_count_analyzed: exams.length,
      trend_direction: trendDirection,
      historical_comparison_year: '2024-2025 ÖSYM Yığılma & Zorluk Matrisi',
    };
  }

  // ---------------------------------------------------------------------------
  // 2. KİŞİSELLEŞTİRİLMİŞ EKSİK KONU RADARI (CROSS-DIAGNOSTIC ALGORITHM)
  // ---------------------------------------------------------------------------
  public async diagnoseWeakTopics(studentId: string): Promise<WeakTopicDiagnosis[]> {
    const [books, wrongQuestions] = await Promise.all([
      booksService.getBooks(studentId),
      wrongQuestionsService.getQuestions(studentId),
    ]);

    // Track topic error signals from wrong questions
    const topicErrorMap: Record<
      string,
      {
        subject: string;
        topicName: string;
        examType: 'TYT' | 'AYT';
        errorCount: number;
        reasons: Record<string, number>;
      }
    > = {};

    wrongQuestions.forEach((wq) => {
      const key = `${wq.subject}_${wq.topic}`.toLowerCase();
      if (!topicErrorMap[key]) {
        topicErrorMap[key] = {
          subject: wq.subject,
          topicName: wq.topic,
          examType: (wq.exam_type as 'TYT' | 'AYT') || 'TYT',
          errorCount: 0,
          reasons: {},
        };
      }
      topicErrorMap[key].errorCount++;
      const reason = wq.error_type || 'Kavram/Bilgi Eksikliği';
      topicErrorMap[key].reasons[reason] = (topicErrorMap[key].reasons[reason] || 0) + 1;
    });

    // Check books completion status
    const bookTopicStatusMap: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
    books.forEach((b) => {
      b.topics?.forEach((t) => {
        const key = `${b.subject}_${t.topic_name}`.toLowerCase();
        bookTopicStatusMap[key] = t.status;
      });
    });

    // Generate diagnostics
    const diagnostics: WeakTopicDiagnosis[] = [];

    // Diagnostics from identified wrong questions
    Object.values(topicErrorMap).forEach((item) => {
      const key = `${item.subject}_${item.topicName}`.toLowerCase();
      const bookStatus = bookTopicStatusMap[key] || 'in_progress';

      // Find top reason
      let topReason = 'Kavram / Formül Bilgisi Eksikliği';
      let maxCount = 0;
      Object.entries(item.reasons).forEach(([r, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topReason = r;
        }
      });

      let urgency: WeakTopicDiagnosis['urgency'] = 'moderate';
      if (item.errorCount >= 4 || bookStatus === 'not_started') urgency = 'critical';
      else if (item.errorCount >= 2) urgency = 'high';

      let action = 'Konu anlatımı videosu izleyip temel kavrama testlerini baştan tara.';
      if (topReason.includes('İşlem') || topReason.includes('Dikkatsizlik')) {
        action = 'Süre tutarak 2 test boyunca işlem adımlarını sesli kontrol et.';
      } else if (topReason.includes('Soru Kökü') || topReason.includes('Okuma')) {
        action = 'Soru kökündeki anahtar kelimeleri ve "kesinlikle/olamaz" ifadelerini fosforlu kalemle çiz.';
      } else if (bookStatus === 'completed') {
        action = 'Konu bitmiş görünse de denemelerde kaçıyor; 1 adet ileri seviye tarama testi çöz.';
      }

      diagnostics.push({
        subject: item.subject,
        topic_name: item.topicName,
        exam_type: item.examType,
        urgency,
        error_frequency: item.errorCount,
        wrong_questions_count: item.errorCount,
        book_topic_status: bookStatus,
        primary_error_reason: topReason,
        recommended_action: action,
        estimated_net_gain: item.examType === 'AYT' ? 1.25 : 1.0,
      });
    });

    // Sort by urgency priority (critical first)
    const urgencyWeight = { critical: 3, high: 2, moderate: 1 };
    return diagnostics.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);
  }
}

export const aiAnalyticsService = new AiAnalyticsService();
