import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { WrongQuestion, ErrorType, QuestionDifficulty, WrongQuestionsAnalysisReport } from '../types';
export type { WrongQuestion, ErrorType, QuestionDifficulty, WrongQuestionsAnalysisReport };

const STORAGE_KEY = 'karne_wrong_questions_cache';
const ANALYSIS_CACHE_KEY = 'karne_wrong_questions_analysis_cache';

export const YKS_SUBJECT_TOPICS: Record<string, { exam_type: 'TYT' | 'AYT' | 'Genel'; topics: string[] }> = {
  'TYT Matematik': {
    exam_type: 'TYT',
    topics: [
      'Temel Kavramlar & Sayı Kümeleri',
      'Bölme ve Bölünebilme Kuralları',
      'EBOB - EKOK',
      'Rasyonel ve Ondalıklı Sayılar',
      'Basit Eşitsizlikler',
      'Mutlak Değer',
      'Üslü ve Köklü İfadeler',
      'Çarpanlara Ayırma',
      'Oran - Orantı',
      'Denklem Çözme',
      'Sayı & Kesir Problemleri',
      'Yaş Problemleri',
      'Hız & Hareket Problemleri',
      'Yüzde, Kar-Zarar & Faiz Problemleri',
      'Karışım Problemleri',
      'Grafik & Tablo Problemleri',
      'Kümeler & Kartezyen Çarpım',
      'Fonksiyonlar (Temel)',
      'Mantık',
      'Sayma, Permütasyon & Kombinasyon',
      'Olasılık',
      'İstatistik & Veri',
    ],
  },
  'AYT Matematik': {
    exam_type: 'AYT',
    topics: [
      'Polinomlar',
      '2. Dereceden Denklemler & Karmaşık Sayılar',
      'Parabol (2. Dereceden Fonksiyonlar)',
      'Eşitsizlikler ve Eşitsizlik Sistemleri',
      'Trigonometri 1 (Birim Çember & Bağıntılar)',
      'Trigonometri 2 (Toplam-Fark & Yarım Açı)',
      'Logaritma & Üstel Fonksiyonlar',
      'Diziler & Aritmetik / Geometrik Dizi',
      'Limit ve Süreklilik',
      'Türev Alma Kuralları',
      'Türev Uygulamaları & Ekstremum Noktalar',
      'Belirsiz İntegral',
      'Belirli İntegral & Alan Hesabı',
      'Permütasyon - Kombinasyon - Binom',
      'Olasılık (Koşullu Olasılık)',
    ],
  },
  'Geometri': {
    exam_type: 'Genel',
    topics: [
      'Doğruda ve Üçgende Açılar',
      'Özel Üçgenler (Dik, İkizkenar, Eşkenar)',
      'Açıortay ve Kenarortay Bağıntıları',
      'Üçgende Benzerlik',
      'Üçgende Alan',
      'Açı - Kenar Bağıntıları',
      'Çokgenler ve Dörtgenler',
      'Paralelkenar ve Eşkenar Dörtgen',
      'Dikdörtgen ve Kare',
      'Yamuk ve Deltoid',
      'Çemberde Açı ve Uzunluk',
      'Dairede Alan ve Çevre',
      'Noktanın ve Doğrunun Analitik İncelenmesi',
      'Çemberin Analitiği',
      'Katı Cisimler (Prizma, Piramit, Koni, Küre)',
      'Dönüşümlerle Geometri',
    ],
  },
  'TYT Fizik': {
    exam_type: 'TYT',
    topics: [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Sıvıların Kaldırma Kuvveti & Basınç',
      'Isı, Sıcaklık ve Genleşme',
      'Doğrusal Hareket',
      'Kuvvet ve Newton’un Hareket Yasaları',
      'İş, Güç ve Mekanik Enerji',
      'Elektrostatik & Elektrik Akımı',
      'Manyetizma',
      'Dalgalar (Yay, Su, Ses, Deprem)',
      'Optik (Aydınlanma, Düzlem Ayna, Küresel Aynalar, Kırılma, Mercekler, Prizmalar)',
    ],
  },
  'AYT Fizik': {
    exam_type: 'AYT',
    topics: [
      'Vektörler & Bağıl Hareket',
      'Newton’un Hareket Yasaları (İki Boyutta Dinamik)',
      'Atışlar (Bir ve İki Boyutta Sabit İvmeli Hareket)',
      'İş, Güç, Enerji ve Sürtünme',
      'İtme ve Çizgisel Momentum',
      'Tork, Denge ve Kütle Merkezi',
      'Basit Makineler',
      'Elektriksel Kuvvet, Alan ve Potansiyel',
      'Düzgün Elektrik Alan ve Sığaçlar',
      'Manyetik Alan, Manyetik Kuvvet ve İndüksiyon',
      'Alternatif Akım ve Transformatörler',
      'Düzgün Çembersel Hareket & Dönerek Öteleme',
      'Açısal Momentum ve Kepler Yasaları',
      'Basit Harmonik Hareket',
      'Dalga Mekaniği (Kırınım, Girişim, Doppler)',
      'Atom Fiziğine Giriş ve Radyoaktivite',
      'Modern Fizik (Özel Görelilik, Foton, Fotoelektrik, Compton)',
      'Modern Fiziğin Teknolojideki Uygulamaları',
    ],
  },
  'TYT Kimya': {
    exam_type: 'TYT',
    topics: [
      'Kimya Bilimi',
      'Atom ve Periyodik Sistem',
      'Kimyasal Türler Arası Etkileşimler',
      'Maddenin Halleri (Katı, Sıvı, Gaz)',
      'Doğa ve Kimya',
      'Kimyanın Temel Kanunları & Mol Kavramı',
      'Kimyasal Tepkime Denklemleri & Hesaplamalar',
      'Karışımlar ve Ayırma Yöntemleri',
      'Asitler, Bazlar ve Tuzlar',
      'Kimya Her Yerde',
    ],
  },
  'AYT Kimya': {
    exam_type: 'AYT',
    topics: [
      'Modern Atom Teorisi & Kuantum Sayıları',
      'Gazlar (İdeal Gaz Yasası, Kinetik Teori, Karışımlar)',
      'Sıvı Çözeltiler ve Derişim Birimleri',
      'Kimyasal Tepkimelerde Enerji & Entalpi',
      'Kimyasal Tepkimelerde Hız',
      'Kimyasal Denge & Le Chatelier İlkesi',
      'Sulu Çözelti Dengeleri (Asit-Baz, Titrasyon, Tampon)',
      'Çözünürlük Dengesi (Kçç)',
      'Kimya ve Elektrik (Redoks, Aktiflik, Galvanik Piller, Elektroliz)',
      'Karbon Kimyasına Giriş (Hibritleşme & Molekül Geometrisi)',
      'Organik Bileşikler (Alkan, Alken, Alkin, Aromatikler)',
      'Fonksiyonel Gruplar (Alkol, Eter, Aldehit, Keton, Karboksilik Asit, Ester)',
      'Enerji Kaynakları ve Bilimsel Gelişmeler',
    ],
  },
  'TYT Biyoloji': {
    exam_type: 'TYT',
    topics: [
      'Canlıların Ortak Özellikleri',
      'Canlıların Temel Bileşenleri (Organik - İnorganik)',
      'Hücre Teorisi, Zar Yapısı ve Organeller',
      'Hücre Bölünmeleri (Mitoz ve Mayoz)',
      'Canlıların Çeşitliliği ve Sınıflandırılması',
      'Kalıtımın Genel Esasları & Soyağaçları',
      'Ekosistem Ekolojisi ve Güncel Çevre Sorunları',
    ],
  },
  'AYT Biyoloji': {
    exam_type: 'AYT',
    topics: [
      'Sinir Sistemi ve Duyu Organları',
      'Endokrin Sistem (Hormonlar)',
      'Destek ve Hareket Sistemi',
      'Sindirim Sistemi',
      'Dolaşım ve Bağışıklık Sistemi',
      'Solunum Sistemi',
      'Boşaltım (Üriner) Sistemi',
      'Üreme Sistemi ve Embriyonik Gelişim',
      'Komünite ve Popülasyon Ekolojisi',
      'Nükleik Asitler (DNA & RNA Yapısı)',
      'Genetik Şifre ve Protein Sentezi',
      'Hücresel Solunum (Glikoliz, Krebs, ETS)',
      'Fotosentez ve Kemosentez Reaksiyonları',
      'Bitki Biyolojisi (Doku, Organlar, Madde Taşınması, Büyüme)',
      'Canlılar ve Çevre (Adaptasyon & Biyoteknoloji)',
    ],
  },
  'Türkçe': {
    exam_type: 'TYT',
    topics: [
      'Sözcükte Anlam & Söz Öbekleri',
      'Cümlede Anlam & Cümle Yorumu',
      'Paragrafta Ana Düşünce & Konu',
      'Paragrafta Yardımcı Düşünceler',
      'Paragrafın Yapısı & Akışı',
      'Anlatım Teknikleri ve Düşünceyi Geliştirme Yolları',
      'Ses Bilgisi',
      'Yazım Kuralları',
      'Noktalama İşaretleri',
      'Sözcükte Yapı & Ekler',
      'İsim, Sıfat, Zamir, Zarf',
      'Edat, Bağlaç, Ünlem',
      'Fiiller & Fiilde Çatı',
      'Cümlenin Ögeleri',
      'Cümle Türleri',
      'Anlatım Bozuklukları',
    ],
  },
  'Edebiyat': {
    exam_type: 'AYT',
    topics: [
      'Şiir Bilgisi & Edebi Sanatlar',
      'İslamiyet Öncesi ve Geçiş Dönemi Türk Edebiyatı',
      'Halk Edebiyatı',
      'Divan Edebiyatı',
      'Tanzimat Edebiyatı',
      'Servet-i Fünun ve Fecr-i Ati',
      'Milli Edebiyat Dönemi',
      'Cumhuriyet Dönemi Şiiri',
      'Cumhuriyet Dönemi Roman ve Hikayesi',
      'Cumhuriyet Dönemi Tiyatrosu ve Öğretici Metinler',
      'Edebi Akımlar',
    ],
  },
  'Tarih': {
    exam_type: 'Genel',
    topics: [
      'Tarih ve Zaman',
      'İlk ve Orta Çağlarda Türk Dünyası',
      'İslam Medeniyetinin Doğuşu ve İlk İslam Devletleri',
      'Türklerin İslamiyet’i Kabulü ve İlk Türk-İslam Devletleri',
      'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi',
      'Beylikten Devlete Osmanlı Siyaseti (1300-1453)',
      'Dünya Gücü Osmanlı (1453-1595)',
      'Değişen Dünya Dengeleri Karşısında Osmanlı (1595-1774)',
      'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)',
      '20. Yüzyıl Başlarında Osmanlı Devleti ve 1. Dünya Savaşı',
      'Milli Mücadele (Hazırlık, Cepheler, Mudanya, Lozan)',
      'Atatürkçülük ve Türk İnkılabı',
      'Atatürk Dönemi Türk Dış Politikası',
      '20. Yüzyıl Başlarında Dünya & 2. Dünya Savaşı',
    ],
  },
  'Coğrafya': {
    exam_type: 'Genel',
    topics: [
      'Doğa ve İnsan & Coğrafi Beceriler',
      'Dünya’nın Şekli ve Hareketleri',
      'Coğrafi Konum (Paralel, Meridyen, Yerel Saat)',
      'Harita Bilgisi & İzoipsler',
      'Atmosfer, Hava Durumu ve İklim Elemanları',
      'Büyük İklim Tipleri ve Türkiye’nin İklimi',
      'Yerin Yapısı, İç ve Dış Kuvvetler',
      'Türkiye’nin Yer Şekilleri ve Su Varlığı',
      'Nüfus ve Yerleşme & Türkiye’de Nüfus',
      'Ekonomik Faaliyetler ve Doğal Kaynaklar',
      'Uluslararası Ulaşım Hatları ve Bölgeler',
      'Çevre ve Toplum & Doğal Afetler',
    ],
  },
  'Felsefe & Din Kültürü': {
    exam_type: 'Genel',
    topics: [
      'Felsefenin Anlamı ve Alanı',
      'Bilgi Felsefesi (Epistemoloji)',
      'Varlık Felsefesi (Ontoloji)',
      'Ahlak Felsefesi (Etik)',
      'Sanat ve Siyaset Felsefesi',
      'Din Felsefesi',
      'Kur’an’da Bazı Kavramlar & İnanç Esasları',
      'İbadetler ve Ahlaki Değerler',
      'İslam Düşüncesinde Yorumlar ve Mezhepler',
    ],
  },
};

