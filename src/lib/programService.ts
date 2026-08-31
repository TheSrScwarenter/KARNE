import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { StudyProgram, ProgramItem, ProgramStatus, ProgramGeneratedBy } from '../types';
import { examsService } from './examsService';
import { studySessionsService } from './studySessionsService';

const PROGRAMS_STORAGE_KEY = 'karne_study_programs_cache_v2';
const CONSTRAINTS_STORAGE_KEY = 'karne_program_constraints_cache_v2';

export interface ProgramConstraints {
  target_hours: number; // e.g. 30
  available_days: number[]; // [0, 1, 2, 3, 4, 5, 6] (Pazartesi=0 ... Pazar=6)
  daily_slots: {
    day: number;
    start: string;
    end: string;
    label?: string;
  }[];
  notes?: string;
}

export const DEFAULT_CONSTRAINTS: ProgramConstraints = {
  target_hours: 30,
  available_days: [0, 1, 2, 3, 4, 5, 6],
  daily_slots: [
    { day: 0, start: '17:00', end: '22:00', label: 'Pazartesi' },
    { day: 1, start: '17:00', end: '22:00', label: 'Salı' },
    { day: 2, start: '17:00', end: '22:00', label: 'Çarşamba' },
    { day: 3, start: '17:00', end: '22:00', label: 'Perşembe' },
    { day: 4, start: '17:00', end: '22:00', label: 'Cuma' },
    { day: 5, start: '09:30', end: '19:00', label: 'Cumartesi' },
    { day: 6, start: '09:30', end: '19:00', label: 'Pazar' },
  ],
  notes: '',
};

function normalizeStudentId(id?: string): string {
  return id || 'st-current-user';
}

export interface PredefinedTemplate {
  id: string;
  title: string;
  field: 'SAY' | 'EA' | 'SÖZ' | 'DİL' | 'GENEL';
  description: string;
  totalHours: number;
  badge: string;
  items: Omit<ProgramItem, 'id' | 'program_id'>[];
}

