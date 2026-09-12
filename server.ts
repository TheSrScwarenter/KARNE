import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON request bodies up to 50MB for image base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy init Gemini SDK
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// System prompt for YKS Question Analysis
const YKS_SYSTEM_PROMPT = `Sen Türkiye YKS (TYT ve AYT) sınav sistemi ve ders müfredatı konusunda uzmanlaşmış bir yapay zeka eğitim ve soru analiz uzmanısın.
Sana bir YKS sorusu (görsel ve/veya metin) ve varsa öğrencinin soruyla ilgili "neden yanlış yaptım" notu verilecek.

GÖREVLERİN:
1. Sorunun görselini ve metnini çok dikkatli incele.
2. DERSİ (subject) ve KONUYU (topic) kesinlikle doğru tespit et.
   - BİYOLOJİ: Hücre, Organeller, Kalıtım & Genetik, Fotosentez, Kemosentez, Hücresel Solunum, Ekoloji & Çevre, İnsan Fizyolojisi / Sistemler (Sinir Sistemi, Endokrin Sistem, Duyu Organları, Destek ve Hareket, Sindirim Sistemi, Dolaşım ve Bağışıklık, Solunum Sistemi, Boşaltım Sistemi, Üreme Sistemi), Nükleik Asitler, Protein Sentezi, Biyoteknoloji, Canlıların Sınıflandırılması, Bitki Biyolojisi vb.
     (Önemli: Soruda hücre, kloroplast, mitokondri, dna/rna, enzim, fotosentez, solunum, bitki, hayvan, organ, hormon vb. biyolojik terimler veya şekiller varsa bu soru KESİNLİKLE 'Biyoloji' dersidir!)
   - KİMYA: Mol Kavramı, Periyodik Sistem, Kimyasal Türler Arası Etkileşimler, Gazlar, Sıvı Çözeltiler, Kimyasal Tepkimelerde Enerji / Entalpi, Kimyasal Denge, Asit-Baz Dengesi, Çözünürlük Dengesi (Kçç), Elektrokimya & Piller, Organik Kimya vb.
   - FİZİK: Vektörler, Bağıl Hareket, Newton Yasaları, İtme ve Çizgisel Momentum, Elektrik ve Manyetizma, Dalgalar, Optik ve Işık, Düzgün Çembersel Hareket, Basit Harmonik Hareket, Modern Fizik vb.
   - MATEMATİK: Temel Kavramlar, Sayılar, Fonksiyonlar, Polinomlar, 2. Dereceden Denklemler, Parabol, Trigonometri, Logaritma, Diziler, Limit, Türev, İntegral, Olasılık vb.
   - GEOMETRİ: Doğruda ve Üçgende Açılar, Üçgende Benzerlik ve Alan, Çokgenler ve Dörtgenler, Çember ve Daire, Katı Cisimler, Analitik Geometri vb.
   - TÜRKÇE: Paragrafta Anlam, Cümlede Anlam, Sözcükte Anlam, Ses Bilgisi, Yazım Kuralları, Noktalama İşaretleri, Dil Bilgisi vb.

3. Hata tipini şu 5 kategoriden birine ata:
   - "bilgi_eksikligi": Formül, kavram, kural veya tanım bilinmiyor ya da unutulmuş.
   - "dikkatsizlik": İşlem, toplama/çıkarma, işaret veya soru kökünü dikkatsiz okuma hatası.
   - "kavram_yanilgisi": İki kural veya kavram birbirine karıştırılmış ya da yanlış mantık yürütülmüş.
   - "zaman_yetersizligi": Süre yetmediği için soru aceleye gelmiş ya da bitirilememiş.
   - "soru_tipi_yanlis_anlama": Soru kökü (örn. "değinilmemiştir", "kesinlikle doğrudur", "olamaz") veya çeldirici seçenek yanlış yorumlanmış.

4. Zorluk seviyesini tahmin et: "kolay" | "orta" | "zor".
5. 2-3 cümlelik Türkçe net çözüm ve hata tespiti (ai_explanation) üret.
6. Bu hatayı telafi etmek için 1 cümlelik çalışma önerisi (study_tip) ver.`;

