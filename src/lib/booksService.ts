import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import {
  StudentBook,
  BookTopicProgress,
  BookStatus,
  BookTopicStatus,
  BookDifficulty,
} from '../types';
import { YKS_SUBJECT_TOPICS } from './wrongQuestionsService';

const STORAGE_KEY = 'karne_student_books_cache';

// Comprehensive subject topic definitions
export const COMPREHENSIVE_CURRICULUM: Record<
  string,
  { exam_type: 'TYT' | 'AYT' | 'TYT-AYT'; subject: string; topics: string[] }
> = {
  'TYT Matematik': {
    exam_type: 'TYT',
    subject: 'Matematik',
    topics: [
      'Temel Kavramlar & Sayı Kümeleri',
      'Basamak Kavramı',
      'Bölme ve Bölünebilme',
      'EBOB - EKOK',
      'Rasyonel Sayılar',
      'Basit Eşitsizlikler',
      'Mutlak Değer',
      'Üslü Sayılar',
      'Köklü Sayılar',
      'Çarpanlara Ayırma',
      'Oran - Orantı',
      'Denklem Çözme',
      'Sayı & Kesir Problemleri',
      'Yaş Problemleri',
      'İşçi & Emek Problemleri',
      'Hız & Hareket Problemleri',
      'Yüzde, Kâr-Zarar & Faiz Problemleri',
      'Karışım Problemleri',
      'Grafik & Tablo Problemleri',
      'Mantık',
      'Kümeler & Kartezyen Çarpım',
      'Fonksiyonlar (Temel)',
      'Polinomlar (Giriş)',
      'Permütasyon & Kombinasyon',
      'Binom Açılımı',
      'Olasılık',
      'İstatistik & Veri Analizi',
    ],
  },
  'AYT Matematik': {
    exam_type: 'AYT',
    subject: 'Matematik',
    topics: [
      'Polinomlar & Polinomlarda Bölme',
      'İkinci Dereceden Denklemler',
      'Karmaşık Sayılar',
      'Parabol (İkinci Dereceden Fonksiyonlar)',
      'Eşitsizlikler ve Eşitsizlik Sistemleri',
      'Trigonometri 1 (Birim Çember & Esas Ölçü)',
      'Trigonometri 2 (Toplam-Fark & Yarım Açı)',
      'Trigonometrik Denklemler',
      'Logaritma Fonksiyonu',
      'Diziler (Aritmetik ve Geometrik Dizi)',
      'Limit ve Süreklilik',
      'Türev Alma Kuralları',
      'Türevin Geometrik Yorumu & Teğet Denklemi',
      'Artan-Azalanlık & Ekstremum Noktalar',
      'Maksimum - Minimum Problemleri',
      'Belirsiz İntegral',
      'Belirli İntegral',
      'İntegral ile Alan Hesabı',
      'Permütasyon - Kombinasyon - Binom',
      'Olasılık (Koşullu Olasılık)',
    ],
  },
  'Geometri': {
    exam_type: 'TYT-AYT',
    subject: 'Geometri',
    topics: [
      'Doğruda Açılar',
      'Üçgende Açılar',
      'Dik Üçgen ve Pisagor Bağıntısı',
      'İkizkenar ve Eşkenar Üçgen',
      'Açıortay Bağıntıları',
      'Kenarortay Bağıntıları',
      'Üçgende Eşlik ve Benzerlik',
      'Üçgende Alan',
      'Açı - Kenar Bağıntıları',
      'Çokgenler ve Genel Dörtgenler',
      'Paralelkenar ve Eşkenar Dörtgen',
      'Dikdörtgen ve Kare',
      'Yamuk ve Deltoid',
      'Çemberde Açı',
      'Çemberde Uzunluk',
      'Dairede Alan ve Çevre',
      'Noktanın ve Doğrunun Analitiği',
      'Çemberin Analitiği',
      'Katı Cisimler (Prizma, Piramit, Koni, Küre)',
      'Dönüşümler Geometrisi (Öteleme, Dönme, Simetri)',
    ],
  },
  'TYT Fizik': {
    exam_type: 'TYT',
    subject: 'Fizik',
    topics: [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Sıvıların Kaldırma Kuvveti',
      'Basınç (Katı, Sıvı, Gaz)',
      'Isı, Sıcaklık ve Genleşme',
      'Doğrusal Hareket',
      'Kuvvet ve Newton’un Hareket Yasaları',
      'İş, Güç ve Enerji',
      'Elektrostatik (Durgun Elektrik)',
      'Elektrik Akımı ve Devreler',
      'Manyetizma & Mıknatıslar',
      'Dalgalar (Yay, Su, Ses, Deprem)',
      'Optik (Aydınlanma, Gölge, Düzlem Ayna)',
      'Optik (Küresel Aynalar)',
      'Optik (Kırılma ve Renk)',
      'Optik (Mercekler ve Prizmalar)',
    ],
  },
  'AYT Fizik': {
    exam_type: 'AYT',
    subject: 'Fizik',
    topics: [
      'Vektörler ve Bağıl Hareket',
      'Newton’un Hareket Yasaları (Dinamik)',
      'Bir Boyutta Sabit İvmeli Hareket (Atışlar)',
      'İki Boyutta Hareket (Eğik ve Yatay Atış)',
      'İş, Güç ve Enerji',
      'İtme ve Çizgisel Momentum',
      'Tork, Denge ve Kütle Merkezi',
      'Basit Makineler',
      'Elektriksel Kuvvet ve Elektrik Alan',
      'Elektriksel Potansiyel ve Enerji',
      'Düzgün Elektrik Alan ve Sığaçlar (Kondansatör)',
      'Manyetik Alan ve Manyetik Kuvvet',
      'Manyetik İndüksiyon & Özindüksiyon',
      'Alternatif Akım ve Transformatörler',
      'Düzgün Çembersel Hareket',
      'Dönerek Öteleme & Açısal Momentum',
      'Kütle Çekim ve Kepler Yasaları',
      'Basit Harmonik Hareket',
      'Dalga Mekaniği (Kırınım, Girişim, Doppler)',
      'Elektromanyetik Dalgalar',
      'Atom Fiziğine Giriş & Radyoaktivite',
      'Özel Görelilik (Rölativite)',
      'Kuantum Fiziği (Fotoelektrik & Compton)',
      'Modern Fiziğin Teknolojideki Uygulamaları',
    ],
  },
  'TYT Kimya': {
    exam_type: 'TYT',
    subject: 'Kimya',
    topics: [
      'Kimya Disiplinleri ve Kimyacıların Uğraş Alanları',
      'Atom Modelleri & Atomun Yapısı',
      'Periyodik Sistem ve Özellikleri',
      'Kimyasal Türler Arası Etkileşimler (Güçlü)',
      'Kimyasal Türler Arası Etkileşimler (Zayıf)',
      'Maddenin Halleri (Katı, Sıvı, Gaz)',
      'Doğa ve Kimya',
      'Kimyanın Temel Kanunları & Mol Kavramı',
      'Kimyasal Tepkime Denklemleri & Hesaplamalar',
      'Karışımlar ve Ayırma Yöntemleri',
      'Asitler, Bazlar ve Tuzlar',
      'Kimya Her Yerde (Temizlik, Polimer, Kozmetik)',
    ],
  },
  'AYT Kimya': {
    exam_type: 'AYT',
    subject: 'Kimya',
    topics: [
      'Modern Atom Teorisi & Kuantum Sayıları',
      'Gazlar (Gaz Yasaları, Kinetik Teori, Karışımlar)',
      'Sıvı Çözeltiler ve Derişim Birimleri',
      'Koligatif Özellikler',
      'Kimyasal Tepkimelerde Enerji & Entalpi',
      'Kimyasal Tepkimelerde Hız',
      'Kimyasal Denge & Denge Bağıntısı',
      'Le Chatelier İlkesi & Dengeye Etki Eden Faktörler',
      'Sulu Çözelti Dengeleri (Asit-Baz, pH-pOH, Tampon)',
      'Çözünürlük Dengesi (Kçç)',
      'Kimya ve Elektrik (Redoks & Aktiflik)',
      'Galvanik Piller & Derişim Pilleri',
      'Elektroliz ve Korozyon',
      'Karbon Kimyasına Giriş (Hibritleşme & Molekül Geometrisi)',
      'Organik Bileşikler (Hidrokarbonlar: Alkan, Alken, Alkin)',
      'Aromatik Bileşikler (Benzen ve Türevleri)',
      'Fonksiyonel Gruplar (Alkoller & Eterler)',
      'Karbonil Bileşikleri (Aldehitler & Ketonlar)',
      'Karboksilik Asitler ve Esterler',
      'Enerji Kaynakları ve Bilimsel Gelişmeler',
    ],
  },
  'TYT Biyoloji': {
    exam_type: 'TYT',
    subject: 'Biyoloji',
    topics: [
      'Canlıların Ortak Özellikleri',
      'Canlıların Temel Bileşenleri (İnorganik & Organik)',
      'Enzimler, Vitaminler ve Hormonlar',
      'Hücre Yapısı ve Organeller',
      'Hücre Zarından Madde Geçişleri',
      'Hücre Bölünmeleri (Mitoz Bölünme)',
      'Mayoz Bölünme ve Eşeyli Üreme',
      'Canlıların Çeşitliliği ve Sınıflandırılması',
      'Kalıtımın Genel Esasları (Mendel Genetiği)',
      'Eşeye Bağlı Kalıtım & Soyağaçları',
      'Ekosistem Ekolojisi ve Madde Döngüleri',
      'Güncel Çevre Sorunları & Biyoçeşitlilik',
    ],
  },
  'AYT Biyoloji': {
    exam_type: 'AYT',
    subject: 'Biyoloji',
    topics: [
      'Sinir Sistemi & İmpuls İletimi',
      'Endokrin Sistem (Hormonlar)',
      'Duyu Organları (Göz, Kulak, Deri, Burun, Dil)',
      'Destek ve Hareket Sistemi (Kemik, Kıkırdak, Kas)',
      'Sindirim Sistemi ve Emilim',
      'Dolaşım Sistemi (Kalp, Damarlar, Kan)',
      'Bağışıklık Sistemi (Savunma Mekanizmaları)',
      'Solunum Sistemi ve Gaz Taşınması',
      'Boşaltım (Üriner) Sistemi & Nefronlar',
      'Üreme Sistemi ve Embriyonik Gelişim',
      'Komünite ve Popülasyon Ekolojisi',
      'Nükleik Asitlerin Keşfi ve DNA Replikasyonu',
      'Genetik Şifre ve Protein Sentezi',
      'Hücresel Solunum (Glikoliz, Krebs, ETS)',
      'Fotosentez Reaksiyonları (Işığa Bağımlı & Bağımsız)',
      'Kemosentez',
      'Bitki Biyolojisi (Bitkisel Dokular ve Organlar)',
      'Bitkilerde Madde Taşınması & Beslenme',
      'Bitkilerde Büyüme, Hareket ve Üreme',
      'Canlılar ve Çevre (Mutasyon, Rekombinasyon, Biyoteknoloji)',
    ],
  },
  'Türkçe': {
    exam_type: 'TYT',
    subject: 'Türkçe',
    topics: [
      'Sözcükte Anlam & Söz Öbekleri',
      'Cümlede Anlam & Cümle Yorumu',
      'Paragrafta Ana Düşünce ve Konu',
      'Paragrafta Yardımcı Düşünceler',
      'Paragrafta Yapı ve Akış',
      'Anlatım Teknikleri ve Düşünceyi Geliştirme',
      'Ses Bilgisi',
      'Yazım Kuralları',
      'Noktalama İşaretleri',
      'Sözcükte Yapı ve Ekler',
      'İsimler (Adlar) ve Tamlamalar',
      'Sıfatlar (Önadlar)',
      'Zamirler (Adıllar)',
      'Zarflar (Belirteçler)',
      'Edat, Bağlaç ve Ünlem',
      'Fiiller (Eylemler) ve Ek Fiil',
      'Fiilimsiler (Eylemsiler)',
      'Fiilde Çatı',
      'Cümlenin Ögeleri',
      'Cümle Türleri',
      'Anlatım Bozuklukları',
    ],
  },
  'Edebiyat': {
    exam_type: 'AYT',
    subject: 'Edebiyat',
    topics: [
      'Güzel Sanatlar ve Edebiyat',
      'Metinlerin Sınıflandırılması',
      'Şiir Bilgisi (Nazım Birimi, Ölçü, Kafiye, Redif)',
      'Edebi Sanatlar (Söz Sanatları)',
      'İslamiyet Öncesi Türk Edebiyatı',
      'Geçiş Dönemi Eserleri',
      'Halk Edebiyatı (Anonim, Âşık, Dini-Tasavvufi)',
      'Divan Edebiyatı (Nazım Şekilleri, Türler ve Şairler)',
      'Tanzimat Edebiyatı (1. ve 2. Dönem)',
      'Servet-i Fünun Edebiyatı',
      'Fecr-i Âti Topluluğu',
      'Millî Edebiyat Dönemi',
      'Cumhuriyet Dönemi Türk Şiiri',
      'Cumhuriyet Dönemi Hikâye ve Roman',
      'Cumhuriyet Dönemi Tiyatro ve Öğretici Metinler',
      'Edebî Akımlar',
    ],
  },
  'Tarih': {
    exam_type: 'TYT-AYT',
    subject: 'Tarih',
    topics: [
      'Tarih ve Zaman',
      'İnsanlığın İlk Dönemleri',
      'İlk ve Orta Çağlarda Türk Dünyası',
      'İslam Medeniyetinin Doğuşu ve İlk İslam Devletleri',
      'Türklerin İslamiyet’i Kabulü ve İlk Türk-İslam Devletleri',
      'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi',
      'Beylikten Devlete Osmanlı Siyaseti (1302-1453)',
      'Devletleşme Sürecinde Savaşçılar ve Askerler',
      'Dünya Gücü Osmanlı (1453-1595)',
      'Sultan ve Osmanlı Merkez Teşkilatı',
      'Değişen Dünya Dengeleri Karşısında Osmanlı (1595-1774)',
      'Değişim Çağında Avrupa ve Osmanlı',
      'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)',
      'Devrimler Çağında Değişen Devlet-Toplum İlişkileri',
      'Sermaye ve Emek (Sanayi İnkılabı)',
      'XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya',
      'Millî Mücadele (Hazırlık Dönemi)',
      'Millî Mücadele (Cepheler ve Antlaşmalar)',
      'Atatürkçülük ve Türk İnkılabı',
      'İki Savaş Arasındaki Dönemde Türkiye ve Dünya',
      'II. Dünya Savaşı ve Sonrası Türkiye',
    ],
  },
  'Coğrafya': {
    exam_type: 'TYT-AYT',
    subject: 'Coğrafya',
    topics: [
      'Doğa ve İnsan',
      'Dünya’nın Şekli ve Hareketleri',
      'Coğrafi Konum (Paralel, Meridyen, Yerel Saat)',
      'Harita Bilgisi ve Ölçekler',
      'İklim Bilgisi (Atmosfer, Sıcaklık, Basınç, Rüzgarlar, Nem, Yağış)',
      'Dünya’da ve Türkiye’de İklim Tipleri',
      'Yerin Şekillenmesi ve İç Kuvvetler (Deprem, Volkanizma, Orojenez)',
      'Dış Kuvvetler (Akarsular, Rüzgarlar, Buzullar, Dalgalar, Karstik)',
      'Türkiye’nin Yer Şekilleri',
      'Su, Toprak ve Bitki Varlığı',
      'Nüfus, Yerleşme ve Göçler',
      'Ekonomik Faaliyetler',
      'Bölgeler ve Ülkeler',
      'Doğal Afetler ve Çevre',
      'Türkiye’nin Ekonomik Coğrafyası (Tarım, Hayvancılık, Sanayi, Turizm)',
      'Küresel Ortam: Bölgeler ve Ülkeler (AYT)',
      'Çevre ve Toplum (AYT)',
    ],
  },
  'Felsefe & Din': {
    exam_type: 'TYT',
    subject: 'Felsefe & Din',
    topics: [
      'Felsefeyi Tanıma & Felsefi Düşünce',
      'Varlık Felsefesi (Ontoloji)',
      'Bilgi Felsefesi (Epistemoloji)',
      'Ahlak Felsefesi (Etik)',
      'Sanat Felsefesi (Estetik)',
      'Din Felsefesi',
      'Siyaset Felsefesi',
      'Bilim Felsefesi',
      'İnanç ve İbadet Esasları',
      'İslam ve İbadet',
      'Ahlak ve Değerler',
      'Hz. Muhammed (s.a.v.) ve Gençlik',
      'İslam Düşüncesinde Yorumlar & Mezhepler',
    ],
  },
};

