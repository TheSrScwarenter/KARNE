import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCheck,
  RotateCcw,
  Check,
  AlertCircle,
  Hash,
  Star,
} from 'lucide-react';
import { StudentBook, BookTopicProgress, BookTopicStatus } from '../types';
import { booksService } from '../lib/booksService';

interface BookDetailModalProps {
  book: StudentBook;
  isOpen: boolean;
  onClose: () => void;
  onBookUpdated: (updatedBook: StudentBook) => void;
  onBookDeleted: (bookId: string) => void;
  readOnly?: boolean; // If coach is viewing without edit permission
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onBookUpdated,
  onBookDeleted,
  readOnly = false,
}) => {
  const [currentBook, setCurrentBook] = useState<StudentBook>(book);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [activeTopicNoteId, setActiveTopicNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const topics = currentBook.topics || [];
  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.status === 'completed').length;
  const inProgressTopics = topics.filter((t) => t.status === 'in_progress').length;
  const completionPct = currentBook.completion_percentage ?? 0;

  // Filter topics
  const filteredTopics = topics.filter((topic) => {
    const matchesSearch = topic.topic_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : topic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle single topic status (not_started -> in_progress -> completed -> not_started)
  const handleToggleTopic = async (topic: BookTopicProgress) => {
    if (readOnly) return;

    let nextStatus: BookTopicStatus = 'completed';
    if (topic.status === 'not_started') {
      nextStatus = 'completed'; // direct complete on single click
    } else if (topic.status === 'completed') {
      nextStatus = 'not_started';
    } else {
      nextStatus = 'completed';
    }

    try {
      const updated = await booksService.updateTopicStatus(
        currentBook.id,
        topic.id,
        nextStatus
      );
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
        showToast(
          nextStatus === 'completed'
            ? `✓ "${topic.topic_name}" konusu tamamlandı!`
            : `"${topic.topic_name}" konusu sıfırlandı.`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Set topic status specifically
  const handleSetTopicStatus = async (
    topicId: string,
    newStatus: BookTopicStatus,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (readOnly) return;

    try {
      const updated = await booksService.updateTopicStatus(
        currentBook.id,
        topicId,
        newStatus
      );
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update test count
  const handleUpdateTestCount = async (topic: BookTopicProgress, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;

    const currentCount = topic.completed_tests_count || 0;
    const newCount = Math.max(0, currentCount + delta);
    const totalT = topic.total_tests_count || 4;

    const newStatus: BookTopicStatus =
      newCount >= totalT ? 'completed' : newCount > 0 ? 'in_progress' : 'not_started';

    try {
      const updated = await booksService.updateTopicStatus(
        currentBook.id,
        topic.id,
        newStatus,
        topic.note,
        newCount
      );
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save topic note
  const handleSaveTopicNote = async (topicId: string) => {
    if (readOnly) return;

    try {
      const updated = await booksService.updateTopicStatus(
        currentBook.id,
        topicId,
        currentBook.topics.find((t) => t.id === topicId)?.status || 'not_started',
        tempNote.trim()
      );
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
        setActiveTopicNoteId(null);
        showToast('Konu notu kaydedildi.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Batch action: Complete all topics
  const handleCompleteAll = async () => {
    if (readOnly) return;
    if (window.confirm('Bu kitaptaki TÜM konuları tamamlandı olarak işaretlemek istiyor musunuz?')) {
      const updated = await booksService.batchUpdateAllTopics(currentBook.id, 'completed');
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
        showToast('Tüm konular tamamlandı!');
      }
    }
  };

  // Batch action: Reset all topics
  const handleResetAll = async () => {
    if (readOnly) return;
    if (window.confirm('Bu kitaptaki tüm konu ilerlemelerini sıfırlamak istiyor musunuz?')) {
      const updated = await booksService.batchUpdateAllTopics(currentBook.id, 'not_started');
      if (updated) {
        setCurrentBook(updated);
        onBookUpdated(updated);
        showToast('Tüm konular sıfırlandı.');
      }
    }
  };

  // Delete book
  const handleDeleteBook = async () => {
    if (readOnly) return;
    if (window.confirm(`"${currentBook.title}" kitabını silmek istediğinize emin misiniz?`)) {
      await booksService.deleteBook(currentBook.id);
      onBookDeleted(currentBook.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#DFD9CC] rounded-3xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl relative my-auto space-y-5 flex flex-col max-h-[90vh]">
        {/* Header with Book Meta */}
        <div className="flex items-start justify-between border-b border-[#DFD9CC]/60 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#D97736]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                  {currentBook.exam_type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20">
                  {currentBook.subject}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F7F4EE] text-[#4A5B78] border border-[#DFD9CC]">
                  {currentBook.publisher}
                </span>
                {currentBook.difficulty && (
                  <span className="text-[10px] font-semibold text-[#7E8D9F]">
                    • Zorluk: {currentBook.difficulty}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-[#1B2A4A] tracking-tight mt-1">
                {currentBook.title}
              </h2>

              {currentBook.student_notes && (
                <p className="text-xs text-[#4A5B78] italic mt-0.5">
                  "{currentBook.student_notes}"
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-2xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/30 text-[#2E6B4F] text-xs font-bold flex items-center gap-2 flex-shrink-0 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Progress Metric Bar & Quick Stats */}
        <div className="p-4 rounded-2xl bg-[#F7F4EE] border border-[#DFD9CC] space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#1B2A4A]">Kitap Bitirme Oranı</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#2E6B4F] text-white">
                %{completionPct}
              </span>
            </div>

            <div className="text-xs font-bold text-[#4A5B78]">
              <span className="text-[#2E6B4F] font-black">{completedTopics}</span> / {totalTopics} Konu Tamamlandı
            </div>
          </div>

          {/* Continuous Progress Bar */}
          <div className="w-full h-3.5 bg-white border border-[#DFD9CC] rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${completionPct}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                completionPct === 100
                  ? 'bg-[#2E6B4F]'
                  : completionPct > 50
                  ? 'bg-gradient-to-r from-[#1B2A4A] to-[#2E6B4F]'
                  : 'bg-gradient-to-r from-[#D97736] to-[#1B2A4A]'
              }`}
            />
          </div>

          {/* Quick Filter & Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-[#DFD9CC] rounded-xl overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#1B2A4A] text-white'
                    : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
                }`}
              >
                Tümü ({totalTopics})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-[#2E6B4F] text-white'
                    : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
                }`}
              >
                ✓ Bitenler ({completedTopics})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'in_progress'
                    ? 'bg-[#D97736] text-white'
                    : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
                }`}
              >
                ⏳ Çözülenler ({inProgressTopics})
              </button>
              <button
                onClick={() => setStatusFilter('not_started')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'not_started'
                    ? 'bg-[#7E8D9F] text-white'
                    : 'text-[#4A5B78] hover:bg-[#F7F4EE]'
                }`}
              >
                Kalanlar ({totalTopics - completedTopics - inProgressTopics})
              </button>
            </div>

            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E8D9F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Konu ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Topics Checklist */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredTopics.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F4EE]/50 border border-dashed border-[#DFD9CC] rounded-2xl">
              <BookOpen className="w-6 h-6 text-[#7E8D9F] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1B2A4A]">Aramanıza uygun konu bulunamadı.</p>
            </div>
          ) : (
            filteredTopics.map((topic, index) => {
              const isCompleted = topic.status === 'completed';
              const isInProgress = topic.status === 'in_progress';
              const isEditingNote = activeTopicNoteId === topic.id;

              return (
                <div
                  key={topic.id}
                  onClick={() => !readOnly && handleToggleTopic(topic)}
                  className={`p-3 rounded-2xl border transition-all select-none ${
                    !readOnly ? 'cursor-pointer hover:shadow-xs' : ''
                  } ${
                    isCompleted
                      ? 'bg-[#2E6B4F]/5 border-[#2E6B4F]/30'
                      : isInProgress
                      ? 'bg-[#D97736]/5 border-[#D97736]/30'
                      : 'bg-white border-[#DFD9CC] hover:border-[#1B2A4A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Checkbox and Topic Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox Icon */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTopic(topic);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                          isCompleted
                            ? 'bg-[#2E6B4F] text-white shadow-xs'
                            : isInProgress
                            ? 'bg-[#D97736] text-white shadow-xs'
                            : 'border-2 border-[#DFD9CC] bg-white hover:border-[#1B2A4A]'
                        }`}
                        title={
                          isCompleted
                            ? 'Tamamlandı (Tıklayarak kaldır)'
                            : isInProgress
                            ? 'Çözülüyor (Tıklayarak tamamla)'
                            : 'Tamamlandı olarak işaretle'
                        }
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isInProgress ? (
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : null}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`text-xs font-bold block truncate ${
                            isCompleted
                              ? 'text-[#2E6B4F] line-through decoration-[#2E6B4F]/50'
                              : isInProgress
                              ? 'text-[#D97736]'
                              : 'text-[#1B2A4A]'
                          }`}
                        >
                          {topic.topic_name}
                        </span>

                        {topic.note && !isEditingNote && (
                          <span className="text-[11px] text-[#4A5B78] italic block mt-0.5">
                            • Not: {topic.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Tests counter, Status Pill, Note Button */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Solved test counter */}
                      <div className="hidden sm:flex items-center gap-1 bg-white border border-[#DFD9CC] rounded-xl px-2 py-1 text-[11px] font-bold text-[#1B2A4A]">
                        <span className="text-[#7E8D9F]">Test:</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => handleUpdateTestCount(topic, -1, e)}
                            className="w-4 h-4 rounded text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] flex items-center justify-center font-black"
                          >
                            -
                          </button>
                        )}
                        <span className="font-mono font-black px-1">
                          {topic.completed_tests_count || 0}/{topic.total_tests_count || 4}
                        </span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => handleUpdateTestCount(topic, 1, e)}
                            className="w-4 h-4 rounded text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE] flex items-center justify-center font-black"
                          >
                            +
                          </button>
                        )}
                      </div>

                      {/* Status Badges */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isCompleted
                            ? 'bg-[#2E6B4F]/10 text-[#2E6B4F]'
                            : isInProgress
                            ? 'bg-[#D97736]/10 text-[#D97736]'
                            : 'bg-[#F7F4EE] text-[#7E8D9F]'
                        }`}
                      >
                        {isCompleted ? 'BİTTİ' : isInProgress ? 'ÇÖZÜLÜYOR' : 'ÇÖZÜLMEDİ'}
                      </span>

                      {/* Note trigger */}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTopicNoteId(topic.id);
                            setTempNote(topic.note || '');
                          }}
                          className="p-1.5 rounded-lg text-[#7E8D9F] hover:text-[#1B2A4A] hover:bg-[#F7F4EE]"
                          title="Konuya not ekle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Note Editor */}
                  {isEditingNote && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#DFD9CC]/60 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Bu konuya özel not yazın (örn: Test 4 ve 5 çözülecek)..."
                        className="flex-1 py-1 px-2.5 bg-white border border-[#DFD9CC] rounded-lg text-xs text-[#1B2A4A] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveTopicNote(topic.id)}
                        className="py-1 px-3 bg-[#1B2A4A] text-white text-xs font-bold rounded-lg shadow-xs"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTopicNoteId(null)}
                        className="py-1 px-2 text-[#7E8D9F] text-xs font-bold"
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#DFD9CC]/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={handleCompleteAll}
                  className="py-2 px-3 rounded-xl bg-[#2E6B4F]/10 hover:bg-[#2E6B4F]/20 text-[#2E6B4F] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tümünü Tamamla</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="py-2 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#7E8D9F] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sıfırla</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteBook}
                  className="py-2 px-3 rounded-xl bg-[#C0392B]/10 hover:bg-[#C0392B]/20 text-[#C0392B] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kitabı Sil</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#1B2A4A]/90 transition-all shadow-xs"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