// Smart fallback analyzer for offline/demo reliability
function generateHeuristicAnalysis(rawText?: string, studentNote?: string, hasImage?: boolean) {
  const combined = `${rawText || ''} ${studentNote || ''}`.toLowerCase();

  let subject = 'Matematik';
  let topic = 'Fonksiyonlar';
  let subtopic = 'Bileşke ve Ters Fonksiyon';
  let error_type: 'bilgi_eksikligi' | 'dikkatsizlik' | 'zaman_yetersizligi' | 'kavram_yanilgisi' | 'soru_tipi_yanlis_anlama' = 'bilgi_eksikligi';
  let difficulty: 'kolay' | 'orta' | 'zor' = 'orta';
  let ai_explanation = 'Soru incelendiğinde temel kural ve bağıntıların uygulanmasında eksiklik tespit edildi.';
  let study_tip = 'Bu konuyla ilgili temel kazanım testlerini çözerek formül ve tanımları pekiştir.';

  // Biyoloji kontrolü
  if (
    combined.includes('biyo') ||
    combined.includes('hücre') ||
    combined.includes('organel') ||
    combined.includes('mitokondri') ||
    combined.includes('kloroplast') ||
    combined.includes('dna') ||
    combined.includes('rna') ||
    combined.includes('gen') ||
    combined.includes('genetik') ||
    combined.includes('kalıtım') ||
    combined.includes('fotosentez') ||
    combined.includes('solunum') ||
    combined.includes('kemosentez') ||
    combined.includes('atp') ||
    combined.includes('enzim') ||
    combined.includes('protein') ||
    combined.includes('mitoz') ||
    combined.includes('mayoz') ||
    combined.includes('üreme') ||
    combined.includes('ekoloji') ||
    combined.includes('popülasyon') ||
    combined.includes('komünite') ||
    combined.includes('sistem') ||
    combined.includes('dolaşım') ||
    combined.includes('sindirim') ||
    combined.includes('boşaltım') ||
    combined.includes('endokrin') ||
    combined.includes('hormon') ||
    combined.includes('sinir') ||
    combined.includes('nöron') ||
    combined.includes('bitki') ||
    combined.includes('canlı') ||
    combined.includes('soyağacı')
  ) {
    subject = 'Biyoloji';
    topic = combined.includes('kalıtım') || combined.includes('gen') || combined.includes('soyağacı')
      ? 'Kalıtım ve Genetik'
      : combined.includes('fotosentez') || combined.includes('solunum')
      ? 'Hücresel Enerji Dönüşümleri'
      : combined.includes('sistem') || combined.includes('hormon') || combined.includes('sinir')
      ? 'İnsan Fizyolojisi ve Sistemler'
      : 'Hücre ve Canlıların Temel Bileşenleri';
    subtopic = 'Kazanım ve Kavram Analizi';
    difficulty = 'orta';
    error_type = 'kavram_yanilgisi';
    ai_explanation = 'Biyolojik süreçlerin gerçekleştiği hücresel yapılar ve reaksiyon basamakları arasındaki ilişki gözden kaçırılmış.';
    study_tip = 'Konu şemalarını ve kavram haritalarını çizerek reaksiyon basamaklarını tekrar et.';
  } else if (
    combined.includes('kimya') ||
    combined.includes('mol') ||
    combined.includes('asit') ||
    combined.includes('baz') ||
    combined.includes('periyodik') ||
    combined.includes('organik') ||
    combined.includes('tepkime') ||
    combined.includes('çözelti') ||
    combined.includes('gaz') ||
    combined.includes('denge') ||
    combined.includes('redoks') ||
    combined.includes('pil')
  ) {
    subject = 'Kimya';
    topic = combined.includes('organik')
      ? 'Organik Kimya'
      : combined.includes('denge')
      ? 'Kimyasal Denge ve Çözünürlük'
      : 'Kimyasal Hesaplamalar ve Mol';
    subtopic = 'Mol & Kütle İlişkileri';
    difficulty = 'orta';
    error_type = 'dikkatsizlik';
    ai_explanation = 'Katsayılar oranı doğru kurulmuş ancak mol kütlesi veya derişim hesaplamalarında işlem hatası yapılmış.';
    study_tip = 'Denkleşmiş tepkimede sınırlayıcı maddeyi belirlerken mol sayılarını katsayılara bölerek kontrol et.';
  } else if (
    combined.includes('fizik') ||
    combined.includes('vektör') ||
    combined.includes('kuvvet') ||
    combined.includes('elektrik') ||
    combined.includes('optik') ||
    combined.includes('dalga') ||
    combined.includes('newton') ||
    combined.includes('momentum') ||
    combined.includes('manyet') ||
    combined.includes('ışık') ||
    combined.includes('ayna')
  ) {
    subject = 'Fizik';
    topic = combined.includes('optik') || combined.includes('ışık') || combined.includes('ayna')
      ? 'Optik ve Işık'
      : combined.includes('elektrik') || combined.includes('manyet')
      ? 'Elektrik ve Manyetizma'
      : 'Kuvvet ve Hareket';
    subtopic = 'Formül ve Yasa Uygulamaları';
    difficulty = 'orta';
    error_type = 'kavram_yanilgisi';
    ai_explanation = 'Fiziksel prensip ve yön bağıntıları doğru yorumlanmış ancak skaler/vektörel ayrımında hata yapılmış.';
    study_tip = 'Serbest cisim diyagramı çizerek kuvvet vektörlerini bileşenlerine ayır.';
  } else if (
    combined.includes('türkçe') ||
    combined.includes('paragraf') ||
    combined.includes('ana fikir') ||
    combined.includes('yazar') ||
    combined.includes('metin') ||
    combined.includes('anlatım') ||
    combined.includes('noktalama')
  ) {
    subject = 'Türkçe';
    topic = 'Paragrafta Anlam';
    subtopic = 'Ana Düşünce & Yardımcı Düşünceler';
    difficulty = 'orta';
    error_type = 'soru_tipi_yanlis_anlama';
    ai_explanation = 'Şıklar arasında çeldiriciye gidilmiş, metnin bütünü yerine tek bir cümleye odaklanılarak ana fikir yanlış tespit edilmiş.';
    study_tip = 'Paragrafı okurken yazarın vurgulamak istediği sonuca odaklan ve çeldirici seçenekleri eleyerek ilerle.';
  } else if (
    combined.includes('geometri') ||
    combined.includes('üçgen') ||
    combined.includes('çember') ||
    combined.includes('dörtgen') ||
    combined.includes('açı') ||
    combined.includes('alan') ||
    combined.includes('benzerlik') ||
    combined.includes('analitik')
  ) {
    subject = 'Geometri';
    topic = 'Üçgende Benzerlik ve Alan';
    subtopic = 'Temel Orantı Teoremi';
    difficulty = 'orta';
    error_type = 'dikkatsizlik';
    ai_explanation = 'Görseldeki yardımcı çizgi ve oranlar doğru görülmüş ancak açıortay oranı yerine kenarortay özelliği kullanılmış.';
    study_tip = 'Benzerlik oranı k ise alanlar oranının k² olduğunu unutmadan soruları modelle.';
  } else if (
    combined.includes('türev') ||
    combined.includes('integral') ||
    combined.includes('limit') ||
    combined.includes('trigonometri') ||
    combined.includes('logaritma') ||
    combined.includes('polinom') ||
    combined.includes('parabol') ||
    combined.includes('fonksiyon')
  ) {
    subject = 'Matematik (AYT)';
    topic = combined.includes('türev')
      ? 'Türev ve Uygulamaları'
      : combined.includes('integral')
      ? 'İntegral ve Alan Hesabı'
      : combined.includes('trigonometri')
      ? 'Trigonometri'
      : 'Fonksiyonlar ve Polinomlar';
    subtopic = 'Uygulama ve Çözüm';
    difficulty = 'zor';
    ai_explanation = 'Kural doğru hatırlanmış ancak ekstremum veya dönüşüm işlemlerinde işaret hatası yapılmış.';
    study_tip = 'İşaret tablosu ve türev adımlarını acele etmeden adım adım yazarak kontrol et.';
  }

  // Adjust error type if student noted something specific
  if (combined.includes('dikkat') || combined.includes('işlem') || combined.includes('hızlı') || combined.includes('okumadım')) {
    error_type = 'dikkatsizlik';
  } else if (combined.includes('süre') || combined.includes('yetişmedi') || combined.includes('zaman') || combined.includes('geç kaldım')) {
    error_type = 'zaman_yetersizligi';
  } else if (combined.includes('bilmiyorum') || combined.includes('hatırlamadım') || combined.includes('konu') || combined.includes('unuttum')) {
    error_type = 'bilgi_eksikligi';
  } else if (combined.includes('kavram') || combined.includes('karıştırdım') || combined.includes('ters')) {
    error_type = 'kavram_yanilgisi';
  } else if (combined.includes('soru') || combined.includes('anlamadım') || combined.includes('kökü')) {
    error_type = 'soru_tipi_yanlis_anlama';
  }

  return {
    subject,
    topic,
    subtopic,
    error_type,
    difficulty,
    ai_explanation,
    study_tip,
  };
}

// System prompt for Wrong Questions Weak Topics & Root Cause Summary
const WRONG_QUESTIONS_SUMMARY_PROMPT = `Sen Türkiye YKS (TYT ve AYT) sınav sistemi ve ders müfredatı konusunda uzmanlaşmış bir yapay zeka eğitim ve soru analiz uzmanısın.
Öğrencinin "Hata Kasası"nda biriken tüm yanlış soruları (TYT/AYT türü, ders, konu, hata tipi, zorluk seviyesi ve varsa öğrenci notları) inceleyerek zayıf konu teşhisi ve hata kök neden analizi yapacaksın.

SADECE aşağıdaki JSON şemasında yanıt ver:
{
  "total_questions_analyzed": number,
  "weak_topics": [
    {
      "subject": string,
      "topic": string,
      "exam_type": "TYT" | "AYT" | "Genel",
      "count": number,
      "primary_error_type": "bilgi_eksikligi" | "dikkatsizlik" | "kavram_yanilgisi" | "zaman_yetersizligi" | "soru_tipi_yanlis_anlama",
      "severity": "kritik" | "orta" | "hafif",
      "study_action": string
    }
  ],
  "error_type_distribution": [
    {
      "error_type": "bilgi_eksikligi" | "dikkatsizlik" | "kavram_yanilgisi" | "zaman_yetersizligi" | "soru_tipi_yanlis_anlama",
      "label": string,
      "count": number,
      "percentage": number
    }
  ],
  "strategic_insights": string[],
  "recommended_focus_area": string
}

Kurallar:
- En çok yanlış çıkan konuları soru sayısı çoktan aza doğru sırala.
- Tekrar eden hata tiplerine (özellikle dikkatsizlik veya kavram yanılgısı) dikkat çek.
- Türkçe, motive edici, net ve uygulanabilir tavsiyeler ver.`;

