import {
  SimulatedNetValues,
  SimulatedRankResult,
  TargetUniversityBenchmark,
} from '../types';

export const TARGET_BENCHMARKS: TargetUniversityBenchmark[] = [
  // --- SAYISAL (SAY) ---
  {
    id: 'bench-hacettepe-tip',
    university_name: 'Hacettepe Üniversitesi',
    department_name: 'Tıp Fakültesi (Türkçe)',
    city: 'Ankara',
    field: 'SAY',
    target_rank_2025: 1200,
    target_placement_score: 528.5,
    base_nets: {
      tyt_total: 108.5,
      ayt_total: 75.0,
      tyt_breakdown: { turkish: 36.5, social: 17.0, math: 37.5, science: 17.5 },
      ayt_breakdown: { math: 38.0, physics: 13.0, chemistry: 12.0, biology: 12.0 },
    },
    faculty_badge: 'Sağlık Bilimleri • Zirve',
  },
  {
    id: 'bench-itu-ceng',
    university_name: 'İstanbul Teknik Üniversitesi (İTÜ)',
    department_name: 'Bilgisayar Mühendisliği (İngilizce)',
    city: 'İstanbul',
    field: 'SAY',
    target_rank_2025: 950,
    target_placement_score: 532.0,
    base_nets: {
      tyt_total: 110.0,
      ayt_total: 76.5,
      tyt_breakdown: { turkish: 37.0, social: 17.5, math: 38.0, science: 17.5 },
      ayt_breakdown: { math: 39.0, physics: 13.5, chemistry: 12.0, biology: 12.0 },
    },
    faculty_badge: 'Mühendislik & Yapay Zeka',
  },
  {
    id: 'bench-odtu-ee',
    university_name: 'Orta Doğu Teknik Üniversitesi (ODTÜ)',
    department_name: 'Elektrik-Elektronik Mühendisliği',
    city: 'Ankara',
    field: 'SAY',
    target_rank_2025: 1450,
    target_placement_score: 524.0,
    base_nets: {
      tyt_total: 106.0,
      ayt_total: 74.0,
      tyt_breakdown: { turkish: 35.0, social: 16.5, math: 37.5, science: 17.0 },
      ayt_breakdown: { math: 38.0, physics: 13.0, chemistry: 11.5, biology: 11.5 },
    },
    faculty_badge: 'Mühendislik • Teknoloji',
  },
  {
    id: 'bench-cerrahpasa-tip',
    university_name: 'İstanbul Üniversitesi - Cerrahpaşa',
    department_name: 'Cerrahpaşa Tıp Fakültesi',
    city: 'İstanbul',
    field: 'SAY',
    target_rank_2025: 2400,
    target_placement_score: 516.5,
    base_nets: {
      tyt_total: 103.5,
      ayt_total: 72.0,
      tyt_breakdown: { turkish: 35.0, social: 16.0, math: 36.0, science: 16.5 },
      ayt_breakdown: { math: 36.5, physics: 12.5, chemistry: 11.5, biology: 11.5 },
    },
    faculty_badge: 'Tıp & Cerrahi',
  },
  {
    id: 'bench-ege-dis',
    university_name: 'Ege Üniversitesi',
    department_name: 'Diş Hekimliği Fakültesi',
    city: 'İzmir',
    field: 'SAY',
    target_rank_2025: 18500,
    target_placement_score: 462.0,
    base_nets: {
      tyt_total: 91.0,
      ayt_total: 62.0,
      tyt_breakdown: { turkish: 32.0, social: 14.0, math: 31.0, science: 14.0 },
      ayt_breakdown: { math: 32.0, physics: 10.0, chemistry: 10.0, biology: 10.0 },
    },
    faculty_badge: 'Diş Hekimliği',
  },
  {
    id: 'bench-ytu-makine',
    university_name: 'Yıldız Teknik Üniversitesi (YTÜ)',
    department_name: 'Makine Mühendisliği',
    city: 'İstanbul',
    field: 'SAY',
    target_rank_2025: 22000,
    target_placement_score: 454.0,
    base_nets: {
      tyt_total: 89.0,
      ayt_total: 60.5,
      tyt_breakdown: { turkish: 31.0, social: 13.5, math: 31.5, science: 13.0 },
      ayt_breakdown: { math: 32.5, physics: 10.5, chemistry: 9.5, biology: 8.0 },
    },
    faculty_badge: 'Teknik Mühendislik',
  },

  // --- EŞİT AĞIRLIK (EA) ---
  {
    id: 'bench-boun-isletme',
    university_name: 'Boğaziçi Üniversitesi',
    department_name: 'İşletme (İngilizce)',
    city: 'İstanbul',
    field: 'EA',
    target_rank_2025: 450,
    target_placement_score: 512.0,
    base_nets: {
      tyt_total: 104.0,
      ayt_total: 68.0,
      tyt_breakdown: { turkish: 36.0, social: 17.5, math: 36.5, science: 14.0 },
      ayt_breakdown: { math: 38.0, literature: 21.0, history1: 5.0, geography1: 4.0 },
    },
    faculty_badge: 'İktisadi & İdari Bilimler',
  },
  {
    id: 'bench-gs-hukuk',
    university_name: 'Galatasaray Üniversitesi',
    department_name: 'Hukuk Fakültesi (Fransızca)',
    city: 'İstanbul',
    field: 'EA',
    target_rank_2025: 250,
    target_placement_score: 518.0,
    base_nets: {
      tyt_total: 106.0,
      ayt_total: 69.5,
      tyt_breakdown: { turkish: 37.0, social: 18.0, math: 37.0, science: 14.0 },
      ayt_breakdown: { math: 38.5, literature: 22.0, history1: 5.5, geography1: 3.5 },
    },
    faculty_badge: 'Hukuk • Zirve',
  },
  {
    id: 'bench-ankara-hukuk',
    university_name: 'Ankara Üniversitesi',
    department_name: 'Hukuk Fakültesi',
    city: 'Ankara',
    field: 'EA',
    target_rank_2025: 6200,
    target_placement_score: 458.0,
    base_nets: {
      tyt_total: 90.0,
      ayt_total: 58.5,
      tyt_breakdown: { turkish: 33.0, social: 15.0, math: 30.0, science: 12.0 },
      ayt_breakdown: { math: 32.0, literature: 18.5, history1: 4.5, geography1: 3.5 },
    },
    faculty_badge: 'Hukuk Bilimleri',
  },
  {
    id: 'bench-odtu-psikoloji',
    university_name: 'Orta Doğu Teknik Üniversitesi (ODTÜ)',
    department_name: 'Psikoloji (İngilizce)',
    city: 'Ankara',
    field: 'EA',
    target_rank_2025: 4100,
    target_placement_score: 472.0,
    base_nets: {
      tyt_total: 94.0,
      ayt_total: 61.0,
      tyt_breakdown: { turkish: 34.0, social: 16.0, math: 32.0, science: 12.0 },
      ayt_breakdown: { math: 34.0, literature: 19.0, history1: 4.5, geography1: 3.5 },
    },
    faculty_badge: 'Sosyal Bilimler',
  },
  {
    id: 'bench-istanbul-hukuk',
    university_name: 'İstanbul Üniversitesi',
    department_name: 'Hukuk Fakültesi',
    city: 'İstanbul',
    field: 'EA',
    target_rank_2025: 7800,
    target_placement_score: 449.0,
    base_nets: {
      tyt_total: 87.0,
      ayt_total: 56.0,
      tyt_breakdown: { turkish: 32.0, social: 14.5, math: 28.5, science: 12.0 },
      ayt_breakdown: { math: 30.0, literature: 18.0, history1: 4.5, geography1: 3.5 },
    },
    faculty_badge: 'Köklü Hukuk',
  },
];