export interface AnalyzeQuestionInput {
  image_url?: string;
  image_base64?: string;
  raw_text?: string;
  student_note?: string;
}

export interface AnalyzeQuestionResult {
  subject: string;
  topic: string;
  subtopic: string;
  error_type: ErrorType;
  difficulty: QuestionDifficulty;
  ai_explanation: string;
  study_tip: string;
}

export const wrongQuestionsService = {
  // Get all wrong questions for a student
  async getQuestions(studentId: string): Promise<WrongQuestion[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wrong_questions')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as WrongQuestion[];
        }
      } catch (err) {
        console.warn('Supabase wrong_questions fetch failed, using local cache:', err);
      }
    }

    // Local storage fallback
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as WrongQuestion[];
        return list.filter((q) => !q.student_id || q.student_id === studentId);
      } catch {
        return [];
      }
    }

    return [];
  },

  // Add a new question to database and local cache
  async addQuestion(question: Omit<WrongQuestion, 'id' | 'created_at'>): Promise<WrongQuestion> {
    const newId = 'wq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newRecord: WrongQuestion = {
      ...question,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('wrong_questions')
          .insert([
            {
              student_id: question.student_id,
              image_url: question.image_url || null,
              raw_text: question.raw_text || null,
              subject: question.subject,
              topic: question.topic,
              subtopic: question.subtopic || null,
              error_type: question.error_type,
              difficulty: question.difficulty,
              ai_explanation: question.ai_explanation || null,
              student_note: question.student_note || null,
            },
          ])
          .select()
          .single();

        if (!error && data) {
          return { ...data, exam_type: question.exam_type } as WrongQuestion;
        }
      } catch (err) {
        console.warn('Supabase wrong_questions insert error, persisting locally:', err);
      }
    }

    // Persist to local cache
    const existing = await this.getQuestions(question.student_id);
    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  // Update existing question
  async updateQuestion(id: string, updates: Partial<WrongQuestion>): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wrong_questions').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as WrongQuestion[];
        const index = list.findIndex((q) => q.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updates };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  // Delete question
  async deleteQuestion(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('wrong_questions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as WrongQuestion[];
        const updated = list.filter((q) => q.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  },

  // Upload image to Supabase storage bucket 'question-images' or convert to Base64
  async uploadImage(file: File): Promise<{ url: string; base64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        if (isSupabaseConfigured()) {
          try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `question_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
              .from('question-images')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (!error && data) {
              const { data: publicUrlData } = supabase.storage
                .from('question-images')
                .getPublicUrl(filePath);

              resolve({
                url: publicUrlData.publicUrl,
                base64: base64Data,
              });
              return;
            }
          } catch (storageErr) {
            console.warn('Supabase storage upload error, fallback to base64:', storageErr);
          }
        }

        // Fallback or demo: resolve with base64 Data URL
        resolve({
          url: base64Data,
          base64: base64Data,
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // AI Question Analysis via Backend Route /api/ai/analyze-question
  async analyzeQuestion(input: AnalyzeQuestionInput): Promise<AnalyzeQuestionResult> {
    const response = await fetch('/api/ai/analyze-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'AI analizi başarısız, tekrar dene.');
    }

    const data = await response.json();
    return data as AnalyzeQuestionResult;
  },

  // Calculate repetitive topic mistakes in the last 30 days
  // Returns topic summaries where count >= 3
  getRepetitionWarnings(questions: WrongQuestion[]): {
    subject: string;
    topic: string;
    count: number;
    questionIds: string[];
  }[] {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentQuestions = questions.filter(
      (q) => new Date(q.created_at).getTime() >= thirtyDaysAgo
    );

    const countsMap = new Map<string, { subject: string; topic: string; ids: string[] }>();

    for (const q of recentQuestions) {
      if (!q.subject || !q.topic) continue;
      const key = `${q.subject.trim().toLowerCase()}:::${q.topic.trim().toLowerCase()}`;
      const current = countsMap.get(key) || {
        subject: q.subject,
        topic: q.topic,
        ids: [],
      };
      current.ids.push(q.id);
      countsMap.set(key, current);
    }

    const warnings: {
      subject: string;
      topic: string;
      count: number;
      questionIds: string[];
    }[] = [];

    for (const [, value] of countsMap.entries()) {
      if (value.ids.length >= 3) {
        warnings.push({
          subject: value.subject,
          topic: value.topic,
          count: value.ids.length,
          questionIds: value.ids,
        });
      }
    }

    return warnings;
  },

  // AI Summary Analysis of all wrong questions
  async analyzeWrongQuestionsSummary(
    questions: WrongQuestion[],
    forceRefresh = false
  ): Promise<WrongQuestionsAnalysisReport> {
    if (!forceRefresh) {
      const cached = localStorage.getItem(ANALYSIS_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as WrongQuestionsAnalysisReport;
          // Check if cache is still fresh (< 1 hour) and matches question count
          if (parsed && parsed.total_questions_analyzed === questions.length) {
            return parsed;
          }
        } catch {
          // ignore cache parse error
        }
      }
    }

    try {
      const response = await fetch('/api/ai/analyze-wrong-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });

      if (!response.ok) {
        throw new Error('AI analizi yanıt vermedi');
      }

      const data = (await response.json()) as WrongQuestionsAnalysisReport;
      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Backend AI wrong questions analysis failed, using client heuristic:', err);
      // Client-side fallback computation
      const total = questions.length;
      const topicMap: Record<string, any> = {};
      const errorTypeCounts: Record<string, number> = {
        bilgi_eksikligi: 0,
        dikkatsizlik: 0,
        kavram_yanilgisi: 0,
        zaman_yetersizligi: 0,
        soru_tipi_yanlis_anlama: 0,
      };

      questions.forEach((q) => {
        const key = `${q.subject}::${q.topic}`;
        if (!topicMap[key]) {
          topicMap[key] = {
            subject: q.subject,
            topic: q.topic,
            exam_type: q.exam_type || (q.subject.includes('AYT') ? 'AYT' : 'TYT'),
            count: 0,
            errorTypes: {},
          };
        }
        topicMap[key].count += 1;
        const et = q.error_type || 'bilgi_eksikligi';
        topicMap[key].errorTypes[et] = (topicMap[key].errorTypes[et] || 0) + 1;
        if (errorTypeCounts[et] !== undefined) errorTypeCounts[et] += 1;
      });

      const labelsMap: Record<string, string> = {
        bilgi_eksikligi: 'Bilgi Eksikliği',
        dikkatsizlik: 'Dikkatsizlik / İşlem Hatası',
        kavram_yanilgisi: 'Kavram Yanılgısı',
        zaman_yetersizligi: 'Zaman Yetersizliği',
        soru_tipi_yanlis_anlama: 'Soru Tipi Yanlış Anlama',
      };

      const weak_topics = Object.values(topicMap)
        .sort((a, b) => b.count - a.count)
        .map((item) => {
          let topError = 'bilgi_eksikligi';
          let maxCount = 0;
          Object.entries(item.errorTypes).forEach(([et, cnt]) => {
            if ((cnt as number) > maxCount) {
              topError = et;
              maxCount = cnt as number;
            }
          });

          return {
            subject: item.subject,
            topic: item.topic,
            exam_type: item.exam_type,
            count: item.count,
            primary_error_type: topError as ErrorType,
            severity: (item.count >= 3 ? 'kritik' : item.count >= 2 ? 'orta' : 'hafif') as 'kritik' | 'orta' | 'hafif',
            study_action: `${item.topic} konusunda kazanım testleri çözerek soru tiplerini pekiştir.`,
          };
        });

      const fallbackReport: WrongQuestionsAnalysisReport = {
        generated_at: new Date().toISOString(),
        total_questions_analyzed: total,
        weak_topics: weak_topics.slice(0, 8),
        error_type_distribution: Object.entries(errorTypeCounts).map(([et, count]) => ({
          error_type: et as ErrorType,
          label: labelsMap[et] || et,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        })),
        strategic_insights: [
          weak_topics.length > 0
            ? `En kritik hata kümelenmesi ${weak_topics[0].subject} dersi "${weak_topics[0].topic}" konusunda tespit edildi (${weak_topics[0].count} soru).`
            : 'Hata kasanıza yeni sorular ekledikçe yapay zeka zayıf konularınızı anlık eşleştirecektir.',
          'Hata kasanızdaki soruları haftalık periyotlarla tekrar çözerek pekiştirin.',
        ],
        recommended_focus_area: weak_topics[0] ? `${weak_topics[0].subject} - ${weak_topics[0].topic}` : 'Genel Tekrar',
      };

      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(fallbackReport));
      return fallbackReport;
    }
  },
};