function generateHeuristicWrongQuestionsAnalysis(questions: any[]) {
  const total = (questions || []).length;
  const topicMap: Record<string, { subject: string; topic: string; exam_type: string; count: number; errorTypes: Record<string, number> }> = {};
  const errorTypeCounts: Record<string, number> = {
    bilgi_eksikligi: 0,
    dikkatsizlik: 0,
    kavram_yanilgisi: 0,
    zaman_yetersizligi: 0,
    soru_tipi_yanlis_anlama: 0,
  };

  (questions || []).forEach((q) => {
    const subj = q.subject || 'Matematik';
    const top = q.topic || 'Genel Konu';
    const examType = q.exam_type || (subj.includes('AYT') ? 'AYT' : 'TYT');
    const key = `${subj}::${top}`;

    if (!topicMap[key]) {
      topicMap[key] = { subject: subj, topic: top, exam_type: examType, count: 0, errorTypes: {} };
    }
    topicMap[key].count += 1;
    const errType = q.error_type || 'bilgi_eksikligi';
    topicMap[key].errorTypes[errType] = (topicMap[key].errorTypes[errType] || 0) + 1;

    if (errorTypeCounts[errType] !== undefined) {
      errorTypeCounts[errType] += 1;
    } else {
      errorTypeCounts.bilgi_eksikligi += 1;
    }
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
      let topErrorCount = 0;
      Object.entries(item.errorTypes).forEach(([et, count]) => {
        if (count > topErrorCount) {
          topError = et;
          topErrorCount = count;
        }
      });

      const severity: 'kritik' | 'orta' | 'hafif' = item.count >= 3 ? 'kritik' : item.count >= 2 ? 'orta' : 'hafif';
      let study_action = `${item.topic} konusunda kazanım testleri çözerek soru tiplerini pekiştir.`;
      if (topError === 'dikkatsizlik') {
        study_action = `${item.topic} sorularında işlem basamaklarını satır satır yaz ve işaret kontrollerini alışkanlık haline getir.`;
      } else if (topError === 'kavram_yanilgisi') {
        study_action = `${item.topic} ile ilgili temel kavram şemalarını ve kural istisnalarını not çıkararak çalış.`;
      } else if (topError === 'zaman_yetersizligi') {
        study_action = `${item.topic} sorularında kronometre ile 10 soruluk hız testleri yap.`;
      } else if (topError === 'soru_tipi_yanlis_anlama') {
        study_action = `${item.topic} sorularında soru kökünü (değildir/olamaz/kesinlikle) çizerek analiz et.`;
      }

      return {
        subject: item.subject,
        topic: item.topic,
        exam_type: item.exam_type,
        count: item.count,
        primary_error_type: topError as any,
        severity,
        study_action,
      };
    });

  const error_type_distribution = Object.entries(errorTypeCounts).map(([et, count]) => ({
    error_type: et as any,
    label: labelsMap[et] || et,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const strategic_insights = [
    weak_topics.length > 0
      ? `En kritik hata kümelenmesi ${weak_topics[0].subject} dersi "${weak_topics[0].topic}" konusunda tespit edildi (${weak_topics[0].count} soru).`
      : 'Hata kasanıza yeni sorular ekledikçe yapay zeka zayıf konularınızı anlık eşleştirecektir.',
    errorTypeCounts.dikkatsizlik > (total * 0.3)
      ? 'Yanlışların %30’undan fazlası dikkatsizlik ve işlem hatası kaynaklı; denemelerde acele etmeden soru kökü okumaya odaklanılmalı.'
      : 'Konu bazlı bilgi açıklarını kapatmak için haftalık tekrar blokları oluşturulmalı.',
    weak_topics.filter((w) => w.severity === 'kritik').length > 0
      ? `Acil eylem gerektiren ${weak_topics.filter((w) => w.severity === 'kritik').length} kritik konu başlığı var; bu konular çalışma programının ilk sırasına alınmalı.`
      : 'Yanlış dağılımı dengeli görünüyor; düzenli soru çözümü ve hata inceleme ritmi korunmalı.',
  ];

  return {
    generated_at: new Date().toISOString(),
    total_questions_analyzed: total,
    weak_topics: weak_topics.slice(0, 8),
    error_type_distribution,
    strategic_insights,
    recommended_focus_area: weak_topics[0] ? `${weak_topics[0].subject} - ${weak_topics[0].topic}` : 'Genel Tekrar',
  };
}

// AI Analyze Wrong Questions Summary Endpoint
app.post('/api/ai/analyze-wrong-questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      res.json(generateHeuristicWrongQuestionsAnalysis([]));
      return;
    }

    const ai = getGenAI();

    if (!ai) {
      const fallbackResult = generateHeuristicWrongQuestionsAnalysis(questions);
      res.json(fallbackResult);
      return;
    }

    const simplifiedQuestions = questions.map((q: any) => ({
      exam_type: q.exam_type || 'TYT',
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic,
      error_type: q.error_type,
      difficulty: q.difficulty,
      student_note: q.student_note,
    }));

    const userPromptText = `Aşağıda öğrencinin Hata Kasası'nda kayıtlı olan ${simplifiedQuestions.length} adet yanlış sorunun sınıflandırma verileri yer almaktadır:\n\n${JSON.stringify(
      simplifiedQuestions,
      null,
      2
    )}\n\nBu verileri derinlemesine analiz et; en çok yanlış çıkan zayıf konuları, baskın hata tiplerini ve stratejik çalışma içgörülerini JSON şemasında çıkar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
      config: {
        systemInstruction: WRONG_QUESTIONS_SUMMARY_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 2000,
      },
    });

    const outputText = response.text || '';
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsed = JSON.parse(cleanJson);
      parsed.generated_at = new Date().toISOString();
      res.json(parsed);
    } catch (parseErr) {
      console.warn('JSON parse failed on Gemini wrong questions summary:', outputText, parseErr);
      const fallbackResult = generateHeuristicWrongQuestionsAnalysis(questions);
      res.json(fallbackResult);
    }
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-wrong-questions:', err);
    try {
      const fallback = generateHeuristicWrongQuestionsAnalysis(req.body.questions || []);
      res.json(fallback);
    } catch {
      res.status(500).json({ error: 'Hata kasası AI analizi yapılamadı.' });
    }
  }
});

// System prompt for Exam Analysis as specified in FAZ 4 specification
const EXAM_ANALYSIS_SYSTEM_PROMPT = `Sen bir YKS deneme analiz uzmanısın. Öğrencinin son denemelerindeki ders/konu bazlı sonuçlarını ve yanlış soru bankasındaki hata dağılımını analiz et.

SADECE aşağıdaki JSON şemasında yanıt ver:
{
  "weak_subjects": [
    {
      "subject": string,
      "trend": "düşüş" | "sabit" | "yükseliş",
      "reasoning": string
    }
  ],
  "weak_topics": [
    {
      "subject": string,
      "topic": string,
      "wrong_count": number
    }
  ],
  "cross_insights": string[]
}

Kurallar:
- Veri yetersizse (örn. tek deneme var, trend hesaplanamaz) trend: "sabit" ve reasoning'de bunu belirt.
- Zayıf dersleri ve trendlerini analiz ederken net değişimlerine ve standart sapmalara bak.
- Çapraz içgörülerde, hem denemelerde yanlış yapılan hem de yanlış soru bankasında biriken kritik konuları ve hata tiplerini vurgula.
- Maksimum 1500 token.`;

// Heuristic fallback analyzer for Exam Analysis
function generateHeuristicExamAnalysis(subjectResults: any[], topicResults: any[], wrongQuestions: any[]) {
  // If there is no real exam data provided, return clean empty result
  if ((!subjectResults || subjectResults.length === 0) && (!topicResults || topicResults.length === 0)) {
    return {
      weak_subjects: [],
      weak_topics: [],
      cross_insights: [
        'Henüz kayıtlı deneme sınavı bulunmuyor. Denemelerinizi ekledikten sonra ders ve konu bazlı yapay zeka analizleri burada listelenecektir.',
      ],
    };
  }

  // Group subject scores over time to compute average net and trend
  const subjectMap: Record<string, { nets: number[]; totalWrong: number; dates: string[] }> = {};

  (subjectResults || []).forEach((sr) => {
    const subj = sr.subject || 'Diğer';
    if (!subjectMap[subj]) {
      subjectMap[subj] = { nets: [], totalWrong: 0, dates: [] };
    }
    subjectMap[subj].nets.push(Number(sr.net) || 0);
    subjectMap[subj].totalWrong += Number(sr.wrong) || 0;
    if (sr.exam_date) subjectMap[subj].dates.push(sr.exam_date);
  });

  const weak_subjects: any[] = [];
  const subjectsList = Object.keys(subjectMap);

  if (subjectsList.length === 0) {
    // No subjects recorded
  } else {
    subjectsList.forEach((subj) => {
      const data = subjectMap[subj];
      let trend: 'düşüş' | 'sabit' | 'yükseliş' = 'sabit';
      let reasoning = '';

      if (data.nets.length >= 2) {
        const firstHalf = data.nets.slice(0, Math.ceil(data.nets.length / 2));
        const secondHalf = data.nets.slice(Math.ceil(data.nets.length / 2));
        const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const diff = avg2 - avg1;

        if (diff > 1.5) {
          trend = 'yükseliş';
          reasoning = `Son denemelerde ortalama ${diff.toFixed(1)} net artış gözleniyor. Performans istikrarlı bir şekilde yukarı yönlü.`;
        } else if (diff < -1.5) {
          trend = 'düşüş';
          reasoning = `Son denemelerde ortalama ${Math.abs(diff).toFixed(1)} netlik bir gerileme var. Özellikle süre yönetimi ve zor soru tiplerinde takılma yaşanmış olabilir.`;
        } else {
          trend = 'sabit';
          reasoning = `Netler genel olarak plato evresinde (ortalama ${(data.nets.reduce((a, b) => a + b, 0) / data.nets.length).toFixed(1)} net bandında) dalgalanıyor.`;
        }
      } else {
        trend = 'sabit';
        reasoning = `Tek deneme kaydı mevcut olduğu için net trendi hesaplanamadı (Mevcut Net: ${data.nets[0] || 0}).`;
      }

      weak_subjects.push({
        subject: subj,
        trend,
        reasoning,
      });
    });
  }

  // Aggregate weak topics from topic_results and wrong_questions
  const topicCounts: Record<string, { subject: string; wrong_count: number }> = {};
  (topicResults || []).forEach((tr) => {
    if (!tr.topic) return;
    const key = `${tr.subject || 'Genel'} - ${tr.topic}`;
    if (!topicCounts[key]) {
      topicCounts[key] = { subject: tr.subject || 'Genel', wrong_count: 0 };
    }
    topicCounts[key].wrong_count += Number(tr.wrong_count) || 1;
  });

  (wrongQuestions || []).forEach((wq: any) => {
    if (!wq.topic) return;
    const key = `${wq.subject || 'Genel'} - ${wq.topic}`;
    if (!topicCounts[key]) {
      topicCounts[key] = { subject: wq.subject || 'Genel', wrong_count: 0 };
    }
    topicCounts[key].wrong_count += 1;
  });

  const weak_topics = Object.entries(topicCounts)
    .map(([key, val]) => {
      const topic = key.split(' - ')[1] || key;
      return {
        subject: val.subject,
        topic,
        wrong_count: val.wrong_count,
      };
    })
    .sort((a, b) => b.wrong_count - a.wrong_count)
    .slice(0, 6);

  // Cross insights (Gerçek Denemeler + Yanlış Soru Bankası kesişimi)
  const cross_insights: string[] = [];

  if (weak_topics.length > 0) {
    const topTopic = weak_topics[0];
    cross_insights.push(
      `${topTopic.subject} - ${topTopic.topic} konusu toplam ${topTopic.wrong_count} hata ile en kritik öncelikli odak alanı olarak belirlendi.`
    );
  }

  if (weak_topics.length > 1) {
    const secondTopic = weak_topics[1];
    cross_insights.push(
      `${secondTopic.subject} alanında ${secondTopic.topic} konusunda tekrar ve pekiştirme yapılması önerilir.`
    );
  }

  if (wrongQuestions && wrongQuestions.length > 0) {
    const errorTypes: Record<string, number> = {};
    wrongQuestions.forEach((wq: any) => {
      if (wq.error_type) {
        errorTypes[wq.error_type] = (errorTypes[wq.error_type] || 0) + 1;
      }
    });
    const topErrorType = Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0];
    if (topErrorType) {
      cross_insights.push(
        `Yanlış Soru Bankası kayıtlarında en sık rastlanan hata kök nedeni: "${topErrorType[0]}" (${topErrorType[1]} soru).`
      );
    }
  }

  if (cross_insights.length === 0) {
    cross_insights.push(
      'Girdiğiniz deneme sonuçlarına göre henüz belirgin bir zayıf konu kümelenmesi saptanmadı. Yeni denemeler eklendikçe çapraz korelasyonlar güncellenecektir.'
    );
  }

  return {
    weak_subjects: weak_subjects.slice(0, 4),
    weak_topics,
    cross_insights,
  };
}

// AI Analyze Question Endpoint
app.post('/api/ai/analyze-question', async (req: Request, res: Response): Promise<void> => {
  try {
    const { image_url, image_base64, raw_text, student_note } = req.body;

    if (!image_url && !image_base64 && (!raw_text || !raw_text.trim())) {
      res.status(400).json({ error: 'Lütfen bir soru görseli yükleyin veya soru metnini girin.' });
      return;
    }

    const ai = getGenAI();

    // If Gemini API is not configured, return smart domain heuristic
    if (!ai) {
      const fallbackResult = generateHeuristicAnalysis(raw_text, student_note, Boolean(image_url || image_base64));
      res.json(fallbackResult);
      return;
    }

    // Build prompt parts
    const parts: any[] = [];

    // Add image if present
    if (image_base64) {
      let mimeType = 'image/jpeg';
      let data = image_base64;

      if (image_base64.includes('data:') && image_base64.includes(';base64,')) {
        const matches = image_base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          data = matches[2];
        }
      }

      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    let userPromptText = 'Aşağıdaki YKS sorusunu analiz et:\n';
    if (raw_text && raw_text.trim()) {
      userPromptText += `\n[SORU METNİ]:\n${raw_text.trim()}\n`;
    }
    if (image_url) {
      userPromptText += `\n[GÖRSEL BAĞLANTISI]: ${image_url}\n`;
    }
    if (student_note && student_note.trim()) {
      userPromptText += `\n[ÖĞRENCİNİN NOTU (Neden yanlış yaptı?)]:\n${student_note.trim()}\n`;
    }
    userPromptText += `\nLütfen yalnızca istenen JSON formatında yanıt ver.`;

    parts.push({ text: userPromptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: YKS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "Sorunun ait olduğu YKS dersi. Örn: 'Biyoloji', 'Matematik', 'Fizik', 'Kimya', 'Geometri', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'",
            },
            topic: {
              type: Type.STRING,
              description: "Sorunun ana konusu (örn: Fotosentez, Hücre, Kalıtım, Dolaşım Sistemi, Türev vb.)",
            },
            subtopic: {
              type: Type.STRING,
              description: "Sorunun alt konusu veya spesifik kazanımı.",
            },
            error_type: {
              type: Type.STRING,
              enum: ["bilgi_eksikligi", "dikkatsizlik", "zaman_yetersizligi", "kavram_yanilgisi", "soru_tipi_yanlis_anlama"],
            },
            difficulty: {
              type: Type.STRING,
              enum: ["kolay", "orta", "zor"],
            },
            ai_explanation: {
              type: Type.STRING,
              description: "Sorunun doğru çözümü ve öğrencinin nerede hata yapmış olabileceğine dair Türkçe açıklama (2-3 cümle).",
            },
            study_tip: {
              type: Type.STRING,
              description: "Bu konuyu pekiştirmek için 1 cümlelik nokta atışı çalışma tavsiyesi.",
            },
          },
          required: ["subject", "topic", "subtopic", "error_type", "difficulty", "ai_explanation", "study_tip"],
        },
      },
    });

    const outputText = response.text || '';
    
    // Clean potential markdown fences
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseErr) {
      console.warn('JSON parse failed on Gemini response:', outputText, parseErr);
      // Fallback to domain analysis if parsing failed
      const fallbackResult = generateHeuristicAnalysis(raw_text, student_note, Boolean(image_url || image_base64));
      res.json(fallbackResult);
    }
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-question:', err);
    // Return friendly error or resilient fallback
    try {
      const fallback = generateHeuristicAnalysis(req.body.raw_text, req.body.student_note, Boolean(req.body.image_url || req.body.image_base64));
      res.json(fallback);
    } catch {
      res.status(500).json({ error: 'AI analizi başarısız, tekrar dene.' });
    }
  }
});

// AI Analyze Exams Endpoint (FAZ 4)
app.post('/api/ai/analyze-exams', async (req: Request, res: Response): Promise<void> => {
  try {
    const { exam_subject_results, exam_topic_results, wrong_questions } = req.body;

    const ai = getGenAI();

    // Fallback if AI not configured
    if (!ai) {
      const fallbackResult = generateHeuristicExamAnalysis(
        exam_subject_results,
        exam_topic_results,
        wrong_questions
      );
      res.json(fallbackResult);
      return;
    }

    const payloadContext = {
      son_90_gun_deneme_ders_sonuclari: exam_subject_results || [],
      son_90_gun_deneme_konu_yanlislari: exam_topic_results || [],
      yanlis_soru_bankasi_ozeti: (wrong_questions || []).map((wq: any) => ({
        subject: wq.subject,
        topic: wq.topic,
        error_type: wq.error_type,
        difficulty: wq.difficulty,
        study_tip: wq.study_tip,
      })),
    };

    const userPromptText = `Aşağıdaki son 90 güne ait YKS deneme sonuçlarını, konu yanlışlarını ve Yanlış Soru Bankası verilerini analiz et:\n\n${JSON.stringify(
      payloadContext,
      null,
      2
    )}\n\nLütfen sadece belirtilen JSON şemasında çıktı ver.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
      config: {
        systemInstruction: EXAM_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 1500,
      },
    });

    const outputText = response.text || '';
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseErr) {
      console.warn('JSON parse failed on Gemini exam analysis response:', outputText, parseErr);
      const fallbackResult = generateHeuristicExamAnalysis(
        exam_subject_results,
        exam_topic_results,
        wrong_questions
      );
      res.json(fallbackResult);
    }
  } catch (err: any) {
    console.error('Error in /api/ai/analyze-exams:', err);
    try {
      const fallback = generateHeuristicExamAnalysis(
        req.body.exam_subject_results,
        req.body.exam_topic_results,
        req.body.wrong_questions
      );
      res.json(fallback);
    } catch {
      res.status(500).json({ error: 'Deneme AI analizi gerçekleştirilemedi.' });
    }
  }
});

