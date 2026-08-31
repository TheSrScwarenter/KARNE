import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  BookmarkCheck,
  Calendar,
  Tag,
  BarChart3,
  Award,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudentBook, BookStatus } from '../types';
import { booksService } from '../lib/booksService';
import { NewBookModal } from '../components/NewBookModal';
import { BookDetailModal } from '../components/BookDetailModal';

export const BooksManagement: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.id || 'st-demo-001';

  const [books, setBooks] = useState<StudentBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExamType, setSelectedExamType] = useState<'all' | 'TYT' | 'AYT' | 'TYT-AYT'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<StudentBook | null>(null);

  // Load books
  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await booksService.getBooks(studentId);
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [studentId]);

  // Calculations
  const stats = useMemo(() => {
    const total = books.length;
    const inProgress = books.filter((b) => b.status === 'in_progress').length;
    const completed = books.filter((b) => b.status === 'completed').length;

    let totalTopics = 0;
    let completedTopics = 0;

    books.forEach((b) => {
      totalTopics += b.total_topics_count || (b.topics ? b.topics.length : 0);
      completedTopics += b.completed_topics_count || (b.topics ? b.topics.filter((t) => t.status === 'completed').length : 0);
    });

    const overallPct = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    return {
      total,
      inProgress,
      completed,
      totalTopics,
      completedTopics,
      overallPct,
    };
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesExam =
        selectedExamType === 'all' ? true : b.exam_type === selectedExamType;

      const matchesSubj =
        selectedSubject === 'all' ? true : b.subject === selectedSubject;

      const matchesStatus =
        selectedStatus === 'all' ? true : b.status === selectedStatus;

      return matchesSearch && matchesExam && matchesSubj && matchesStatus;
    });
  }, [books, searchQuery, selectedExamType, selectedSubject, selectedStatus]);

  // Unique subjects in user's books for the filter dropdown
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.subject));
    return Array.from(set);
  }, [books]);

  const handleBookCreated = (newBook: StudentBook) => {
    setBooks((prev) => [newBook, ...prev]);
    setSelectedBookForDetail(newBook); // directly open for ticking topics
  };

  const handleBookUpdated = (updatedBook: StudentBook) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    if (selectedBookForDetail?.id === updatedBook.id) {
      setSelectedBookForDetail(updatedBook);
    }
  };

  const handleBookDeleted = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (selectedBookForDetail?.id === bookId) {
      setSelectedBookForDetail(null);
    }
  };

  const getSubjectAccent = (subject: string) => {
    if (subject.includes('Matematik')) return 'border-t-4 border-t-[#1B2A4A]';
    if (subject.includes('Fizik')) return 'border-t-4 border-t-[#255A8A]';
    if (subject.includes('Kimya')) return 'border-t-4 border-t-[#D97736]';
    if (subject.includes('Biyoloji')) return 'border-t-4 border-t-[#2E6B4F]';
    if (subject.includes('Geometri')) return 'border-t-4 border-t-[#4A3E72]';
    if (subject.includes('Türkçe') || subject.includes('Edebiyat')) return 'border-t-4 border-t-[#C0392B]';
    return 'border-t-4 border-t-[#7E8D9F]';
  };

  return (
    <div id="books-management-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
              KAYNAK & KİTAP YÖNETİMİ
            </span>
            <span className="text-xs font-bold text-[#D97736]">
              • YKS Konu Bitirme Çizelgesi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] tracking-tight mt-1">
            Elimdeki Kaynaklar & Kitap Takibi 📚
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5B78] mt-0.5">
            Soru bankalarını kaydet, dersin tüm konularını otomatik yükle ve çözdükçe tik atarak ilerlemeni gör. Koçun da anlık takip etsin!
          </p>
        </div>

        <button
          id="btn-add-new-book"
          onClick={() => setIsNewModalOpen(true)}
          className="py-3 px-5 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D97736]" />
          <span>Yeni Kitap Ekle</span>
        </button>
      </div>

      {/* Bento Grid Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Toplam Kitap */}
        <div className="p-4 rounded-3xl bg-white border border-[#DFD9CC] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7E8D9F] uppercase tracking-wider">
              Toplam Kaynak
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#1B2A4A]">
              {stats.total}
            </span>
            <span className="text-xs text-[#7E8D9F] font-bold ml-1.5">Kitap / Fasikül</span>
          </div>
        </div>

        {/* Metric 2: Aktif Çözülenler */}
        <div className="p-4 rounded-3xl bg-white border border-[#DFD9CC] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97736] uppercase tracking-wider">
              Aktif Çözülen
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#D97736]">
              {stats.inProgress}
            </span>
            <span className="text-xs text-[#7E8D9F] font-bold ml-1.5">Kitap Masada</span>
          </div>
        </div>

        {/* Metric 3: Tamamlanan Kitaplar */}
        <div className="p-4 rounded-3xl bg-white border border-[#DFD9CC] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2E6B4F] uppercase tracking-wider">
              Biten Kitaplar
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#2E6B4F]">
              {stats.completed}
            </span>
            <span className="text-xs text-[#7E8D9F] font-bold ml-1.5">Kütüphanede</span>
          </div>
        </div>

        {/* Metric 4: Konu Bitirme Oranı */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#1B2A4A] to-[#255A8A] text-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Genel Konu Bitirme
            </span>
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
              %{stats.overallPct}
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats.completedTopics}
              </span>
              <span className="text-xs text-white/70 font-semibold">
                / {stats.totalTopics} Konu Tamam
              </span>
            </div>
            {/* Tiny progress bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div
                style={{ width: `${stats.overallPct}%` }}
                className="h-full bg-[#D97736] rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-[#DFD9CC] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Sınav Türü Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F7F4EE] border border-[#DFD9CC] rounded-2xl overflow-x-auto">
            {(['all', 'TYT', 'AYT', 'TYT-AYT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedExamType(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  selectedExamType === tab
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'text-[#4A5B78] hover:bg-[#EFEBE0]'
                }`}
              >
                {tab === 'all' ? 'Tüm Sınavlar' : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E8D9F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kitap adı, yayınevi veya ders ara..."
              className="w-full pl-9 pr-4 py-2 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-medium text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
            />
          </div>
        </div>

        {/* Second Row: Subject & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DFD9CC]/60 text-xs">
          <span className="text-[#7E8D9F] font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtreler:
          </span>

          {/* Subject dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="py-1 px-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
          >
            <option value="all">Tüm Dersler</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="py-1 px-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="in_progress">Aktif Çözülenler</option>
            <option value="completed">Tamamlananlar</option>
          </select>

          <span className="text-[#7E8D9F] text-[11px] font-semibold ml-auto">
            {filteredBooks.length} kaynak gösteriliyor
          </span>
        </div>
      </div>

      {/* Book Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#DFD9CC] rounded-3xl">
          <div className="w-10 h-10 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center font-bold mx-auto animate-pulse">
            K
          </div>
          <p className="mt-3 text-xs font-bold text-[#4A5B78]">Kaynaklar Yükleniyor...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-[#DFD9CC] rounded-3xl space-y-3">
          <BookOpen className="w-10 h-10 text-[#7E8D9F] mx-auto opacity-70" />
          <h3 className="text-base font-black text-[#1B2A4A]">Kayıtlı Kitap Bulunamadı</h3>
          <p className="text-xs text-[#4A5B78] max-w-md mx-auto">
            Arama kriterlerinize uygun kitap yok veya henüz bir soru bankası eklemediniz. "+ Yeni Kitap Ekle" butonuna tıklayarak ilk kaynağınızı tanımlayın.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="py-2.5 px-5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D97736]" />
            <span>İlk Kitabımı Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const completion = book.completion_percentage ?? 0;
            const completedCount = book.completed_topics_count ?? 0;
            const totalCount = book.total_topics_count ?? (book.topics?.length || 0);
            const isCompleted = book.status === 'completed' || completion === 100;

            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookForDetail(book)}
                className={`bg-white rounded-3xl border border-[#DFD9CC] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${getSubjectAccent(
                  book.subject
                )}`}
              >
                <div>
                  {/* Card Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1B2A4A] text-white">
                        {book.exam_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20">
                        {book.subject}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-[#2E6B4F]/10 text-[#2E6B4F] border border-[#2E6B4F]/20'
                          : 'bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20'
                      }`}
                    >
                      {isCompleted ? '✓ BİTTİ' : '⏳ ÇÖZÜLÜYOR'}
                    </span>
                  </div>

                  {/* Title & Publisher */}
                  <h3 className="text-base font-black text-[#1B2A4A] tracking-tight group-hover:text-[#255A8A] transition-colors line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="text-xs font-semibold text-[#7E8D9F] mt-0.5">
                    {book.publisher} {book.difficulty && `• ${book.difficulty.toUpperCase()} Seviye`}
                  </p>

                  {book.student_notes && (
                    <p className="text-[11px] text-[#4A5B78] italic mt-2 line-clamp-1 bg-[#F7F4EE] px-2.5 py-1 rounded-lg border border-[#DFD9CC]/60">
                      "{book.student_notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Section: Progress & Action Button */}
                <div className="mt-5 pt-3.5 border-t border-[#DFD9CC]/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4A5B78]">
                      İlerleme: <strong className="text-[#1B2A4A]">{completedCount}</strong>/{totalCount} Konu
                    </span>
                    <span className="font-mono font-black text-sm text-[#1B2A4A]">
                      %{completion}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${completion}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-[#2E6B4F]'
                          : completion > 50
                          ? 'bg-[#255A8A]'
                          : 'bg-[#D97736]'
                      }`}
                    />
                  </div>

                  {/* CTA Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#255A8A] group-hover:underline flex items-center gap-1">
                      <span>Konuları İncele & Tik At</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    {book.total_questions && (
                      <span className="text-[10px] font-bold text-[#7E8D9F]">
                        ~{book.total_questions} Soru
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isNewModalOpen && (
        <NewBookModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={handleBookCreated}
          studentId={studentId}
        />
      )}

      {selectedBookForDetail && (
        <BookDetailModal
          book={selectedBookForDetail}
          isOpen={!!selectedBookForDetail}
          onClose={() => setSelectedBookForDetail(null)}
          onBookUpdated={handleBookUpdated}
          onBookDeleted={handleBookDeleted}
          readOnly={false}
        />
      )}
    </div>
  );
};
