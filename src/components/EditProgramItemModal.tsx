import React, { useState, useEffect } from 'react';
import { ProgramItem, ProgramGeneratedBy } from '../types';
import { X, Clock, BookOpen, Layers, Info, Trash2, Check, Sparkles, UserCheck, Target, MessageSquare } from 'lucide-react';

interface EditProgramItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ProgramItem | null;
  dayIndex?: number;
  authorRole?: 'coach' | 'student';
  onSave: (updatedItem: ProgramItem) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

const SUBJECT_OPTIONS = [
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Geometri',
  'Sosyal Bilgiler',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'TYT Deneme',
  'AYT Deneme',
  'Yanlış Soru Bankası',
  'Haftalık Değerlendirme',
  'Dinlenme & Mola',
];

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  Matematik: ['Türev & Ekstremum Noktalar', 'İntegral ve Alan Hesabı', 'Trigonometri Toplam-Fark', 'Polinomlar & Derece', 'Fonksiyonlar & Grafikler', 'Problemler (Hız, Yaş, Yüzde)', 'Karmaşık Sayılar & Parabol', 'Logaritma ve Diziler'],
  Fizik: ['Elektrik ve Manyetizma', 'Basit Harmonik Hareket', 'Dalga Mekaniği', 'Bağıl Hareket & Dinamik', 'İş, Güç ve Enerji', 'Düzgün Dairesel Hareket', 'Modern Fizik & Fotoelektrik', 'Optik & Kırılma'],
  Kimya: ['Organik Kimya - Fonksiyonel Gruplar', 'Kimyasal Denge & Sulu Çözeltiler', 'Elektrokimya & Piller', 'Gazlar & Sıvı Çözeltiler', 'Kimyasal Tepkimelerde Hız', 'Atom ve Periyodik Sistem', 'Asit-Baz Dengesi'],
  Biyoloji: ['Fotosentez ve Kemosentez', 'Hücresel Solunum & ATP', 'İnsan Fizyolojisi (Sistemler)', 'Genden Proteine (Protein Sentezi)', 'Kalıtım ve Çaprazlamalar', 'Hücre Bölünmeleri', 'Bitki Biyolojisi'],
  Türkçe: ['TYT Paragrafta Ana Fikir & Hız', 'Cümlenin Ögeleri & Anlatım Bozukluğu', 'Ses Bilgisi & Yazım Kuralları', 'Noktalama İşaretleri', 'AYT Edebiyat Tanzimat & Servet-i Fünun', 'Cumhuriyet Dönemi Roman & Şiir', 'Divan Edebiyatı Nazım Şekilleri'],
  Geometri: ['Analitik Geometri', 'Çember ve Daire', 'Katı Cisimler (Prizma, Koni, Piramit)', 'Üçgende Benzerlik ve Alan', 'Dörtgenler ve Çokgenler'],
  'Sosyal Bilgiler': ['Milli Mücadele Dönemi Tarih', 'Osmanlı Kültür & Medeniyeti', 'Türkiye İklimi ve Yer Şekilleri', 'Harita Bilgisi ve Nüfus Piramitleri'],
  'TYT Deneme': ['Genel TYT Provası (165 dk)', 'TYT Türkçe Branş Denemesi', 'TYT Matematik 40 Soru Provası', 'TYT Fen & Sosyal Branş Provası'],
  'AYT Deneme': ['Tam AYT Matematik & Fen Denemesi', 'AYT Edebiyat & Sosyal Denemesi', 'AYT Matematik Branş Denemesi'],
  'Yanlış Soru Bankası': ['Haftalık Hata Tekrarı & Video Çözümler', 'Kesilen Yanlış Soruların Yeniden Çözümü', 'Deneme Hataları Taraması'],
};

const DAYS = [
  { id: 0, label: 'Pazartesi' },
  { id: 1, label: 'Salı' },
  { id: 2, label: 'Çarşamba' },
  { id: 3, label: 'Perşembe' },
  { id: 4, label: 'Cuma' },
  { id: 5, label: 'Cumartesi' },
  { id: 6, label: 'Pazar' },
];

