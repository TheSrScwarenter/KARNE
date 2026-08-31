import React, { useState, useEffect } from 'react';
import { StudyProgram, ProgramItem } from '../types';
import { programService } from '../lib/programService';
import { CoachStudent } from '../lib/coachService';
import { WeeklyCalendarView } from './WeeklyCalendarView';
import { EditProgramItemModal } from './EditProgramItemModal';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Save,
  FileText,
  Target,
  UserCheck,
} from 'lucide-react';

interface StudentProgramCoachBuilderProps {
  student: CoachStudent;
  onProgramSaved?: () => void;
}

const DAYS = [
  { id: 0, label: 'Pzt' },
  { id: 1, label: 'Sal' },
  { id: 2, label: 'Çar' },
  { id: 3, label: 'Per' },
  { id: 4, label: 'Cum' },
  { id: 5, label: 'Cmt' },
  { id: 6, label: 'Paz' },
];

export const StudentProgramCoachBuilder: React.FC<StudentProgramCoachBuilderProps> = ({
  student,
  onProgramSaved,
}) => {
  const [activeProgram, setActiveProgram] = useState<StudyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [programTitle, setProgramTitle] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProgramItem | null>(null);
  const [selectedDayForNew, setSelectedDayForNew] = useState<number>(0);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    loadStudentProgram();
  }, [student.id]);

  const loadStudentProgram = async () => {
    setLoading(true);
    try {
      const prog = await programService.getActiveProgram(student.id);
      setActiveProgram(prog);
      if (prog) {
        setCoachNotes(prog.notes || '');
        setProgramTitle(prog.title || `${student.name} Haftalık Çalışma Programı`);
      } else {
        setProgramTitle(`${student.name} Haftalık Çalışma Programı`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (updatedItem: ProgramItem) => {
    if (!activeProgram) {
      // Create fresh program if none exists
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);

      const newProg: StudyProgram = {
        id: 'prog-' + Date.now(),
        student_id: student.id,
        title: programTitle || `${student.name} Haftalık Programı`,
        week_start_date: monday.toISOString().split('T')[0],
        status: 'active',
        generated_by: 'coach',
        notes: coachNotes,
        created_at: new Date().toISOString(),
        items: [{ ...updatedItem, id: 'pi-' + Date.now() }],
      };
      const saved = await programService.saveFullProgram(newProg);
      setActiveProgram(saved);
      triggerSaveNotification();
      return;
    }

    if (selectedItem && selectedItem.id) {
      await programService.updateProgramItem(activeProgram.id, updatedItem.id, {
        ...updatedItem,
        generated_by: 'coach',
      });
    } else {
      await programService.addProgramItem(
        activeProgram.id,
        { ...updatedItem, generated_by: 'coach' },
        'coach'
      );
    }
    await loadStudentProgram();
    triggerSaveNotification();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeProgram) return;
    await programService.deleteProgramItem(activeProgram.id, itemId);
    await loadStudentProgram();
    triggerSaveNotification();
  };

  const handleDeleteEntireProgram = async () => {
    if (!activeProgram) return;
    setSaving(true);
    try {
      await programService.deleteProgram(student.id, activeProgram.id);
      setActiveProgram(null);
      setShowDeleteConfirmModal(false);
      if (onProgramSaved) onProgramSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralNotes = async () => {
    if (!activeProgram) return;
    setSaving(true);
    try {
      const updated: StudyProgram = {
        ...activeProgram,
        title: programTitle,
        notes: coachNotes,
      };
      await programService.saveFullProgram(updated);
      setActiveProgram(updated);
      triggerSaveNotification();
    } finally {
      setSaving(false);
    }
  };

  const triggerSaveNotification = () => {
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
    if (onProgramSaved) onProgramSaved();
  };

  // Metrics
  const items = activeProgram?.items || [];
  const totalMinutes = items.reduce((sum, item) => {
    if (!item.start_time || !item.end_time) return sum;
    const [sh, sm] = item.start_time.split(':').map(Number);
    const [eh, em] = item.end_time.split(':').map(Number);
    return sum + Math.max(0, (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0)));
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalTargetQuestions = items.reduce((sum, i) => sum + (i.target_questions || 0), 0);
  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div id="student-program-coach-builder" className="space-y-4">
      {/* Top Banner with Student Target & Actions */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold shadow-xs">
              <Calendar className="w-5 h-5 text-[#D97736]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-[#1B2A4A]">
                  {student.name} İçin Haftalık Ders Programı
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                  {student.field}
                </span>
                {student.targetDepartment && (
                  <span className="text-xs font-semibold text-[#255A8A]">
                    🎯 {student.targetDepartment}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20">
                  Manuel Koçluk Planı
                </span>
              </div>
              <p className="text-xs text-[#7E8D9F] mt-0.5">
                Öğrencinin haftalık çalışma saatlerini, derslerini ve hedef soru sayılarını doğrudan manuel olarak hazırlayabilirsiniz.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-coach-add-block"
              onClick={() => {
                setSelectedDayForNew(0);
                setSelectedItem(null);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D97736]" />
              <span>Ders Bloğu Ekle</span>
            </button>

            {/* Delete/Reset Program Button */}
            {activeProgram && (
              <button
                type="button"
                id="btn-coach-delete-program"
                onClick={() => setShowDeleteConfirmModal(true)}
                title="Öğrencinin haftalık programını tamamen sil / sıfırla"
                className="px-3 py-2.5 rounded-xl bg-white border border-[#D9534F]/30 text-[#D9534F] text-xs font-bold hover:bg-[#D9534F]/10 flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Programı Sil</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#DFD9CC]/60">
          <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
            <p className="text-[10px] text-[#7E8D9F] font-bold">Toplam Planlanan Süre</p>
            <p className="text-base font-black text-[#1B2A4A] mt-0.5">
              {totalHours} <span className="text-xs font-normal text-[#4A5B78]">Saat / Hafta</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
            <p className="text-[10px] text-[#7E8D9F] font-bold">Hedef Soru Sayısı</p>
            <p className="text-base font-black text-[#D97736] mt-0.5">
              {totalTargetQuestions}{' '}
              <span className="text-xs font-normal text-[#4A5B78]">Soru</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
            <p className="text-[10px] text-[#7E8D9F] font-bold">Toplam Blok Sayısı</p>
            <p className="text-base font-black text-[#255A8A] mt-0.5">
              {items.length} <span className="text-xs font-normal text-[#4A5B78]">Ders Bloğu</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#DFD9CC]">
            <p className="text-[10px] text-[#7E8D9F] font-bold">Öğrenci Tamamlama</p>
            <p className="text-base font-black text-[#2E6B4F] mt-0.5">
              {completedCount}/{items.length}{' '}
              <span className="text-xs font-normal text-[#4A5B78]">
                (%{items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100)})
              </span>
            </p>
          </div>
        </div>

        {/* Coach General Advice Field */}
        <div className="pt-2 border-t border-[#DFD9CC]/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#DFD9CC]">
            <FileText className="w-4 h-4 text-[#2E6B4F] shrink-0" />
            <input
              type="text"
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Bu haftaki koç yönergeniz (Örn: Hafta sonu AYT denemesi öncesi Türev soruları çözülecek)..."
              className="w-full text-xs text-[#1B2A4A] bg-transparent focus:outline-none placeholder:text-[#7E8D9F]"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveGeneralNotes}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#2E6B4F] text-white text-xs font-bold hover:bg-[#2E6B4F]/90 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Kaydediliyor...' : 'Koç Notunu Kaydet'}</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 text-[#2E6B4F] text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Program ve notlar başarıyla kaydedildi! Öğrenci ekranında anında güncellendi.</span>
          </div>
        )}
      </div>

      {/* Main Weekly Calendar / Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#7E8D9F] text-xs font-bold bg-white rounded-3xl border border-[#DFD9CC]">
          Öğrencinin ders programı yükleniyor...
        </div>
      ) : activeProgram && activeProgram.items && activeProgram.items.length > 0 ? (
        <WeeklyCalendarView
          items={activeProgram.items}
          onItemClick={(it) => {
            setSelectedItem(it);
            setIsEditModalOpen(true);
          }}
          onAddItem={(dayIdx) => {
            setSelectedDayForNew(dayIdx);
            setSelectedItem(null);
            setIsEditModalOpen(true);
          }}
          onToggleComplete={async (itemId, isDone) => {
            await programService.toggleItemCompletion(activeProgram.id, itemId, isDone);
            await loadStudentProgram();
          }}
          readOnly={false}
        />
      ) : (
        <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-[#DFD9CC] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A]/5 text-[#1B2A4A] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-[#D97736]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#1B2A4A]">
              Bu Öğrenciye Ait Aktif Program Bulunmuyor
            </h3>
            <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
              Öğrenciniz <strong>{student.name}</strong> ({student.field}) için çalışma saatlerini, dersleri ve soru hedeflerini belirleyerek manuel haftalık program oluşturmaya başlayabilirsiniz.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDayForNew(0);
                setSelectedItem(null);
                setIsEditModalOpen(true);
              }}
              className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-[#1B2A4A]/90"
            >
              <Plus className="w-4 h-4 text-[#D97736]" />
              <span>İlk Ders Bloğunu Ekle</span>
            </button>

            {/* Quick Day Launchers */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="text-[11px] text-[#7E8D9F] font-bold mr-1">Hızlı Gün Seç:</span>
              {DAYS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDayForNew(d.id);
                    setSelectedItem(null);
                    setIsEditModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A] transition-colors"
                >
                  +{d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      <EditProgramItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        dayIndex={selectedDayForNew}
        authorRole="coach"
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#DFD9CC] shadow-2xl space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[#D9534F]/10 text-[#D9534F] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#1B2A4A]">
                Haftalık Programı Silmek İstiyor musunuz?
              </h3>
              <p className="text-xs text-[#7E8D9F] leading-relaxed">
                {student.name} isimli öğrencinin bu haftaki programı tamamen silinecektir. Dilerseniz sonrasında sıfırdan yeni ders blokları ekleyebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-[#4A5B78] bg-[#F7F4EE] hover:bg-[#EFEBE0] border border-[#DFD9CC]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteEntireProgram}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#D9534F] hover:bg-[#D9534F]/90 shadow-xs"
              >
                {saving ? 'Siliniyor...' : 'Evet, Programı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