export const PUBLISHER_PRESETS = [
  '3D Yayınları',
  'Bilgi Sarmal',
  'Orijinal Yayınları',
  'Apotemi',
  'Limit Yayınları',
  'Aydın Yayınları',
  'Karekök Yayınları',
  'Çap Yayınları',
  'Palme Yayınları',
  'Hız ve Renk',
  'Endemik Yayınları',
  'Paraf Yayınları',
  'Karakutu / İnformal',
  'Metin Yayınları',
  'Birey Yayınları',
  'Mikro Orijinal',
  'Tonguç Akademi',
  'Yargı / Benim Hocam',
  'Diğer Yayınevi',
];

export const SUBJECT_OPTIONS = [
  'Matematik',
  'Geometri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe & Din',
  'Genel Deneme',
];

// Helper: Find matching curriculum key
export function getCurriculumKey(examType: string, subject: string): string {
  // Direct match try
  const directKey = `${examType} ${subject}`;
  if (COMPREHENSIVE_CURRICULUM[directKey]) return directKey;

  // Single name match (e.g. Geometri, Türkçe, Edebiyat, Tarih, Coğrafya)
  if (COMPREHENSIVE_CURRICULUM[subject]) return subject;

  // Search by subject name match
  for (const [key, val] of Object.entries(COMPREHENSIVE_CURRICULUM)) {
    if (val.subject.toLowerCase() === subject.toLowerCase()) {
      if (examType === 'TYT' && key.startsWith('TYT')) return key;
      if (examType === 'AYT' && key.startsWith('AYT')) return key;
      return key;
    }
  }

  // Fallback to closest
  if (subject.includes('Matematik')) return examType === 'AYT' ? 'AYT Matematik' : 'TYT Matematik';
  if (subject.includes('Fizik')) return examType === 'AYT' ? 'AYT Fizik' : 'TYT Fizik';
  if (subject.includes('Kimya')) return examType === 'AYT' ? 'AYT Kimya' : 'TYT Kimya';
  if (subject.includes('Biyoloji')) return examType === 'AYT' ? 'AYT Biyoloji' : 'TYT Biyoloji';

  return 'TYT Matematik';
}