export const EditProgramItemModal: React.FC<EditProgramItemModalProps> = ({
  isOpen,
  onClose,
  item,
  dayIndex = 0,
  authorRole = 'student',
  onSave,
  onDelete,
}) => {
  const [subject, setSubject] = useState('Matematik');
  const [topic, setTopic] = useState('');
  const [day, setDay] = useState(0);
  const [targetQuestions, setTargetQuestions] = useState<number | ''>(40);
  const [coachNotes, setCoachNotes] = useState('');
  const [aiReasoning, setAiReasoning] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setSubject(item.subject || 'Matematik');
      setTopic(item.topic || '');
      setDay(typeof item.day_of_week === 'number' ? item.day_of_week : 0);
      setTargetQuestions(item.target_questions ?? 35);
      setCoachNotes(item.coach_notes || '');
      setAiReasoning(item.ai_reasoning || '');
    } else {
      setSubject('Matematik');
      setTopic('');
      setDay(dayIndex);
      setTargetQuestions(40);
      setCoachNotes(authorRole === 'coach' ? 'Koç Yönergesi: Konu bitiminde en az 2 test çözülecek.' : '');
      setAiReasoning(authorRole === 'coach' ? 'Koç tarafından programa eklendi.' : 'Öğrenci tarafından manuel eklendi.');
    }
  }, [item, dayIndex, isOpen, authorRole]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: ProgramItem = {
        id: item?.id || 'pi-' + Date.now(),
        program_id: item?.program_id || 'prog-current',
        day_of_week: day,
        start_time: item?.start_time || undefined,
        end_time: item?.end_time || undefined,
        subject,
        topic: topic.trim() || 'Genel Konu Tekrarı',
        target_questions: targetQuestions === '' ? undefined : Number(targetQuestions),
        coach_notes: coachNotes.trim() || undefined,
        ai_reasoning: aiReasoning.trim() || (authorRole === 'coach' ? 'Koç tarafından özel planlandı.' : 'Öğrenci planı.'),
        generated_by: authorRole === 'coach' ? 'coach' : 'student',
        completed: item?.completed || false,
      };
      await onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isNew = !item || !item.id;
  const currentSuggestions = TOPIC_SUGGESTIONS[subject] || [];

  return (
    <div
      id="edit-program-item-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-6 transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-[#D97736]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#1B2A4A]">
                  {isNew ? 'Yeni Çalışma Bloğu Ekle' : 'Çalışma Bloğunu Düzenle'}
                </h2>
                {authorRole === 'coach' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20">
                    Koç Yetkisi
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7E8D9F]">
                {isNew
                  ? 'Haftalık programa gün, ders ve soru hedefi belirleyin'
                  : 'Ders, gün, konu veya soru hedefini güncelleyin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#EFEBE0] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Day, Subject & Target Questions Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Gün</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Ders Seçimi</label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  const sugg = TOPIC_SUGGESTIONS[e.target.value];
                  if (sugg && sugg.length > 0 && !topic) {
                    setTopic(sugg[0]);
                  }
                }}
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#D97736]" />
                <span>Hedef Soru</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="Örn: 40"
                value={targetQuestions}
                onChange={(e) => setTargetQuestions(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
              />
            </div>
          </div>

          {/* Topic & Auto Suggestion Chips */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1">Konu & Odak Detayı</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Örn: Türev Ekstremum Noktalar & Soru Çözümü"
              required
              className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
            />

            {/* Quick Topic Chips */}
            {currentSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-[#7E8D9F] font-bold mb-1">Hızlı Konu Seç:</p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                  {currentSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setTopic(sug)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        topic === sug
                          ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] font-bold'
                          : 'bg-[#F7F4EE] text-[#4A5B78] border-[#DFD9CC] hover:bg-[#EFEBE0]'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coach Note / Guidance */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>{authorRole === 'coach' ? 'Koç Yönergesi & Notu' : 'Kişisel Çalışma Notu'}</span>
              </span>
              <span className="text-[10px] text-[#7E8D9F]">İsteğe bağlı</span>
            </label>
            <textarea
              rows={2}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder={
                authorRole === 'coach'
                  ? 'Öğrenciye bu blok için tavsiyeniz (Örn: Çıkmış soruları mutlaka tara)'
                  : 'Kendine not (Örn: Formül kağıdına bakarak başla)'
              }
              className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
            />
          </div>

          {/* AI Reason / Background */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center justify-between">
              <span>Program Gerekçesi / Planlama Sebebi</span>
              <span className="text-[10px] text-[#7E8D9F]">Açıklama</span>
            </label>
            <input
              type="text"
              value={aiReasoning}
              onChange={(e) => setAiReasoning(e.target.value)}
              placeholder="Örn: Deneme analizindeki hata yoğunluğuna göre eklendi."
              className="w-full py-2 px-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#DFD9CC] flex items-center justify-between">
            {!isNew && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Bu bloğu haftalık programdan silmek istediğinize emin misiniz?')) {
                    if (item?.id) await onDelete(item.id);
                    onClose();
                  }
                }}
                className="py-2 px-3 text-xs font-bold text-[#D9534F] hover:bg-[#D9534F]/10 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bloğu Sil</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-[#D97736]" />
                <span>{isNew ? 'Bloğu Ekle' : 'Değişikliği Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