export const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'tpl-say-derece',
    title: 'Sayısal (SAY) İlk 10.000 Derece Programı',
    field: 'SAY',
    description: 'AYT Matematik (Türev-İntegral), AYT Fizik-Kimya-Biyoloji ve hafta sonu tam TYT/AYT deneme provası.',
    totalHours: 34,
    badge: 'Popüler SAY',
    items: [
      { day_of_week: 0, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'AYT Türev & Ekstremum Noktaları', target_questions: 45, ai_reasoning: 'Haftanın ilk zihinsel enerjisiyle en kritik AYT konusu.' },
      { day_of_week: 0, start_time: '19:00', end_time: '20:15', subject: 'Fizik', topic: 'Elektrik ve Manyetizma (Manyetik Alan)', target_questions: 35, ai_reasoning: 'Denemelerde en sık hata yapılan formül uygulamaları.' },
      { day_of_week: 0, start_time: '20:45', end_time: '21:45', subject: 'Türkçe', topic: 'TYT Paragrafta Ana Düşünce & Hız', target_questions: 30, ai_reasoning: 'Günlük 30 paragraf süre tutularak çözülmeli.' },

      { day_of_week: 1, start_time: '17:00', end_time: '18:15', subject: 'Kimya', topic: 'Organik Kimya - Fonksiyonel Gruplar', target_questions: 40, ai_reasoning: 'Reaksiyon mekanizmaları soru bankasından taranacak.' },
      { day_of_week: 1, start_time: '18:45', end_time: '20:15', subject: 'Matematik', topic: 'İntegral ve Alan Hesabı', target_questions: 40, ai_reasoning: 'Geometrik yorum soruları.' },
      { day_of_week: 1, start_time: '20:45', end_time: '21:45', subject: 'Biyoloji', topic: 'Fotosentez ve Kemosentez Reaksiyonları', target_questions: 35, ai_reasoning: 'ETS evresi şema çizimiyle pekiştirilecek.' },

      { day_of_week: 2, start_time: '17:00', end_time: '18:30', subject: 'Fizik', topic: 'Basit Harmonik Hareket & Dalga Mekaniği', target_questions: 40, ai_reasoning: 'Periyot ve kuvvet formülleri pratiği.' },
      { day_of_week: 2, start_time: '19:00', end_time: '20:15', subject: 'Geometri', topic: 'Analitik Geometri & Çember Analitiği', target_questions: 35, ai_reasoning: 'AYT Geometri 4 neti garantilemek için kritik.' },
      { day_of_week: 2, start_time: '20:45', end_time: '21:45', subject: 'Yanlış Soru Bankası', topic: 'Hafta İçi Yanlış Soru Tekrarı', target_questions: 25, ai_reasoning: 'Kesilen ve kaydedilen soruların tekrarı.' },

      { day_of_week: 3, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'Trigonometri Toplam-Fark & Denklemler', target_questions: 50, ai_reasoning: 'Dönüşüm formülleri pratikleri.' },
      { day_of_week: 3, start_time: '19:00', end_time: '20:15', subject: 'Kimya', topic: 'Kimyasal Denge & Sulu Çözeltiler (pH)', target_questions: 35, ai_reasoning: 'Asit-Baz tampon çözelti soru tipleri.' },
      { day_of_week: 3, start_time: '20:45', end_time: '21:45', subject: 'Biyoloji', topic: 'Hücresel Solunum (Glikoliz & Krebs)', target_questions: 30, ai_reasoning: 'Biyokimyasal döngülerin tekrarı.' },

      { day_of_week: 4, start_time: '17:00', end_time: '18:30', subject: 'Fizik', topic: 'İndüksiyon & Alternatif Akım', target_questions: 40, ai_reasoning: 'Transformatör ve Lenz kanunu.' },
      { day_of_week: 4, start_time: '19:00', end_time: '20:15', subject: 'Matematik', topic: 'Polinomlar & İkinci Dereceden Denklemler', target_questions: 45, ai_reasoning: 'Zorlayıcı kök katsayı soruları.' },
      { day_of_week: 4, start_time: '20:45', end_time: '21:30', subject: 'Türkçe', topic: 'Dil Bilgisi (Cümlenin Ögeleri & Yazım)', target_questions: 30, ai_reasoning: 'Garantili TYT netleri.' },

      { day_of_week: 5, start_time: '10:00', end_time: '12:45', subject: 'TYT Deneme', topic: 'Genel TYT Türkiye Geneli Provası (165 dk)', target_questions: 120, ai_reasoning: 'Gerçek sınav saatinde süre tutarak.' },
      { day_of_week: 5, start_time: '14:30', end_time: '16:30', subject: 'Yanlış Soru Bankası', topic: 'TYT Deneme Analizi & Video Çözümleri', target_questions: 40, ai_reasoning: 'Yanlış ve boşların tamamı incelenmeli.' },
      { day_of_week: 5, start_time: '17:00', end_time: '18:30', subject: 'Geometri', topic: 'Katı Cisimler (Prizma, Piramit, Koni)', target_questions: 35, ai_reasoning: 'Hacim ve yüzey alanı formülleri.' },

      { day_of_week: 6, start_time: '10:00', end_time: '13:00', subject: 'AYT Deneme', topic: 'Tam AYT Matematik & Fen Provası (180 dk)', target_questions: 80, ai_reasoning: 'Haftalık net takibi ve konu eksik tespiti.' },
      { day_of_week: 6, start_time: '15:00', end_time: '17:00', subject: 'Matematik', topic: 'AYT Deneme Matematik Hata Analizi', target_questions: 30, ai_reasoning: 'Kaçan soruların koç/çözüm videosuyla tekrarı.' },
      { day_of_week: 6, start_time: '17:30', end_time: '18:30', subject: 'Haftalık Değerlendirme', topic: 'Koçluk Raporu & Gelecek Hafta Hedefleri', target_questions: 0, ai_reasoning: 'Koç notlarının ve soru hedeflerinin kontrolü.' },
    ],
  },
  {
    id: 'tpl-ea-derece',
    title: 'Eşit Ağırlık (EA) Hukuk & İİBF Kampı',
    field: 'EA',
    description: 'AYT Matematik (30+ Net), Cumhuriyet Edebiyatı, Tarih-Coğrafya ve TYT Türkçe Paragraf & Problem.',
    totalHours: 31,
    badge: 'EA Özel',
    items: [
      { day_of_week: 0, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'AYT Türev - Teğet & Fonksiyon Grafikleri', target_questions: 45, ai_reasoning: 'EA derece için en belirleyici ders.' },
      { day_of_week: 0, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'AYT Edebiyat - Tanzimat & Servet-i Fünun', target_questions: 40, ai_reasoning: 'Eser-yazar eşleştirmeleri ve şiir tahlili.' },
      { day_of_week: 0, start_time: '20:45', end_time: '21:45', subject: 'Türkçe', topic: 'TYT Paragraf & Hızlı Okuma', target_questions: 30, ai_reasoning: 'Günlük TYT paragraf rutini.' },

      { day_of_week: 1, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'AYT İntegral & Belirli İntegral', target_questions: 40, ai_reasoning: 'İntegral alma kuralları.' },
      { day_of_week: 1, start_time: '19:00', end_time: '20:15', subject: 'Sosyal Bilgiler', topic: 'AYT Tarih - Milli Mücadele Dönemi', target_questions: 40, ai_reasoning: 'Kronoloji ve antlaşmalar.' },
      { day_of_week: 1, start_time: '20:45', end_time: '21:45', subject: 'Sosyal Bilgiler', topic: 'AYT Coğrafya - Türkiye İklimi & Nüfus', target_questions: 35, ai_reasoning: 'Harita okuma ve nüfus piramitleri.' },

      { day_of_week: 2, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'Trigonometri & Analitik Geometri', target_questions: 40, ai_reasoning: 'Trigonometrik özdeşlikler.' },
      { day_of_week: 2, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'Cumhuriyet Dönemi Şiir ve Roman', target_questions: 40, ai_reasoning: 'Toplumcu gerçekçiler ve garip akımı.' },
      { day_of_week: 2, start_time: '20:45', end_time: '21:45', subject: 'Yanlış Soru Bankası', topic: 'Haftalık Hata Tekrarı', target_questions: 25, ai_reasoning: 'Matematik ve edebiyat yanlışları.' },

      { day_of_week: 3, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'Fonksiyonlar, Polinom & Parabol', target_questions: 45, ai_reasoning: 'ÖSYM klasik soru tipleri.' },
      { day_of_week: 3, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'Divan Edebiyatı Nazım Şekilleri & Aruz', target_questions: 35, ai_reasoning: 'Gazel, kaside, mesnevi özellikleri.' },
      { day_of_week: 3, start_time: '20:45', end_time: '21:45', subject: 'Sosyal Bilgiler', topic: 'AYT Tarih - Osmanlı Kültür ve Medeniyeti', target_questions: 35, ai_reasoning: 'Divan üyeleri ve teşkilat.' },

      { day_of_week: 4, start_time: '17:00', end_time: '18:30', subject: 'Geometri', topic: 'Üçgende Alan & Çokgenler', target_questions: 40, ai_reasoning: 'Benzerlik ve alan formülleri.' },
      { day_of_week: 4, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'TYT Dil Bilgisi Karma Test', target_questions: 35, ai_reasoning: 'Ses bilgisi, yazım, noktalama.' },
      { day_of_week: 4, start_time: '20:45', end_time: '21:30', subject: 'Matematik', topic: 'TYT Problemler (Hız, Yaş, Yüzde)', target_questions: 30, ai_reasoning: 'Günde 20-30 problem.' },

      { day_of_week: 5, start_time: '10:00', end_time: '12:45', subject: 'TYT Deneme', topic: 'Tam TYT Denemesi (165 dk)', target_questions: 120, ai_reasoning: 'Zaman yönetimi.' },
      { day_of_week: 5, start_time: '14:30', end_time: '16:30', subject: 'Yanlış Soru Bankası', topic: 'TYT Deneme Analizi', target_questions: 30, ai_reasoning: 'Eksiklerin listelenmesi.' },

      { day_of_week: 6, start_time: '10:00', end_time: '13:00', subject: 'AYT Deneme', topic: 'Tam AYT Matematik & Edebiyat/Sosyal Denemesi', target_questions: 80, ai_reasoning: 'Haftalık net ölçümü.' },
      { day_of_week: 6, start_time: '15:00', end_time: '16:30', subject: 'Türkçe', topic: 'Edebiyat Tekrar & Eser Taraması', target_questions: 40, ai_reasoning: 'Denemede unutulan eserler.' },
    ],
  },
  {
    id: 'tpl-tyt-hizlandirma',
    title: 'TYT 90+ Net Hızlandırma & Temel Güçlendirme Kampı',
    field: 'GENEL',
    description: 'TYT Türkçe (35+), Temel Matematik Problemler (25+), TYT Fen ve Sosyal hızlı tekrar modülleri.',
    totalHours: 28,
    badge: 'TYT Odaklı',
    items: [
      { day_of_week: 0, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'TYT Sayılar, Bölünebilme & EBOB-EKOK', target_questions: 50, ai_reasoning: 'Temel kavramları sağlamlaştırma.' },
      { day_of_week: 0, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'TYT Paragraf Çözüm Taktikleri & Hız', target_questions: 40, ai_reasoning: 'Her gün 40 soru.' },
      { day_of_week: 1, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'TYT Sayı Kesir & Yaş Problemleri', target_questions: 45, ai_reasoning: 'En çok soru gelen problem tipleri.' },
      { day_of_week: 1, start_time: '19:00', end_time: '20:15', subject: 'Fizik', topic: 'TYT Fizik - Madde & Özellikleri, Hareket', target_questions: 35, ai_reasoning: 'Kavram yanılgılarını giderme.' },
      { day_of_week: 2, start_time: '17:00', end_time: '18:30', subject: 'Kimya', topic: 'TYT Kimya - Atom ve Periyodik Sistem', target_questions: 40, ai_reasoning: 'Periyodik özellik değişimleri.' },
      { day_of_week: 2, start_time: '19:00', end_time: '20:15', subject: 'Biyoloji', topic: 'TYT Biyoloji - Hücre ve Organeller', target_questions: 35, ai_reasoning: 'Hücre zarı geçişleri.' },
      { day_of_week: 3, start_time: '17:00', end_time: '18:30', subject: 'Matematik', topic: 'TYT Hız, Yüzde, Kar-Zarar Problemleri', target_questions: 45, ai_reasoning: 'Denklem kurma pratiği.' },
      { day_of_week: 3, start_time: '19:00', end_time: '20:15', subject: 'Geometri', topic: 'TYT Üçgende Açılar & Özel Üçgenler (3-4-5 vb)', target_questions: 35, ai_reasoning: 'Geometri temel kuralları.' },
      { day_of_week: 4, start_time: '17:00', end_time: '18:30', subject: 'Sosyal Bilgiler', topic: 'TYT Tarih & Coğrafya Harita Kampı', target_questions: 40, ai_reasoning: 'İklim grafikleri ve ilk çağ medeniyetleri.' },
      { day_of_week: 4, start_time: '19:00', end_time: '20:15', subject: 'Türkçe', topic: 'TYT Dil Bilgisi Denemesi', target_questions: 30, ai_reasoning: 'Soru kaçırmamak için deneme formatında.' },
      { day_of_week: 5, start_time: '10:00', end_time: '12:45', subject: 'TYT Deneme', topic: 'Tam TYT Provası (165 dk)', target_questions: 120, ai_reasoning: 'Net ve hız kontrolü.' },
      { day_of_week: 5, start_time: '14:30', end_time: '16:30', subject: 'Yanlış Soru Bankası', topic: 'TYT Deneme Analizi & Video Çözümler', target_questions: 35, ai_reasoning: 'Bütün hatalar tek tek incelenir.' },
      { day_of_week: 6, start_time: '10:00', end_time: '12:00', subject: 'Matematik', topic: 'TYT Branş Matematik Denemesi (40 Soru)', target_questions: 40, ai_reasoning: 'Süre baskısı altında branş provası.' },
      { day_of_week: 6, start_time: '14:00', end_time: '15:30', subject: 'Fizik', topic: 'TYT Fen Branş Denemesi (20 Soru)', target_questions: 20, ai_reasoning: 'Fizik, Kimya, Biyoloji 20 soru provası.' },
    ],
  },
];