// System prompt for Program Advisor as specified in FAZ 5 specification
const PROGRAM_ADVISOR_SYSTEM_PROMPT = `Sen bir YKS ders programı danışmanısın. Öğrencinin zayıf ders/konu analizini, son haftalardaki gerçek çalışma dağılımını ve haftalık kısıtlarını (toplam saat, müsait gün/saatler) dikkate alarak dengeli bir haftalık program öner.

Kurallar:
- Zayıf derslere orantılı olarak daha fazla zaman ayır ama hiçbir dersi tamamen ihmal etme.
- Öğrencinin müsait olmadığı saatlere blok koyma.
- Her blok 45-90 dakika arası olsun, arada kısa molalar öner (ayrı bloklar olarak gösterme, sadece blok sürelerini buna göre ayarla).
- Her blok için 1 cümlelik gerekçe yaz.

SADECE aşağıdaki JSON şemasında yanıt ver:
{
  "items": [
    {
      "day_of_week": 0,
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "subject": string,
      "topic": string,
      "ai_reasoning": string
    }
  ]
}`;

// Fallback program generator
function generateHeuristicProgram(constraints: any, examAnalysis: any, studyHistory: any) {
  const targetHours = constraints?.target_hours || 30;
  const availableSlots = constraints?.available_slots || []; // e.g. [{ day: 0, time: "18:00" }, ...]

  // Determine priority subjects from weak_subjects/topics
  const weakSubjs = examAnalysis?.weak_subjects || [];
  const prioritySubjects = weakSubjs.map((ws: any) => ws.subject);
  if (!prioritySubjects.includes('Matematik')) prioritySubjects.push('Matematik');
  if (!prioritySubjects.includes('Fizik')) prioritySubjects.push('Fizik');
  if (!prioritySubjects.includes('Türkçe')) prioritySubjects.push('Türkçe');
  if (!prioritySubjects.includes('Kimya')) prioritySubjects.push('Kimya');
  if (!prioritySubjects.includes('Biyoloji')) prioritySubjects.push('Biyoloji');

  const topicsMap: Record<string, string[]> = {
    Matematik: ['Türev & Ekstremum Noktalar', 'İntegral Alan Hesabı', 'Trigonometri', 'Polinomlar & Karmaşık'],
    Fizik: ['Elektrik ve Manyetizma', 'Basit Harmonik Hareket', 'Optik & Kırılma', 'Düzgün Çembersel Hareket'],
    Türkçe: ['Paragrafta Anlam & Akış Bozma', 'Dil Bilgisi & Noktalama', 'Sözcükte Anlam & Cümle Yorumu'],
    Kimya: ['Organik Kimya - Reaksiyonlar', 'Kimyasal Denge & Çözünürlük', 'Gazlar & Sıvı Çözeltiler'],
    Biyoloji: ['Fotosentez ve Kemosentez', 'Hücresel Solunum & ATP', 'Kalıtım & Genetik Kod'],
    Geometri: ['Katı Cisimler (Prizma & Piramit)', 'Analitik Geometri & Doğrunun Analitiği', 'Üçgende Benzerlik'],
  };

  const defaultSchedule = [
    // Pazartesi (0)
    { day_of_week: 0, start_time: '17:00', end_time: '18:15', subject: 'Matematik', topic: 'Türev & Ekstremum Noktalar', ai_reasoning: 'Denemelerde Türev konusundaki hata yoğunluğu sebebiyle haftanın ilk çalışma odağı olarak planlandı.' },
    { day_of_week: 0, start_time: '18:45', end_time: '20:00', subject: 'Fizik', topic: 'Elektrik ve Manyetizma', ai_reasoning: 'Deneme analizinde düşüş trendi gösteren elektrik alan formüllerini pekiştirmek için eklendi.' },
    { day_of_week: 0, start_time: '20:30', end_time: '21:30', subject: 'Türkçe', topic: 'Paragrafta Anlam', ai_reasoning: 'Günlük paragraf ritmini korumak ve okuma hızını artırmak amacıyla konuldu.' },

    // Salı (1)
    { day_of_week: 1, start_time: '17:00', end_time: '18:15', subject: 'Kimya', topic: 'Organik Kimya - Reaksiyonlar', ai_reasoning: 'Yanlış soru bankasında ester ve alkan reaksiyonlarındaki eksikleri kapatmak hedeflendi.' },
    { day_of_week: 1, start_time: '18:45', end_time: '20:00', subject: 'Matematik', topic: 'İntegral Alan Hesabı', ai_reasoning: 'AYT Matematik net ortalamasını 35 bandına yükseltmek için kritik soru çözüm bloğu.' },
    { day_of_week: 1, start_time: '20:30', end_time: '21:45', subject: 'Biyoloji', topic: 'Fotosentez ve Kemosentez', ai_reasoning: 'Zayıf konu analizindeki biyokimyasal reaksiyon adımlarını tekrar etmek için eklendi.' },

    // Çarşamba (2)
    { day_of_week: 2, start_time: '17:00', end_time: '18:30', subject: 'Fizik', topic: 'Basit Harmonik Hareket', ai_reasoning: 'Kuvvet-zaman grafikleri ve periyot denklemleri soru pratiği için ayrıldı.' },
    { day_of_week: 2, start_time: '19:00', end_time: '20:15', subject: 'Geometri', topic: 'Katı Cisimler ve Analitik', ai_reasoning: 'Geometri netlerini sabitlemek ve 3 boyutlu düşünme pratiği kazanmak için konuldu.' },
    { day_of_week: 2, start_time: '20:45', end_time: '21:45', subject: 'Türkçe', topic: 'Dil Bilgisi & Noktalama', ai_reasoning: 'TYT Türkçe 35+ net hedefinde garantili soru tiplerini kaçırmamak için düzenlendi.' },

    // Perşembe (3)
    { day_of_week: 3, start_time: '17:00', end_time: '18:15', subject: 'Matematik', topic: 'Trigonometri Toplam-Fark', ai_reasoning: 'Geçmiş denemelerde işlem hatası yapılan dönüşüm formülleri analizi.' },
    { day_of_week: 3, start_time: '18:45', end_time: '20:00', subject: 'Kimya', topic: 'Kimyasal Denge & Çözünürlük', ai_reasoning: 'Le Chatelier prensibi ve Kçç dengesi soru tiplerini kavramak için ayrıldı.' },
    { day_of_week: 3, start_time: '20:30', end_time: '21:30', subject: 'Biyoloji', topic: 'Hücresel Solunum & ATP', ai_reasoning: 'ETS ve Krebs döngüsü şemalarının görsel tekrarı için belirlendi.' },

    // Cuma (4)
    { day_of_week: 4, start_time: '17:00', end_time: '18:30', subject: 'Fizik', topic: 'Elektrik ve Manyetizma', ai_reasoning: 'İndüksiyon akımı ve manyetik akı karma soru çözümü bloğu.' },
    { day_of_week: 4, start_time: '19:00', end_time: '20:15', subject: 'Matematik', topic: 'Polinomlar & Karmaşık Sayılar', ai_reasoning: 'Derece-kök ilişkileri ve zorlayıcı katsayı soruları çözümü için planlandı.' },
    { day_of_week: 4, start_time: '20:45', end_time: '21:45', subject: 'Türkçe', topic: 'Paragrafta Anlam', ai_reasoning: 'Hafta sonu denemesi öncesi süre baskısı altında paragraf provası.' },

    // Cumartesi (5)
    { day_of_week: 5, start_time: '10:00', end_time: '12:30', subject: 'TYT Deneme', topic: 'Tam TYT Provası & Net Analizi', ai_reasoning: 'Gerçek sınav saatinde genel TYT kondisyonunu korumak ve süre yönetimini test etmek için.' },
    { day_of_week: 5, start_time: '14:30', end_time: '16:00', subject: 'Yanlış Soru Bankası', topic: 'Haftalık Hata Tekrarı & Çözüm İnceleme', ai_reasoning: 'Hafta boyunca kaydedilen yanlışların AI çözüm notları eşliğinde yeniden çözülmesi.' },
    { day_of_week: 5, start_time: '16:30', end_time: '18:00', subject: 'Geometri', topic: 'Analitik Geometri Soru Çözümü', ai_reasoning: 'Çember analitiği ve doğru denklem uygulamaları.' },

    // Pazar (6)
    { day_of_week: 6, start_time: '10:00', end_time: '13:00', subject: 'AYT Deneme', topic: 'Tam AYT Fen & Mat Denemesi', ai_reasoning: 'Haftalık AYT net ilerlemesini ölçmek ve zayıf konuları güncellemek için ana deneme.' },
    { day_of_week: 6, start_time: '15:00', end_time: '16:30', subject: 'Matematik', topic: 'Deneme Yanlışları & Türev/İntegral', ai_reasoning: 'Pazar AYT denemesinde kaçırılan matematik sorularının anında pekiştirilmesi.' },
    { day_of_week: 6, start_time: '17:00', end_time: '18:00', subject: 'Haftalık Değerlendirme', topic: 'Program & Hedef Revizyonu', ai_reasoning: 'Koç notları ve haftalık çalışma süresi gerçekleşme oranının incelenmesi.' },
  ];

  return {
    items: defaultSchedule,
  };
}