// Generate topic items for a new book
export function generateBookTopics(examType: 'TYT' | 'AYT' | 'TYT-AYT', subject: string): BookTopicProgress[] {
  const currKey = getCurriculumKey(examType, subject);
  const curItem = COMPREHENSIVE_CURRICULUM[currKey];
  const topicList = curItem ? curItem.topics : COMPREHENSIVE_CURRICULUM['TYT Matematik'].topics;

  return topicList.map((tName, idx) => ({
    id: `top-${idx + 1}-${Date.now().toString(36)}`,
    topic_name: tName,
    status: 'not_started' as BookTopicStatus,
    completed_tests_count: 0,
    total_tests_count: 4, // default avg 4 tests per chapter in soru bankası
  }));
}

// Helper: Calculate progress stats for a book
export function enrichBookStats(book: StudentBook): StudentBook {
  const topics = book.topics || [];
  const total = topics.length;
  const completed = topics.filter((t) => t.status === 'completed').length;
  const inProgress = topics.filter((t) => t.status === 'in_progress').length;

  const pct = total === 0 ? 0 : Math.round(((completed + inProgress * 0.4) / total) * 100);

  let status: BookStatus = book.status;
  if (completed === total && total > 0) {
    status = 'completed';
  } else if (completed > 0 || inProgress > 0) {
    status = 'in_progress';
  }

  return {
    ...book,
    status,
    completion_percentage: Math.min(100, Math.max(0, pct)),
    completed_topics_count: completed,
    total_topics_count: total,
  };
}