class RankSimulatorService {
  /**
   * OGM Materyal / ÖSYM Uyumlu YKS Ham ve Yerleştirme Puanı Hesaplama Motoru
   */
  public calculateYks(inputs: SimulatedNetValues): SimulatedRankResult {
    const { field } = inputs;
    const obp = Math.max(50, Math.min(100, Number(inputs.obp_score) || 85));

    // 1. TYT Netleri
    const tytTurk = Math.max(0, Math.min(40, Number(inputs.tyt_turkish) || 0));
    const tytMat = Math.max(0, Math.min(40, Number(inputs.tyt_math) || 0));
    const tytSos = Math.max(0, Math.min(20, Number(inputs.tyt_social) || 0));
    const tytFen = Math.max(0, Math.min(20, Number(inputs.tyt_science) || 0));

    const tytTotal = Number((tytTurk + tytMat + tytSos + tytFen).toFixed(2));

    // OGM Materyal TYT Ham Puanı Formülü:
    // Taban Puan = 100
    // Türkçe: 3.3, Temel Matematik: 3.3, Sosyal: 3.4, Fen: 3.4 (Toplam max 400 + 100 taban = 500)
    const tytHamPuan = Number(
      Math.min(
        500,
        100 + tytTurk * 3.3 + tytMat * 3.3 + tytSos * 3.4 + tytFen * 3.4
      ).toFixed(2)
    );

    // 2. AYT Netleri & Alan Katsayıları
    let aytTotal = 0;
    let aytKatkisi = 0;

    if (field === 'SAY') {
      const aytMat = Math.max(0, Math.min(40, Number(inputs.ayt_math) || 0));
      const aytFiz = Math.max(0, Math.min(14, Number(inputs.ayt_physics) || 0));
      const aytKim = Math.max(0, Math.min(13, Number(inputs.ayt_chemistry) || 0));
      const aytBiy = Math.max(0, Math.min(13, Number(inputs.ayt_biology) || 0));

      aytTotal = Number((aytMat + aytFiz + aytKim + aytBiy).toFixed(2));
      // OGM Materyal Sayısal Katsayıları (AYT test katkısı max 240 puan):
      aytKatkisi =
        aytMat * 3.0 + aytFiz * 2.85 + aytKim * 3.07 + aytBiy * 3.07;
    } else if (field === 'EA') {
      const aytMat = Math.max(0, Math.min(40, Number(inputs.ayt_math) || 0));
      const aytEdeb = Math.max(0, Math.min(24, Number(inputs.ayt_literature) || 0));
      const aytTar1 = Math.max(0, Math.min(10, Number(inputs.ayt_history1) || 0));
      const aytCog1 = Math.max(0, Math.min(6, Number(inputs.ayt_geography1) || 0));

      aytTotal = Number((aytMat + aytEdeb + aytTar1 + aytCog1).toFixed(2));
      // OGM Materyal EA Katsayıları:
      aytKatkisi =
        aytMat * 3.0 + aytEdeb * 3.0 + aytTar1 * 2.80 + aytCog1 * 3.33;
    } else if (field === 'SOZ') {
      const aytEdeb = Math.max(0, Math.min(24, Number(inputs.ayt_literature) || 0));
      const aytTar1 = Math.max(0, Math.min(10, Number(inputs.ayt_history1) || 0));
      const aytCog1 = Math.max(0, Math.min(6, Number(inputs.ayt_geography1) || 0));
      const aytTar2 = Math.max(0, Math.min(11, Number(inputs.ayt_history2) || 0));
      const aytCog2 = Math.max(0, Math.min(11, Number(inputs.ayt_geography2) || 0));
      const aytFel = Math.max(0, Math.min(12, Number(inputs.ayt_philosophy) || 0));
      const aytDin = Math.max(0, Math.min(6, Number(inputs.ayt_religion) || 0));

      aytTotal = Number((aytEdeb + aytTar1 + aytCog1 + aytTar2 + aytCog2 + aytFel + aytDin).toFixed(2));
      aytKatkisi =
        aytEdeb * 3.0 + aytTar1 * 2.8 + aytCog1 * 3.33 + aytTar2 * 2.91 + aytCog2 * 2.91 + aytFel * 3.0 + aytDin * 3.0;
    } else {
      // DİL (YDT)
      const aytDil = Math.max(0, Math.min(80, Number(inputs.ydt_language) || 0));
      aytTotal = aytDil;
      aytKatkisi = aytDil * 3.0;
    }

    // OGM Materyal Alan Ham Puanı:
    // Ham Puan = 100 (taban) + [(TYT Ham - 100) * 0.40] + aytKatkisi (max 500)
    const tytBileseni = (tytHamPuan - 100) * 0.40;
    const rawScore = Number(Math.min(500, Math.max(100, 100 + tytBileseni + aytKatkisi)).toFixed(2));

    // OBP Katkısı = OBP * 0.6 (30 ile 60 puan arası)
    const obpContribution = Number((obp * 0.6).toFixed(2));

    // Yerleştirme Puanı (max 560)
    const placementScore = Number(Math.min(560, rawScore + obpContribution).toFixed(2));

    // 3. ÖSYM / OGM Materyal Yığılma Aralıklarına Göre Sıralama Hesaplama
    const likelyRank = this.estimateRankByPlacementScore(placementScore, field);
    const bestRank = Math.max(1, Math.round(likelyRank * 0.78));
    const worstRank = Math.round(likelyRank * 1.28);

    // 4. Hedef Öncelikli Net Önerileri (Akıllı İyileştirme Fırsatları)
    const netPrescriptions: SimulatedRankResult['net_prescriptions'] = [];

    if (tytTurk < 35) {
      const gap = Number((35 - tytTurk).toFixed(1));
      netPrescriptions.push({
        subject: 'TYT Türkçe',
        current_net: tytTurk,
        target_net: 35,
        net_gap: gap,
        estimated_points_gain: Number((gap * 1.32).toFixed(1)),
        priority: gap >= 6 ? 'high' : 'medium',
      });
    }

    if (tytMat < 34) {
      const gap = Number((34 - tytMat).toFixed(1));
      netPrescriptions.push({
        subject: 'TYT Temel Matematik',
        current_net: tytMat,
        target_net: 34,
        net_gap: gap,
        estimated_points_gain: Number((gap * 1.32).toFixed(1)),
        priority: 'high',
      });
    }

    if (field === 'SAY') {
      const aytMat = Number(inputs.ayt_math) || 0;
      if (aytMat < 35) {
        const gap = Number((35 - aytMat).toFixed(1));
        netPrescriptions.push({
          subject: 'AYT Matematik',
          current_net: aytMat,
          target_net: 35,
          net_gap: gap,
          estimated_points_gain: Number((gap * 3.0).toFixed(1)),
          priority: 'high',
        });
      }
      const aytFiz = Number(inputs.ayt_physics) || 0;
      if (aytFiz < 12) {
        const gap = Number((12 - aytFiz).toFixed(1));
        netPrescriptions.push({
          subject: 'AYT Fizik',
          current_net: aytFiz,
          target_net: 12,
          net_gap: gap,
          estimated_points_gain: Number((gap * 2.85).toFixed(1)),
          priority: 'medium',
        });
      }
    } else if (field === 'EA') {
      const aytMat = Number(inputs.ayt_math) || 0;
      if (aytMat < 32) {
        const gap = Number((32 - aytMat).toFixed(1));
        netPrescriptions.push({
          subject: 'AYT Matematik',
          current_net: aytMat,
          target_net: 32,
          net_gap: gap,
          estimated_points_gain: Number((gap * 3.0).toFixed(1)),
          priority: 'high',
        });
      }
      const aytEdeb = Number(inputs.ayt_literature) || 0;
      if (aytEdeb < 21) {
        const gap = Number((21 - aytEdeb).toFixed(1));
        netPrescriptions.push({
          subject: 'AYT Türk Dili ve Edebiyatı',
          current_net: aytEdeb,
          target_net: 21,
          net_gap: gap,
          estimated_points_gain: Number((gap * 3.0).toFixed(1)),
          priority: 'high',
        });
      }
    }

    return {
      tyt_total_net: tytTotal,
      ayt_total_net: aytTotal,
      raw_score: rawScore,
      placement_score: placementScore,
      best_rank: bestRank,
      likely_rank: likelyRank,
      worst_rank: worstRank,
      field,
      net_prescriptions: netPrescriptions,
    };
  }