export const programService = {
  // Get saved constraints
  getConstraints(studentId: string): ProgramConstraints {
    const normId = normalizeStudentId(studentId);
    const saved = localStorage.getItem(`${CONSTRAINTS_STORAGE_KEY}_${normId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_CONSTRAINTS;
  },

  // Save constraints
  saveConstraints(studentId: string, constraints: ProgramConstraints): void {
    const normId = normalizeStudentId(studentId);
    localStorage.setItem(`${CONSTRAINTS_STORAGE_KEY}_${normId}`, JSON.stringify(constraints));
  },

  // Get active program for student
  async getActiveProgram(studentId: string): Promise<StudyProgram | null> {
    const all = await this.getAllPrograms(studentId);
    return all.find((p) => p.status === 'active') || null;
  },

  // Get all programs (active + archived)
  async getAllPrograms(studentId?: string): Promise<StudyProgram[]> {
    const normId = normalizeStudentId(studentId);

    if (isSupabaseConfigured() && studentId) {
      try {
        const { data: progData, error: progErr } = await supabase
          .from('study_programs')
          .select('*, program_items(*)')
          .or(`student_id.eq.${normId},student_id.eq.st-demo-001,student_id.eq.st-demir`)
          .order('week_start_date', { ascending: false });

        if (!progErr && progData && progData.length > 0) {
          return progData.map((p: any) => ({
            ...p,
            items: p.program_items || [],
          }));
        }
      } catch (err) {
        console.warn('Supabase get programs failed, using localStorage:', err);
      }
    }

    const saved = localStorage.getItem(PROGRAMS_STORAGE_KEY);
    if (saved) {
      try {
        const list = JSON.parse(saved) as StudyProgram[];
        if (!studentId) return list;
        return list.filter(
          (p) => !p.student_id || p.student_id === normId
        );
      } catch {
        return [];
      }
    }

    return [];
  },

  // Save or replace complete program
  async saveFullProgram(program: StudyProgram): Promise<StudyProgram> {
    const all = await this.getAllPrograms();
    const existingIndex = all.findIndex((p) => p.id === program.id);

    if (existingIndex >= 0) {
      all[existingIndex] = { ...program };
    } else {
      // If marking as active, archive previous actives for this student
      if (program.status === 'active') {
        all.forEach((p) => {
          if (p.student_id === program.student_id && p.status === 'active') {
            p.status = 'archived';
          }
        });
      }
      all.unshift(program);
    }

    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('study_programs')
          .upsert({
            id: program.id,
            student_id: program.student_id,
            week_start_date: program.week_start_date,
            status: program.status,
            generated_by: program.generated_by,
            title: program.title,
            notes: program.notes,
          });
      } catch (err) {
        console.warn('Supabase save full program failed:', err);
      }
    }

    return program;
  },

  // Delete / Reset active program for student
  async deleteProgram(studentId: string, programId?: string): Promise<void> {
    const normId = normalizeStudentId(studentId);
    let all = await this.getAllPrograms();

    if (programId) {
      all = all.filter((p) => p.id !== programId);
    } else {
      // Delete active program for this student
      all = all.filter(
        (p) =>
          !(
            (p.student_id === normId || (normId === 'st-demir' && p.student_id === 'st-demo-001')) &&
            p.status === 'active'
          )
      );
    }

    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));

    if (isSupabaseConfigured() && programId) {
      try {
        await supabase.from('program_items').delete().eq('program_id', programId);
        await supabase.from('study_programs').delete().eq('id', programId);
      } catch (err) {
        console.warn('Supabase delete program failed:', err);
      }
    }
  },

  // Clear all items in active program without deleting the shell, or create clean blank program
  async clearActiveProgram(studentId: string): Promise<StudyProgram | null> {
    const normId = normalizeStudentId(studentId);
    const active = await this.getActiveProgram(normId);
    if (!active) return null;

    active.items = [];
    active.title = 'Boş Haftalık Program';
    await this.saveFullProgram(active);
    return active;
  },

  // Apply a ready-made template to student
  async applyTemplateToStudent(
    studentId: string,
    templateId: string,
    generatedBy: ProgramGeneratedBy = 'coach',
    coachNote?: string
  ): Promise<StudyProgram> {
    const normId = normalizeStudentId(studentId);
    const tpl = PREDEFINED_TEMPLATES.find((t) => t.id === templateId) || PREDEFINED_TEMPLATES[0];

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const weekStartDate = monday.toISOString().split('T')[0];

    const newProgramId = 'prog-' + Date.now();

    const items: ProgramItem[] = tpl.items.map((it, idx) => ({
      ...it,
      id: `pi-${newProgramId}-${idx + 1}`,
      program_id: newProgramId,
      generated_by: generatedBy,
      completed: false,
    }));

    const newProgram: StudyProgram = {
      id: newProgramId,
      student_id: normId,
      title: tpl.title,
      week_start_date: weekStartDate,
      status: 'active',
      generated_by: generatedBy,
      notes: coachNote || `Koç Programı: ${tpl.title} şablonu uygulandı.`,
      created_at: new Date().toISOString(),
      items,
    };

    return await this.saveFullProgram(newProgram);
  },

  // Toggle item completion (for student ticking off during study days)
  async toggleItemCompletion(
    programId: string,
    itemId: string,
    completedState?: boolean
  ): Promise<boolean> {
    const all = await this.getAllPrograms();
    let newStatus = false;

    all.forEach((prog) => {
      if (prog.id === programId && prog.items) {
        prog.items = prog.items.map((item) => {
          if (item.id === itemId) {
            newStatus = completedState !== undefined ? completedState : !item.completed;
            return {
              ...item,
              completed: newStatus,
            };
          }
          return item;
        });
      }
    });

    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));
    return newStatus;
  },

  // Generate new program with AI
  async generateAIProgram(
    studentId: string,
    constraints: ProgramConstraints,
    generatedBy: ProgramGeneratedBy = 'ai',
    customTitle?: string
  ): Promise<StudyProgram> {
    const normId = normalizeStudentId(studentId);
    this.saveConstraints(normId, constraints);

    // 1. Fetch exam analysis (from cache or trigger fresh)
    let examAnalysis = examsService.getCachedAIAnalysis(normId);
    if (!examAnalysis) {
      const exams = await examsService.getExams(normId);
      examAnalysis = await examsService.analyzeExamsWithAI(normId, exams, []);
    }

    // 2. Fetch last 4 weeks of study sessions
    const studySessions = await studySessionsService.getSessions(normId);
    const studySessionsSummary: Record<string, number> = {};
    studySessions.forEach((s) => {
      const subj = s.subject || 'Diğer';
      studySessionsSummary[subj] = (studySessionsSummary[subj] || 0) + (s.duration_minutes || 0);
    });

    // 3. Call AI endpoint /api/ai/generate-program
    let itemsData: any[] = [];
    try {
      const response = await fetch('/api/ai/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraints,
          exam_analysis: examAnalysis,
          study_sessions_summary: Object.entries(studySessionsSummary).map(([subject, total_minutes]) => ({
            subject,
            total_minutes,
            total_hours: Number((total_minutes / 60).toFixed(1)),
          })),
        }),
      });

      if (!response.ok) throw new Error('AI Program Endpoint error');
      const json = await response.json();
      itemsData = json.items || [];
    } catch (err) {
      console.warn('Generate AI program failed, using smart fallback generator:', err);
    }

    // If endpoint returned empty or failed, use rich template items as fallback
    if (!itemsData || itemsData.length === 0) {
      itemsData = PREDEFINED_TEMPLATES[0].items;
    }

    // Determine current Monday date
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const weekStartDate = monday.toISOString().split('T')[0];

    const newProgramId = 'prog-' + Date.now();

    // Map items
    const programItems: ProgramItem[] = itemsData.map((it: any, idx: number) => ({
      id: `pi-${newProgramId}-${idx + 1}`,
      program_id: newProgramId,
      day_of_week: typeof it.day_of_week === 'number' ? it.day_of_week : 0,
      start_time: it.start_time || '17:00',
      end_time: it.end_time || '18:15',
      subject: it.subject || 'Matematik',
      topic: it.topic || 'Konu Tekrarı & Soru Çözümü',
      target_questions: it.target_questions || 35,
      coach_notes: it.coach_notes || null,
      ai_reasoning: it.ai_reasoning || 'Öğrencinin deneme eksiklerine ve haftalık müsaitlik kısıtlarına göre optimize edildi.',
      completed: false,
      generated_by: generatedBy,
    }));

    const newProgram: StudyProgram = {
      id: newProgramId,
      student_id: normId,
      title: customTitle || (generatedBy === 'coach' ? 'Koç Özel Haftalık Programı' : 'AI Destekli Akıllı Haftalık Program'),
      week_start_date: weekStartDate,
      status: 'active',
      generated_by: generatedBy,
      notes: constraints.notes || (generatedBy === 'coach' ? 'Koç tarafından öğrenciye özel hazırlandı.' : 'AI tarafından hedeflere göre oluşturuldu.'),
      created_at: new Date().toISOString(),
      items: programItems,
    };

    return await this.saveFullProgram(newProgram);
  },

  // Update a single item in program
  async updateProgramItem(
    programId: string,
    itemId: string,
    changes: Partial<ProgramItem>
  ): Promise<ProgramItem> {
    const all = await this.getAllPrograms();
    let targetItem: ProgramItem | null = null;

    all.forEach((prog) => {
      if (prog.id === programId && prog.items) {
        prog.items = prog.items.map((item) => {
          if (item.id === itemId) {
            targetItem = {
              ...item,
              ...changes,
            };
            return targetItem;
          }
          return item;
        });
      }
    });

    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('program_items')
          .update({
            ...changes,
          })
          .eq('id', itemId);
      } catch (err) {
        console.warn('Supabase update program item failed:', err);
      }
    }

    return targetItem || (changes as ProgramItem);
  },

  // Add new item to program
  async addProgramItem(
    programId: string,
    item: Omit<ProgramItem, 'id' | 'program_id'>,
    author: ProgramGeneratedBy = 'student'
  ): Promise<ProgramItem> {
    const newItemId = 'pi-' + Date.now();
    const newItem: ProgramItem = {
      ...item,
      id: newItemId,
      program_id: programId,
      generated_by: item.generated_by || author,
      completed: false,
    };

    const all = await this.getAllPrograms();
    all.forEach((p) => {
      if (p.id === programId) {
        p.items = [...(p.items || []), newItem];
      }
    });
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));

    return newItem;
  },

  // Delete item from program
  async deleteProgramItem(programId: string, itemId: string): Promise<void> {
    const all = await this.getAllPrograms();
    all.forEach((p) => {
      if (p.id === programId && p.items) {
        p.items = p.items.filter((i) => i.id !== itemId);
      }
    });
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(all));
  },
};
