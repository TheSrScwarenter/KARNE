import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  History,
  Plus,
  Trash2,
  Target,
  MessageSquare,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { StudyProgram, ProgramItem } from '../types';
import { programService } from '../lib/programService';
import { coachService, CoachStudent } from '../lib/coachService';
import { EditProgramItemModal } from '../components/EditProgramItemModal';
import { WeeklyCalendarView } from '../components/WeeklyCalendarView';
import { ProgramHistory } from '../components/ProgramHistory';
import { useAuth } from '../context/AuthContext';

interface ProgramAdvisorProps {
  studentId?: string;
  studentName?: string;
  isCoachView?: boolean;
}

export const ProgramAdvisor: React.FC<ProgramAdvisorProps> = ({
  studentId: propStudentId,
  studentName: propStudentName,
  isCoachView: propIsCoachView,
}) => {
  const { user } = useAuth();
  const isCoach = user?.role === 'coach';
  const effectiveIsCoach = propIsCoachView ?? isCoach;

  // For coach view, load students
  const [coachStudents, setCoachStudents] = useState<CoachStudent[]>([]);
  const [selectedCoachStudentId, setSelectedCoachStudentId] = useState<string>('');

  useEffect(() => {
    if (effectiveIsCoach) {
      coachService.getStudents().then((list) => {
        setCoachStudents(list);
        if (list.length > 0 && !selectedCoachStudentId && !propStudentId) {
          setSelectedCoachStudentId(list[0].id);
        }
      });
    }
  }, [effectiveIsCoach]);

  const effectiveStudentId =
    propStudentId ||
    (effectiveIsCoach
      ? selectedCoachStudentId || 'st-default'
      : user?.id || 'st-current');

  const selectedCoachStudent = coachStudents.find((s) => s.id === effectiveStudentId);
  const effectiveStudentName =
    propStudentName ||
    (effectiveIsCoach
      ? selectedCoachStudent?.name || 'Seçili Öğrenci'
      : user?.full_name || 'Öğrenci');

  const [activeProgram, setActiveProgram] = useState<StudyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProgramItem | null>(null);
  const [selectedDayForNew, setSelectedDayForNew] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'calendar' | 'history'>('calendar');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (effectiveStudentId) {
      loadProgram();
    }
  }, [effectiveStudentId]);

  const loadProgram = async () => {
    setLoading(true);
    try {
      const prog = await programService.getActiveProgram(effectiveStudentId);
      setActiveProgram(prog);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (updatedItem: ProgramItem) => {
    if (!activeProgram) {
      // Create a fresh program if empty
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);

      const newProg: StudyProgram = {
        id: 'prog-' + Date.now(),
        student_id: effectiveStudentId,
        title: `${effectiveStudentName} Haftalık Programı`,
        week_start_date: monday.toISOString().split('T')[0],
        status: 'active',
        generated_by: effectiveIsCoach ? 'coach' : 'student',
        created_at: new Date().toISOString(),
        items: [{ ...updatedItem, id: 'pi-' + Date.now() }],
      };
      const saved = await programService.saveFullProgram(newProg);
      setActiveProgram(saved);
      return;
    }

    if (selectedItem && selectedItem.id) {
      // Edit existing
      await programService.updateProgramItem(activeProgram.id, updatedItem.id, {
        ...updatedItem,
        generated_by: effectiveIsCoach ? 'coach' : 'student',
      });
    } else {
      // Add new
      await programService.addProgramItem(
        activeProgram.id,
        { ...updatedItem, generated_by: effectiveIsCoach ? 'coach' : 'student' },
        effectiveIsCoach ? 'coach' : 'student'
      );
    }
    await loadProgram();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activeProgram) return;
    await programService.deleteProgramItem(activeProgram.id, itemId);
    await loadProgram();
  };

  const handleDeleteEntireProgram = async () => {
    if (!activeProgram) return;
    setDeleting(true);
    try {
      await programService.deleteProgram(effectiveStudentId, activeProgram.id);
      setActiveProgram(null);
      setShowDeleteConfirmModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleItemComplete = async (itemId: string, completed: boolean) => {
    if (!activeProgram) return;
    await programService.toggleItemCompletion(activeProgram.id, itemId, completed);
    await loadProgram();
  };

  const handleOpenNewItemModal = (dayIndex: number) => {
    setSelectedDayForNew(dayIndex);
    setSelectedItem(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditItemModal = (item: ProgramItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
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
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (currentView === 'history') {
    return <ProgramHistory onBackToActive={() => setCurrentView('calendar')} />;
  }

  return (
    <div id="program-advisor-page" className="space-y-4 md:space-y-6">
      {/* Top Header Card */}
      <div className="bento-card p-5 sm:p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                {effectiveIsCoach ? `${effectiveStudentName} Program Masası` : 'Haftalık Ders Programı'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#34C759]/10 text-[#34C759]">
                {effectiveIsCoach ? 'Koç Yetkisi' : 'Canlı Takip'}
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              Haftalık çalışma saatleri, ders dağılımları ve koç yönergeleriyle planlanmış haftalık çizelge
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {effectiveIsCoach && coachStudents.length > 0 && !propStudentId && (
            <div className="flex items-center gap-1.5 bg-[#F5F5F7] border border-black/[0.06] px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-[#0071E3]" />
              <select
                value={selectedCoachStudentId}
                onChange={(e) => setSelectedCoachStudentId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#1D1D1F] focus:outline-none cursor-pointer"
              >
                {coachStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.field})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            id="btn-add-item-direct"
            onClick={() => handleOpenNewItemModal(0)}
            className="apple-btn-primary py-2.5 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ders Bloğu Ekle</span>
          </button>

          <button
            type="button"
            id="btn-view-program-history"
            onClick={() => setCurrentView('history')}
            className="apple-btn-secondary py-2.5 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4 text-[#0071E3]" />
            <span>Geçmiş</span>
          </button>

          {/* Delete Program Button */}
          {activeProgram && (
            <button
              type="button"
              id="btn-delete-active-program"
              onClick={() => setShowDeleteConfirmModal(true)}
              title="Aktif haftalık programı sil"
              className="p-2.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Program Summary & Coach Note Bar */}
      {activeProgram && (
        <div className="space-y-3">
          {/* Top Progress & Metrics */}
          <div className="bento-card p-4.5 bg-[#F5F5F7] border border-black/[0.04] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-[#1D1D1F] font-semibold">
                  <Calendar className="w-4 h-4 text-[#0071E3]" />
                  <span>Hafta: {activeProgram.week_start_date}</span>
                </div>
                <span className="text-black/10">•</span>
                <div className="flex items-center gap-1.5 text-[#86868B] font-medium">
                  <Clock className="w-4 h-4 text-[#0071E3]" />
                  <span>{totalHours} Saat Planlandı</span>
                </div>
                <span className="text-black/10">•</span>
                <div className="flex items-center gap-1.5 text-[#86868B] font-medium">
                  <Layers className="w-4 h-4 text-[#34C759]" />
                  <span>{items.length} Çalışma Bloğu</span>
                </div>
                {totalTargetQuestions > 0 && (
                  <>
                    <span className="text-black/10">•</span>
                    <div className="flex items-center gap-1.5 text-[#FF9500] font-medium">
                      <Target className="w-4 h-4" />
                      <span>{totalTargetQuestions} Hedef Soru</span>
                    </div>
                  </>
                )}
              </div>

              {/* Completion Pill */}
              <div className="flex items-center gap-2">
                <div className="w-28 sm:w-36 h-2 bg-white rounded-full overflow-hidden border border-black/[0.06]">
                  <div
                    className="h-full bg-[#34C759] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#34C759]">
                  %{progressPercent} ({completedCount}/{items.length})
                </span>
              </div>
            </div>

            {/* Coach Note Announcement Banner */}
            {activeProgram.notes && (
              <div className="p-3 bg-white rounded-2xl border border-black/[0.06] flex items-start gap-2.5 text-xs text-[#1D1D1F]">
                <MessageSquare className="w-4 h-4 text-[#0071E3] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-[#0071E3]">Haftalık Koç Yönergesi: </span>
                  <span className="text-[#86868B]">{activeProgram.notes}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Weekly Calendar Grid */}
      {loading ? (
        <div className="p-16 text-center text-[#7E8D9F] text-xs font-bold bg-white rounded-3xl border border-[#DFD9CC]">
          Haftalık ders programı yükleniyor...
        </div>
      ) : activeProgram && activeProgram.items && activeProgram.items.length > 0 ? (
        <WeeklyCalendarView
          items={activeProgram.items}
          onItemClick={handleOpenEditItemModal}
          onAddItem={handleOpenNewItemModal}
          onToggleComplete={handleToggleItemComplete}
        />
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#DFD9CC] space-y-3">
          <Calendar className="w-10 h-10 text-[#D97736] mx-auto opacity-70" />
          <h3 className="text-sm font-extrabold text-[#1B2A4A]">
            Henüz Aktif Bir Haftalık Program Bulunmuyor
          </h3>
          <p className="text-xs text-[#7E8D9F] max-w-md mx-auto">
            Ders saatlerinizi, konu hedeflerinizi ve soru sayılarınızı belirleyerek haftalık çalışma programınızı oluşturabilirsiniz.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenNewItemModal(0)}
              className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs hover:bg-[#1B2A4A]/90"
            >
              <Plus className="w-4 h-4 text-[#D97736]" />
              <span>Ders Bloğu Ekle</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      <EditProgramItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        dayIndex={selectedDayForNew}
        authorRole={effectiveIsCoach ? 'coach' : 'student'}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      {/* Delete Entire Program Confirmation Modal */}
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
                Bu haftaki çalışma programınız ve içindeki ders blokları silinecektir. İstediğiniz an yeni bir program oluşturabilirsiniz.
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
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#D9534F] hover:bg-[#D9534F]/90 shadow-xs"
              >
                {deleting ? 'Siliniyor...' : 'Evet, Programı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