  /**
   * ÖSYM 2024-2025 Gerçek Yığılma Eğrileri ve OGM Materyal Dağılımları
   */
  private estimateRankByPlacementScore(score: number, field: string): number {
    // Sayısal (SAY) Yığılma Eğrisi
    if (field === 'SAY') {
      const SAY_POINTS: [number, number][] = [
        [555, 120],
        [545, 480],
        [535, 1150],
        [520, 2400],
        [505, 4900],
        [490, 8900],
        [475, 14800],
        [460, 22500],
        [445, 32000],
        [425, 48000],
        [400, 72000],
        [375, 105000],
        [350, 148000],
        [320, 215000],
        [280, 320000],
        [240, 480000],
        [180, 720000],
        [130, 1100000],
      ];
      return this.interpolateCurve(score, SAY_POINTS);
    }

    // Eşit Ağırlık (EA) Yığılma Eğrisi
    if (field === 'EA') {
      const EA_POINTS: [number, number][] = [
        [540, 95],
        [525, 340],
        [505, 950],
        [485, 2300],
        [465, 4800],
        [445, 9200],
        [425, 16500],
        [405, 28000],
        [380, 48000],
        [355, 78000],
        [330, 122000],
        [300, 195000],
        [260, 310000],
        [220, 470000],
        [170, 750000],
        [130, 1050000],
      ];
      return this.interpolateCurve(score, EA_POINTS);
    }

    // Sözel (SÖZ) Yığılma Eğrisi
    if (field === 'SOZ') {
      const SOZ_POINTS: [number, number][] = [
        [520, 150],
        [500, 520],
        [475, 1600],
        [450, 3900],
        [425, 8400],
        [400, 16000],
        [370, 31000],
        [340, 58000],
        [310, 102000],
        [280, 175000],
        [240, 310000],
        [190, 520000],
        [130, 850000],
      ];
      return this.interpolateCurve(score, SOZ_POINTS);
    }

    // Yabancı Dil (DİL)
    const DIL_POINTS: [number, number][] = [
      [540, 120],
      [520, 480],
      [495, 1400],
      [470, 3100],
      [440, 6200],
      [410, 11500],
      [375, 21000],
      [340, 36000],
      [300, 58000],
      [250, 95000],
      [180, 160000],
    ];
    return this.interpolateCurve(score, DIL_POINTS);
  }

  private interpolateCurve(score: number, points: [number, number][]): number {
    if (score >= points[0][0]) {
      const ratio = (score - points[0][0]) / 20;
      return Math.max(1, Math.round(points[0][1] * Math.exp(-ratio)));
    }
    const last = points[points.length - 1];
    if (score <= last[0]) {
      return last[1];
    }

    for (let i = 0; i < points.length - 1; i++) {
      const [sHigh, rHigh] = points[i];
      const [sLow, rLow] = points[i + 1];

      if (score <= sHigh && score >= sLow) {
        const fraction = (sHigh - score) / (sHigh - sLow);
        return Math.round(rHigh + fraction * (rLow - rHigh));
      }
    }
    return points[points.length - 1][1];
  }

  public getBenchmarksByField(field: 'SAY' | 'EA' | 'SOZ' | 'DIL'): TargetUniversityBenchmark[] {
    return TARGET_BENCHMARKS.filter((b) => b.field === field);
  }
}

export const rankSimulatorService = new RankSimulatorService();