// Seed realistic books for demo student and coach students
function generateSeedBooks(): StudentBook[] {
  const now = new Date();
  const dIso = now.toISOString();

  // Book 1: 3D TYT Matematik Soru Bankası (Student st-demo-001)
  const mathTytTopics = generateBookTopics('TYT', 'Matematik').map((t, i) => {
    if (i < 12) {
      return { ...t, status: 'completed' as BookTopicStatus, completed_tests_count: 4, total_tests_count: 4, completed_at: new Date(Date.now() - (15 - i) * 86400000).toISOString() };
    }
    if (i >= 12 && i <= 15) {
      return { ...t, status: 'in_progress' as BookTopicStatus, completed_tests_count: 2, total_tests_count: 4 };
    }
    return t;
  });

  const book1: StudentBook = {
    id: 'book-demo-1',
    student_id: 'st-demo-001',
    title: '3D TYT Matematik Soru Bankası',
    publisher: '3D Yayınları',
    exam_type: 'TYT',
    subject: 'Matematik',
    difficulty: 'orta',
    total_questions: 1650,
    status: 'in_progress',
    target_completion_date: '2026-11-30',
    student_notes: 'Problemler kısmında kırmızı testleri özellikle tekrar edeceğim.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: dIso,
    topics: mathTytTopics,
  };

  // Book 2: Bilgi Sarmal AYT Fizik Soru Bankası (Student st-demo-001)
  const fizAytTopics = generateBookTopics('AYT', 'Fizik').map((t, i) => {
    if (i < 8) {
      return { ...t, status: 'completed' as BookTopicStatus, completed_tests_count: 5, total_tests_count: 5, completed_at: new Date(Date.now() - (10 - i) * 86400000).toISOString() };
    }
    if (i === 8 || i === 9) {
      return { ...t, status: 'in_progress' as BookTopicStatus, completed_tests_count: 2, total_tests_count: 4 };
    }
    return t;
  });

  const book2: StudentBook = {
    id: 'book-demo-2',
    student_id: 'st-demo-001',
    title: 'Bilgi Sarmal AYT Fizik Soru Bankası',
    publisher: 'Bilgi Sarmal',
    exam_type: 'AYT',
    subject: 'Fizik',
    difficulty: 'orta',
    total_questions: 1200,
    status: 'in_progress',
    target_completion_date: '2026-12-15',
    student_notes: 'Manyetizma ve İndüksiyon testleri çözülüyor.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: dIso,
    topics: fizAytTopics,
  };

  // Book 3: Orijinal Geometri Soru Bankası (Student st-demo-001)
  const geoTopics = generateBookTopics('TYT-AYT', 'Geometri').map((t, i) => {
    if (i < 6) {
      return { ...t, status: 'completed' as BookTopicStatus, completed_tests_count: 4, total_tests_count: 4, completed_at: new Date(Date.now() - (8 - i) * 86400000).toISOString() };
    }
    return t;
  });

  const book3: StudentBook = {
    id: 'book-demo-3',
    student_id: 'st-demo-001',
    title: 'Orijinal TYT-AYT Geometri Soru Bankası',
    publisher: 'Orijinal Yayınları',
    exam_type: 'TYT-AYT',
    subject: 'Geometri',
    difficulty: 'zor',
    total_questions: 1400,
    status: 'in_progress',
    target_completion_date: '2027-01-20',
    student_notes: 'Sarı testler bitti, pembe ösym tarzı testlerdeyim.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: dIso,
    topics: geoTopics,
  };

  // Book 4: Aydın AYT Kimya Soru Bankası (Student st-demo-001)
  const kimAytTopics = generateBookTopics('AYT', 'Kimya').map((t, i) => {
    if (i < 5) {
      return { ...t, status: 'completed' as BookTopicStatus, completed_tests_count: 4, total_tests_count: 4 };
    }
    return t;
  });

  const book4: StudentBook = {
    id: 'book-demo-4',
    student_id: 'st-demo-001',
    title: 'Aydın AYT Kimya Soru Bankası',
    publisher: 'Aydın Yayınları',
    exam_type: 'AYT',
    subject: 'Kimya',
    difficulty: 'zor',
    total_questions: 1150,
    status: 'in_progress',
    target_completion_date: '2026-12-30',
    student_notes: 'Sıvı çözeltiler ve denge konularına odaklanılacak.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: dIso,
    topics: kimAytTopics,
  };

  // Book 5: Limit Türkçe Paragraf Soru Bankası (Tamamlanmış Kitap)
  const turkceTopics = generateBookTopics('TYT', 'Türkçe').map((t) => ({
    ...t,
    status: 'completed' as BookTopicStatus,
    completed_tests_count: 5,
    total_tests_count: 5,
  }));

  const book5: StudentBook = {
    id: 'book-demo-5',
    student_id: 'st-demo-001',
    title: 'Limit Kronometre Paragraf Soru Bankası',
    publisher: 'Limit Yayınları',
    exam_type: 'TYT',
    subject: 'Türkçe',
    difficulty: 'orta',
    total_questions: 1350,
    status: 'completed',
    target_completion_date: '2026-09-01',
    student_notes: 'Tüm paragraflar süre tutarak çözüldü, net ortalaması 34.5.',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    topics: turkceTopics,
  };

  // Other Coach Students' Books (st-001: Ayşe Yılmaz, st-002: Mehmet Demir, st-003: Elif Kaya)
  const ayseMath = {
    id: 'book-ayse-1',
    student_id: 'st-001',
    title: 'Bilgi Sarmal TYT Matematik',
    publisher: 'Bilgi Sarmal',
    exam_type: 'TYT' as const,
    subject: 'Matematik',
    difficulty: 'orta' as BookDifficulty,
    total_questions: 1500,
    status: 'in_progress' as BookStatus,
    created_at: dIso,
    updated_at: dIso,
    topics: generateBookTopics('TYT', 'Matematik').map((t, i) => i < 18 ? { ...t, status: 'completed' as BookTopicStatus } : t),
  };

  const ayseBio = {
    id: 'book-ayse-2',
    student_id: 'st-001',
    title: 'Palme AYT Biyoloji Soru Bankası',
    publisher: 'Palme Yayınları',
    exam_type: 'AYT' as const,
    subject: 'Biyoloji',
    difficulty: 'orta' as BookDifficulty,
    total_questions: 1100,
    status: 'in_progress' as BookStatus,
    created_at: dIso,
    updated_at: dIso,
    topics: generateBookTopics('AYT', 'Biyoloji').map((t, i) => i < 10 ? { ...t, status: 'completed' as BookTopicStatus } : t),
  };

  const mehmetAyt = {
    id: 'book-mehmet-1',
    student_id: 'st-002',
    title: 'Orijinal AYT Matematik Soru Bankası',
    publisher: 'Orijinal Yayınları',
    exam_type: 'AYT' as const,
    subject: 'Matematik',
    difficulty: 'derece' as BookDifficulty,
    total_questions: 1700,
    status: 'in_progress' as BookStatus,
    created_at: dIso,
    updated_at: dIso,
    topics: generateBookTopics('AYT', 'Matematik').map((t, i) => i < 8 ? { ...t, status: 'completed' as BookTopicStatus } : t),
  };

  const elifTurkce = {
    id: 'book-elif-1',
    student_id: 'st-003',
    title: 'Hız ve Renk TYT Türkçe Soru Bankası',
    publisher: 'Hız ve Renk',
    exam_type: 'TYT' as const,
    subject: 'Türkçe',
    difficulty: 'kolay' as BookDifficulty,
    total_questions: 1250,
    status: 'completed' as BookStatus,
    created_at: dIso,
    updated_at: dIso,
    topics: generateBookTopics('TYT', 'Türkçe').map((t) => ({ ...t, status: 'completed' as BookTopicStatus })),
  };

  return [book1, book2, book3, book4, book5, ayseMath, ayseBio, mehmetAyt, elifTurkce].map(enrichBookStats);
}