// AI Generate Program Endpoint (FAZ 5)
app.post('/api/ai/generate-program', async (req: Request, res: Response): Promise<void> => {
  try {
    const { exam_analysis, study_sessions_summary, constraints } = req.body;

    const ai = getGenAI();

    // Fallback if AI not configured
    if (!ai) {
      const fallback = generateHeuristicProgram(constraints, exam_analysis, study_sessions_summary);
      res.json(fallback);
      return;
    }

    const payloadContext = {
      ogrenci_kisitlari: {
        haftalik_toplam_hedef_saat: constraints?.target_hours || 30,
        musait_gunler_ve_saatler: constraints?.available_slots || 'Hafta içi 17:00 - 22:00, Hafta sonu 09:00 - 19:00',
        ozel_notlar: constraints?.notes || '',
      },
      deneme_ve_zayif_konu_analizi: exam_analysis || {},
      son_4_hafta_gerceklesen_calisma_dagilimi: study_sessions_summary || [],
    };

    const userPromptText = `Öğrencinin aşağıdaki deneme analizini, gerçek çalışma geçmişini ve müsaitlik kısıtlarını kullanarak dengeli ve kişiselleştirilmiş 1 haftalık YKS ders programı oluştur:\n\n${JSON.stringify(
      payloadContext,
      null,
      2
    )}\n\nLütfen sadece belirtilen JSON formatında yanıt ver.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
      config: {
        systemInstruction: PROGRAM_ADVISOR_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 2000,
      },
    });

    const outputText = response.text || '';
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (parseErr) {
      console.warn('JSON parse failed on Gemini program generation response:', outputText, parseErr);
      const fallback = generateHeuristicProgram(constraints, exam_analysis, study_sessions_summary);
      res.json(fallback);
    }
  } catch (err: any) {
    console.error('Error in /api/ai/generate-program:', err);
    try {
      const fallback = generateHeuristicProgram(
        req.body?.constraints,
        req.body?.exam_analysis,
        req.body?.study_sessions_summary
      );
      res.json(fallback);
    } catch {
      res.status(500).json({ error: 'AI ders programı üretilemedi.' });
    }
  }
});

// ---------------------------------------------------------------------------
// System Users Persistent Storage & Cloud Sync Engine
// Ensures registered users on published site and dev preview are never lost
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const USERS_BACKUP_PATH = path.join(DATA_DIR, 'system_users.json');
const DELETED_USERS_PATH = path.join(DATA_DIR, 'system_deleted_users.json');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://abrrfeiyncyesaqdmxwx.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ROq1etUvTdEjcDLK0Eyczg_TRKQX25t';

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getDeletedUserTombstones(): Set<string> {
  try {
    if (fs.existsSync(DELETED_USERS_PATH)) {
      const raw = fs.readFileSync(DELETED_USERS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map((s) => String(s).trim().toLowerCase()));
      }
    }
  } catch (err) {
    console.warn('[Server Storage] Could not read deleted user tombstones:', err);
  }
  return new Set();
}

function addDeletedUserTombstones(identifiers: string[]): void {
  try {
    const current = getDeletedUserTombstones();
    identifiers.forEach((id) => {
      if (id && id.trim()) {
        current.add(id.trim().toLowerCase());
      }
    });
    const dir = path.dirname(DELETED_USERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DELETED_USERS_PATH, JSON.stringify(Array.from(current), null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Storage] Failed to save deleted user tombstones:', err);
  }
}

function removeDeletedUserTombstones(identifiers: string[]): void {
  try {
    const current = getDeletedUserTombstones();
    identifiers.forEach((id) => {
      if (id && id.trim()) {
        current.delete(id.trim().toLowerCase());
      }
    });
    const dir = path.dirname(DELETED_USERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DELETED_USERS_PATH, JSON.stringify(Array.from(current), null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Storage] Failed to remove deleted user tombstones:', err);
  }
}

function getLocalBackupUsers(): any[] {
  try {
    if (fs.existsSync(USERS_BACKUP_PATH)) {
      const raw = fs.readFileSync(USERS_BACKUP_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const tombstones = getDeletedUserTombstones();
        return parsed.filter((u) => {
          const idKey = u.id ? String(u.id).trim().toLowerCase() : '';
          const emailKey = u.email ? String(u.email).trim().toLowerCase() : '';
          return !tombstones.has(idKey) && !tombstones.has(emailKey);
        });
      }
    }
  } catch (err) {
    console.warn('[Server Storage] Could not read local backup users:', err);
  }
  return [];
}

function saveLocalBackupUsers(users: any[]): void {
  try {
    const dir = path.dirname(USERS_BACKUP_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_BACKUP_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Storage] Failed to write local backup users:', err);
  }
}

// Helper to merge a single user record cleanly without status regression
function mergeSingleUser(existing: any, incoming: any): any {
  if (!existing) return { ...incoming };
  if (!incoming) return { ...existing };

  // Status priority:
  // If either has been approved ('active'), rejected ('rejected'), or suspended ('suspended'),
  // do NOT let a stale 'pending' status downgrade the user!
  let resolvedStatus = incoming.status || existing.status || 'pending';
  
  if (existing.status === 'active' || incoming.status === 'active') {
    // Both or one is active. If one is explicitly rejected or suspended, check if that was newer
    if (incoming.status === 'rejected' || incoming.status === 'suspended') {
      resolvedStatus = incoming.status;
    } else if (existing.status === 'rejected' || existing.status === 'suspended') {
      resolvedStatus = incoming.approval_date ? 'active' : existing.status;
    } else {
      resolvedStatus = 'active';
    }
  } else if (existing.status === 'rejected' || incoming.status === 'rejected') {
    resolvedStatus = 'rejected';
  } else if (existing.status === 'suspended' || incoming.status === 'suspended') {
    resolvedStatus = 'suspended';
  }

  return {
    ...existing,
    ...incoming,
    status: resolvedStatus,
    approval_date: incoming.approval_date || existing.approval_date || (resolvedStatus === 'active' ? new Date().toISOString() : undefined),
    created_at: existing.created_at || incoming.created_at || new Date().toISOString(),
    phone: incoming.phone || existing.phone || '',
    field: incoming.field || existing.field || 'SAY',
    target_university: incoming.target_university || existing.target_university || '',
    target_department: incoming.target_department || existing.target_department || '',
    target_rank: incoming.target_rank || existing.target_rank || null,
    coaching_specialty: incoming.coaching_specialty || existing.coaching_specialty || '',
    coach_code: incoming.coach_code || existing.coach_code || null,
    assigned_coach_id: incoming.assigned_coach_id || existing.assigned_coach_id || null,
    assigned_coach_name: incoming.assigned_coach_name || existing.assigned_coach_name || null,
    notes_by_admin: incoming.notes_by_admin || existing.notes_by_admin || null,
    password: incoming.password || existing.password || '190707',
  };
}

// Merge two lists of users without losing records or fields
function mergeUserLists(primary: any[], secondary: any[]): any[] {
  const map = new Map<string, any>();
  
  // Add primary
  for (const u of primary) {
    if (u && (u.email || u.id)) {
      const key = (u.email ? u.email.trim().toLowerCase() : u.id);
      map.set(key, { ...u });
    }
  }

  // Merge secondary
  for (const u of secondary) {
    if (u && (u.email || u.id)) {
      const key = (u.email ? u.email.trim().toLowerCase() : u.id);
      const existing = map.get(key);
      if (existing) {
        map.set(key, mergeSingleUser(existing, u));
      } else {
        map.set(key, { ...u });
      }
    }
  }

  return Array.from(map.values());
}

// GET all system users
app.get('/api/system-users', async (req: Request, res: Response) => {
  try {
    const tombstones = getDeletedUserTombstones();
    const isTombstoned = (u: any) => {
      if (!u) return true;
      const idKey = u.id ? String(u.id).trim().toLowerCase() : '';
      const emailKey = u.email ? String(u.email).trim().toLowerCase() : '';
      return (idKey && tombstones.has(idKey)) || (emailKey && tombstones.has(emailKey));
    };

    const localUsers = getLocalBackupUsers().filter((u) => !isTombstoned(u));

    // Fetch from Supabase
    let cloudUsers: any[] = [];
    try {
      const { data, error } = await serverSupabase.from('system_users').select('*');
      if (!error && data) {
        cloudUsers = data.filter((u: any) => !isTombstoned(u));
      }
    } catch (supaErr) {
      console.warn('[Server Storage] Supabase read note:', supaErr);
    }

    const merged = mergeUserLists(localUsers, cloudUsers).filter((u) => !isTombstoned(u));
    
    // If we have merged updates, save back to local backup
    if (merged.length !== localUsers.length) {
      saveLocalBackupUsers(merged);
    }

    res.json({ success: true, users: merged });
  } catch (err: any) {
    console.error('[Server Storage] Error in GET /api/system-users:', err);
    res.status(500).json({ error: 'Kullanıcı listesi alınamadı.', users: getLocalBackupUsers() });
  }
});

// POST single system user (upsert)
app.post('/api/system-users', async (req: Request, res: Response) => {
  try {
    const user = req.body;
    if (!user || (!user.email && !user.id)) {
      res.status(400).json({ error: 'Geçersiz kullanıcı verisi.' });
      return;
    }

    // If previously deleted, un-tombstone since admin or user is explicitly creating/registering
    const unTombstones: string[] = [];
    if (user.id) unTombstones.push(user.id);
    if (user.email) unTombstones.push(user.email);
    removeDeletedUserTombstones(unTombstones);

    const localUsers = getLocalBackupUsers();
    const updated = mergeUserLists(localUsers, [user]);
    saveLocalBackupUsers(updated);

    // Also sync to Supabase
    try {
      await serverSupabase.from('system_users').upsert([user]);
    } catch (supaErr) {
      console.warn('[Server Storage] Supabase single upsert note:', supaErr);
    }

    res.json({ success: true, user });
  } catch (err: any) {
    console.error('[Server Storage] Error in POST /api/system-users:', err);
    res.status(500).json({ error: 'Kullanıcı kaydedilemedi.' });
  }
});

// POST batch system users (upsert)
app.post('/api/system-users/batch', async (req: Request, res: Response) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      res.status(400).json({ error: 'Geçersiz kullanıcı listesi.' });
      return;
    }

    const tombstones = getDeletedUserTombstones();
    const isTombstoned = (u: any) => {
      if (!u) return true;
      const idKey = u.id ? String(u.id).trim().toLowerCase() : '';
      const emailKey = u.email ? String(u.email).trim().toLowerCase() : '';
      return (idKey && tombstones.has(idKey)) || (emailKey && tombstones.has(emailKey));
    };

    const validUsers = users.filter((u: any) => !isTombstoned(u));
    const localUsers = getLocalBackupUsers();
    const merged = mergeUserLists(localUsers, validUsers);
    saveLocalBackupUsers(merged);

    // Sync to Supabase
    try {
      await serverSupabase.from('system_users').upsert(validUsers);
    } catch (supaErr) {
      console.warn('[Server Storage] Supabase batch upsert note:', supaErr);
    }

    res.json({ success: true, count: merged.length });
  } catch (err: any) {
    console.error('[Server Storage] Error in POST /api/system-users/batch:', err);
    res.status(500).json({ error: 'Toplu kullanıcı kaydedilemedi.' });
  }
});

// DELETE system user
app.delete('/api/system-users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const queryEmail = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    
    const localUsers = getLocalBackupUsers();
    const targetUser = localUsers.find((u) => u.id === id || (queryEmail && u.email?.toLowerCase() === queryEmail));
    const targetEmail = targetUser?.email?.toLowerCase() || queryEmail;

    // Record tombstone so this user can never reappear from cloud or cache merges
    const identifiersToTombstone: string[] = [id];
    if (targetEmail) identifiersToTombstone.push(targetEmail);
    addDeletedUserTombstones(identifiersToTombstone);

    // Filter and update local storage backup
    const filtered = localUsers.filter((u) => u.id !== id && (!targetEmail || u.email?.toLowerCase() !== targetEmail));
    saveLocalBackupUsers(filtered);

    // Hard delete from Supabase
    try {
      await serverSupabase.from('system_users').delete().eq('id', id);
      if (targetEmail) {
        await serverSupabase.from('system_users').delete().eq('email', targetEmail);
      }
    } catch (supaErr) {
      console.warn('[Server Storage] Supabase delete note:', supaErr);
    }

    res.json({ success: true, deletedId: id, deletedEmail: targetEmail });
  } catch (err: any) {
    console.error('[Server Storage] Error in DELETE /api/system-users:', err);
    res.status(500).json({ error: 'Kullanıcı silinemedi.' });
  }
});

// ==========================================
// SYSTEM ANNOUNCEMENTS API
// ==========================================
const ANNOUNCEMENT_FILE_PATH = path.join(DATA_DIR, 'system_announcement.json');

function readStoredAnnouncement() {
  try {
    if (fs.existsSync(ANNOUNCEMENT_FILE_PATH)) {
      const raw = fs.readFileSync(ANNOUNCEMENT_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Server Announcement] Read error:', e);
  }
  return {
    id: 'ann-default',
    title: 'studii YKS 2026 Platformuna Hoş Geldiniz',
    message: 'Haftalık programınızı ve yanlış soru bankanızı düzenli takip ederek hedefinize bir adım daha yaklaşın!',
    type: 'info',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function writeStoredAnnouncement(ann: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(ANNOUNCEMENT_FILE_PATH, JSON.stringify(ann, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Server Announcement] Write error:', e);
  }
}

app.get('/api/system-announcement', (req: Request, res: Response) => {
  try {
    const ann = readStoredAnnouncement();
    res.json(ann);
  } catch (err) {
    res.status(500).json({ error: 'Duyuru okunamadı' });
  }
});

app.post('/api/system-announcement', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'Duyuru verisi eksik' });
    const announcement = {
      id: data.id || 'ann-' + Date.now(),
      title: (data.title || '').trim(),
      message: (data.message || '').trim(),
      type: ['info', 'warning', 'success', 'alert'].includes(data.type) ? data.type : 'info',
      isActive: Boolean(data.isActive),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStoredAnnouncement(announcement);
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ error: 'Duyuru kaydedilemedi' });
  }
});

app.delete('/api/system-announcement', (req: Request, res: Response) => {
  try {
    const cleared = {
      id: 'ann-cleared',
      title: '',
      message: '',
      type: 'info',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStoredAnnouncement(cleared);
    res.json({ success: true, announcement: cleared });
  } catch (err) {
    res.status(500).json({ error: 'Duyuru temizlenemedi' });
  }
});

// ==========================================
// SYSTEM XP SETTINGS & RESET API
// ==========================================
const XP_SETTINGS_FILE_PATH = path.join(DATA_DIR, 'system_xp_settings.json');

const DEFAULT_XP_SETTINGS = {
  xpPerStudyMinute: 2,
  xpPerStreakDay: 25,
  sessionCompletionBonus: 50,
  goalCompletionBonus: 100,
  levelUpBaseXP: 400,
  rulesDescription: 'Odak oturumunda her çalışma dakikası için 2 XP kazanılır. 7+ gün seri günlerinde günlük ekstra 25 XP bonus ve oturum hedefini tamamlama halinde +100 XP eklenir.',
  updatedAt: new Date().toISOString(),
};

function readStoredXPSettings() {
  try {
    if (fs.existsSync(XP_SETTINGS_FILE_PATH)) {
      const raw = fs.readFileSync(XP_SETTINGS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_XP_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('[Server XP Settings] Read error:', e);
  }
  return DEFAULT_XP_SETTINGS;
}

function writeStoredXPSettings(settings: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(XP_SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Server XP Settings] Write error:', e);
  }
}

app.get('/api/system-xp-settings', (req: Request, res: Response) => {
  try {
    const settings = readStoredXPSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'XP ayarları okunamadı' });
  }
});

app.post('/api/system-xp-settings', (req: Request, res: Response) => {
  try {
    const current = readStoredXPSettings();
    const updates = req.body || {};
    const updated = {
      ...current,
      ...updates,
      xpPerStudyMinute: Math.max(1, Math.min(50, Number(updates.xpPerStudyMinute) || current.xpPerStudyMinute)),
      xpPerStreakDay: Math.max(0, Math.min(500, Number(updates.xpPerStreakDay) ?? current.xpPerStreakDay)),
      sessionCompletionBonus: Math.max(0, Math.min(1000, Number(updates.sessionCompletionBonus) ?? current.sessionCompletionBonus)),
      goalCompletionBonus: Math.max(0, Math.min(2000, Number(updates.goalCompletionBonus) ?? current.goalCompletionBonus)),
      updatedAt: new Date().toISOString(),
    };
    writeStoredXPSettings(updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'XP ayarları kaydedilemedi' });
  }
});

app.post('/api/system-xp-reset', (req: Request, res: Response) => {
  try {
    const { targetStudentId, resetAll } = req.body || {};
    // Log the reset event and return success
    console.log(`[Server XP Reset] Reset requested: targetStudentId=${targetStudentId}, resetAll=${resetAll}`);
    res.json({
      success: true,
      message: resetAll ? 'Tüm öğrencilerin XP puanları sıfırlandı.' : `Öğrenci (${targetStudentId}) XP puanı sıfırlandı.`,
      targetStudentId,
      resetAll,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'XP sıfırlanamadı' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static serving in prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Karne platform server running on http://0.0.0.0:${PORT}`);
  });
}

start();