export const booksService = {
  // Get all books for a student
  async getBooks(studentId: string): Promise<StudentBook[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('student_books')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return (data as StudentBook[]).map(enrichBookStats);
        }
      } catch (err) {
        console.warn('Supabase getBooks fallback to local:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    let all: StudentBook[] = [];
    if (saved) {
      try {
        all = JSON.parse(saved) as StudentBook[];
      } catch {
        all = [];
      }
    }

    const studentList = all.filter((b) => !b.student_id || b.student_id === studentId);
    return studentList.map(enrichBookStats);
  },

  // Get specific book by ID
  async getBookById(bookId: string): Promise<StudentBook | null> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const all = JSON.parse(saved) as StudentBook[];
        const found = all.find((b) => b.id === bookId);
        if (found) return enrichBookStats(found);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  },

  // Add new book with auto-generated topic checklist
  async addBook(
    data: Omit<StudentBook, 'id' | 'created_at' | 'updated_at' | 'topics'> & { customTopics?: string[] }
  ): Promise<StudentBook> {
    const newId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    let topicsList: BookTopicProgress[] = [];
    if (data.customTopics && data.customTopics.length > 0) {
      topicsList = data.customTopics.map((tName, idx) => ({
        id: `top-${idx + 1}-${Date.now().toString(36)}`,
        topic_name: tName,
        status: 'not_started',
        completed_tests_count: 0,
        total_tests_count: 4,
      }));
    } else {
      topicsList = generateBookTopics(data.exam_type, data.subject);
    }

    const newBookRaw: StudentBook = {
      ...data,
      id: newId,
      created_at: nowIso,
      updated_at: nowIso,
      topics: topicsList,
      status: data.status || 'in_progress',
    };

    const newBook = enrichBookStats(newBookRaw);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_books').insert([newBook]);
      } catch (err) {
        console.warn('Supabase insert book error:', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    let all: StudentBook[] = [];
    if (saved) {
      try {
        all = JSON.parse(saved) as StudentBook[];
      } catch {
        all = [];
      }
    } else {
      all = generateSeedBooks();
    }

    all.unshift(newBook);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newBook;
  },

  // Update book metadata
  async updateBook(bookId: string, updates: Partial<StudentBook>): Promise<StudentBook | null> {
    const saved = localStorage.getItem(STORAGE_KEY);
    let all: StudentBook[] = [];
    if (saved) {
      try {
        all = JSON.parse(saved) as StudentBook[];
      } catch {
        all = [];
      }
    }

    const idx = all.findIndex((b) => b.id === bookId);
    if (idx === -1) return null;

    const merged = enrichBookStats({
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    });

    all[idx] = merged;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_books').update(merged).eq('id', bookId);
      } catch (err) {
        console.warn('Supabase update book error:', err);
      }
    }

    return merged;
  },

  // Update a single topic status inside a book
  async updateTopicStatus(
    bookId: string,
    topicIdOrName: string,
    newStatus: BookTopicStatus,
    notes?: string,
    completedTests?: number
  ): Promise<StudentBook | null> {
    const saved = localStorage.getItem(STORAGE_KEY);
    let all: StudentBook[] = [];
    if (saved) {
      try {
        all = JSON.parse(saved) as StudentBook[];
      } catch {
        all = [];
      }
    }

    const bIdx = all.findIndex((b) => b.id === bookId);
    if (bIdx === -1) return null;

    const targetBook = all[bIdx];
    const updatedTopics = (targetBook.topics || []).map((top) => {
      if (top.id === topicIdOrName || top.topic_name === topicIdOrName) {
        return {
          ...top,
          status: newStatus,
          note: notes !== undefined ? notes : top.note,
          completed_tests_count: completedTests !== undefined ? completedTests : (newStatus === 'completed' ? (top.total_tests_count || 4) : top.completed_tests_count),
          completed_at: newStatus === 'completed' ? new Date().toISOString() : (newStatus === 'not_started' ? null : top.completed_at),
        };
      }
      return top;
    });

    const updatedBook = enrichBookStats({
      ...targetBook,
      topics: updatedTopics,
      updated_at: new Date().toISOString(),
    });

    all[bIdx] = updatedBook;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    return updatedBook;
  },

  // Batch toggle all topics in a book (e.g. mark all completed / reset)
  async batchUpdateAllTopics(bookId: string, newStatus: BookTopicStatus): Promise<StudentBook | null> {
    const saved = localStorage.getItem(STORAGE_KEY);
    let all: StudentBook[] = [];
    if (saved) {
      try {
        all = JSON.parse(saved) as StudentBook[];
      } catch {
        all = [];
      }
    }

    const bIdx = all.findIndex((b) => b.id === bookId);
    if (bIdx === -1) return null;

    const targetBook = all[bIdx];
    const nowIso = new Date().toISOString();
    const updatedTopics = (targetBook.topics || []).map((top) => ({
      ...top,
      status: newStatus,
      completed_tests_count: newStatus === 'completed' ? (top.total_tests_count || 4) : 0,
      completed_at: newStatus === 'completed' ? nowIso : null,
    }));

    const updatedBook = enrichBookStats({
      ...targetBook,
      topics: updatedTopics,
      updated_at: nowIso,
    });

    all[bIdx] = updatedBook;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    return updatedBook;
  },

  // Delete a book
  async deleteBook(bookId: string): Promise<boolean> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const all = JSON.parse(saved) as StudentBook[];
        const filtered = all.filter((b) => b.id !== bookId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error(e);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('student_books').delete().eq('id', bookId);
      } catch (err) {
        console.warn('Supabase delete book error:', err);
      }
    }

    return true;
  },

  // Summary statistics for a student
  async getStudentBookStats(studentId: string) {
    const books = await this.getBooks(studentId);
    const totalBooks = books.length;
    const inProgressBooks = books.filter((b) => b.status === 'in_progress').length;
    const completedBooks = books.filter((b) => b.status === 'completed').length;

    let totalTopics = 0;
    let completedTopics = 0;

    books.forEach((b) => {
      totalTopics += b.total_topics_count || (b.topics ? b.topics.length : 0);
      completedTopics += b.completed_topics_count || (b.topics ? b.topics.filter((t) => t.status === 'completed').length : 0);
    });

    const overallPercentage = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    return {
      totalBooks,
      inProgressBooks,
      completedBooks,
      totalTopics,
      completedTopics,
      overallPercentage,
      books,
    };
  },
};
