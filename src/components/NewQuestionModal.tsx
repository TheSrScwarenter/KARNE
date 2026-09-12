import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  HelpCircle,
  Lightbulb,
  BookmarkPlus,
  BookOpen,
  Tag,
  Check,
  Zap,
  Camera,
} from 'lucide-react';
import { ErrorType, QuestionDifficulty } from '../types';
import { wrongQuestionsService, YKS_SUBJECT_TOPICS, AnalyzeQuestionResult } from '../lib/wrongQuestionsService';
import { compressImage } from '../lib/indexedDbStorage';
import { optimizeImageForUpload, formatBytes } from '../lib/imageOptimizer';
import { questionLimitService, QuestionQuotaStatus } from '../lib/questionLimitService';

interface NewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}

const ERROR_TYPE_OPTIONS: { value: ErrorType; label: string; desc: string; badge: string; color: string }[] = [
  {
    value: 'bilgi_eksikligi',
    label: 'Bilgi Eksikliği',
    desc: 'Formül, kural veya tanım bilinmiyor ya da unutulmuş.',
    badge: 'Kural / Formül Unutuldu',
    color: 'border-[#C0392B] bg-[#C0392B]/5 text-[#C0392B]',
  },
  {
    value: 'dikkatsizlik',
    label: 'Dikkatsizlik / İşlem Hatası',
    desc: 'Toplama, işaret veya okuma hatası yapılmış.',
    badge: 'İşlem / Okuma Hatası',
    color: 'border-[#D97736] bg-[#D97736]/5 text-[#D97736]',
  },
  {
    value: 'kavram_yanilgisi',
    label: 'Kavram Yanılgısı',
    desc: 'İki kavram birbirine karıştırılmış veya yanlış mantık kurulmuş.',
    badge: 'Kavramlar Karıştı',
    color: 'border-[#4A3E72] bg-[#4A3E72]/5 text-[#4A3E72]',
  },
  {
    value: 'zaman_yetersizligi',
    label: 'Zaman Yetersizliği',
    desc: 'Süre yetmediği için soru yetiştirilemedi veya acele edildi.',
    badge: 'Süre Yetişmedi',
    color: 'border-[#255A8A] bg-[#255A8A]/5 text-[#255A8A]',
  },
  {
    value: 'soru_tipi_yanlis_anlama',
    label: 'Soru Tipi Yanlış Anlama',
    desc: 'Soru kökü ("değildir/kesinlikle") veya çeldirici yanlış anlaşıldı.',
    badge: 'Çeldiriciye Gidildi',
    color: 'border-[#2E6B4F] bg-[#2E6B4F]/5 text-[#2E6B4F]',
  },
];

const PRESET_SAMPLES = [
  {
    name: 'Biyoloji - Kalıtım & Soyağacı',
    examType: 'TYT' as const,
    subject: 'TYT Biyoloji',
    topic: 'Kalıtımın Genel Esasları & Soyağaçları',
    subtopic: 'X’e Bağlı Kalıtım',
    errorType: 'kavram_yanilgisi' as ErrorType,
    text: 'X kromozomuna bağlı çekinik bir alelle kalıtılan hemofili hastalığının soyağacında aktarımı sorusu. Taşıyıcı bir anne ile sağlıklı bir babanın çocuklarının genotip ve fenotip dağılımı sorgulanıyor.',
    note: 'Erkek çocukların X kromozomunu sadece anneden aldığını unutup babanın genotipine göre oran kurdum.',
  },
  {
    name: 'Matematik - Türev Ekstremum',
    examType: 'AYT' as const,
    subject: 'AYT Matematik',
    topic: 'Türev Uygulamaları & Ekstremum Noktalar',
    subtopic: 'Yerel Maksimum / Minimum',
    errorType: 'dikkatsizlik' as ErrorType,
    text: 'f(x) = x³ - 3x² + 5 fonksiyonunun [-1, 3] aralığındaki mutlak maksimum değeri kaçtır? f’(x) = 3x(x-2) köklerini buldum ancak uç noktaları denemeyi unuttum.',
    note: 'Uç nokta kontrolü yapmadan sadece x=0 ve x=2 köklerindeki değerlere baktım.',
  },
  {
    name: 'Fizik - Optik Küresel Aynalar',
    examType: 'TYT' as const,
    subject: 'TYT Fizik',
    topic: 'Optik (Aydınlanma, Düzlem Ayna, Küresel Aynalar, Kırılma, Mercekler, Prizmalar)',
    subtopic: 'Çukur Aynada Görüntü',
    errorType: 'bilgi_eksikligi' as ErrorType,
    text: 'Çukur aynada odağın gerisindeki cismin görüntüsünün özellikleri ve boy oranı sorusu. Cisim 3F/2 konumundayken görüntünün 3F noktasında ve 2 kat boyunda oluşacağı bilgisi.',
    note: 'Özel ışınları biliyordum ama 1.5F - 3F özel oranını unuttum.',
  },
  {
    name: 'Kimya - Sıvı Çözeltiler & Denge',
    examType: 'AYT' as const,
    subject: 'AYT Kimya',
    topic: 'Sulu Çözelti Dengeleri (Asit-Baz, Titrasyon, Tampon)',
    subtopic: 'Tampon Çözeltiler',
    errorType: 'bilgi_eksikligi' as ErrorType,
    text: '0.1 M CH₃COOH ve 0.1 M CH₃COONa içeren tampon çözeltinin pH hesabı sorusu.',
    note: 'Henderson-Hasselbalch formülünde asit ile tuz derişiminin yerini karıştırdım.',
  },
];

export const NewQuestionModal: React.FC<NewQuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}) => {
  // Modal Step: 'input' | 'preview'
  const [step, setStep] = useState<'input' | 'preview'>('input');

  // Input & Classification state
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [studentNote, setStudentNote] = useState<string>('');

  // Sınıflandırma Alanları
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'Genel'>('TYT');
  const [subject, setSubject] = useState<string>('TYT Matematik');
  const [topic, setTopic] = useState<string>('Temel Kavramlar & Sayı Kümeleri');
  const [subtopic, setSubtopic] = useState<string>('');
  const [errorType, setErrorType] = useState<ErrorType>('dikkatsizlik');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('orta');

  // AI Analysis state (Step 2)
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiStudyTip, setAiStudyTip] = useState<string>('');
  const [optStats, setOptStats] = useState<{ originalSize: number; optimizedSize: number; savings: number } | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<QuestionQuotaStatus | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load quota status whenever modal opens or studentId changes
  useEffect(() => {
    if (!isOpen || !studentId) return;
    const fetchQuota = async () => {
      try {
        const questions = await wrongQuestionsService.getQuestions(studentId);
        const status = questionLimitService.calculateQuotaStatus(questions.length, studentId);
        setQuotaStatus(status);
      } catch (e) {
        console.warn('Quota calculation error in modal:', e);
      }
    };
    fetchQuota();
  }, [isOpen, studentId]);

  // When subject changes, automatically adjust topic suggestions and exam type
  useEffect(() => {
    const info = YKS_SUBJECT_TOPICS[subject];
    if (info) {
      if (info.exam_type !== 'Genel') {
        setExamType(info.exam_type);
      }
      if (info.topics && info.topics.length > 0) {
        if (!info.topics.includes(topic)) {
          setTopic(info.topics[0]);
        }
      }
    }
  }, [subject]);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('input');
    setActiveTab('photo');
    setSelectedFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setOptStats(null);
    setRawText('');
    setStudentNote('');
    setExamType('TYT');
    setSubject('TYT Matematik');
    setTopic('Temel Kavramlar & Sayı Kümeleri');
    setSubtopic('');
    setErrorType('dikkatsizlik');
    setDifficulty('orta');
    setAiExplanation('');
    setAiStudyTip('');
    setErrorMsg(null);
    setAnalyzing(false);
    setSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    try {
      const opt = await optimizeImageForUpload(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.74,
        preferredFormat: 'image/webp',
      });
      setImagePreview(opt.dataUrl);
      setOptStats({
        originalSize: opt.originalSize,
        optimizedSize: opt.optimizedSize,
        savings: opt.savingsPercentage,
      });
    } catch {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        setImagePreview(compressed);
      } catch {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          setImagePreview(loadEvt.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const applyPreset = (sample: typeof PRESET_SAMPLES[0]) => {
    setExamType(sample.examType);
    setSubject(sample.subject);
    setTopic(sample.topic);
    setSubtopic(sample.subtopic);
    setErrorType(sample.errorType);
    setRawText(sample.text);
    setStudentNote(sample.note);
    setErrorMsg(null);
  };

  // Direct Manual Save (Soru Sınıflandırmasını doğrudan kaydetme)
  const handleDirectManualSave = async () => {
    setErrorMsg(null);

    if (quotaStatus?.isExceeded) {
      setErrorMsg(`Soru bankası kapasiteniz (${quotaStatus.maxLimit} soru) dolmuştur. Yeni soru eklemek için eski sorularınızı silebilir veya yöneticinizden kotanızı artırmasını talep edebilirsiniz.`);
      return;
    }

    if (!topic.trim()) {
      setErrorMsg('Lütfen sorunun konusunu seçin veya yazın.');
      return;
    }

    if (activeTab === 'photo' && !selectedFile && !imagePreview && !rawText.trim()) {
      setErrorMsg('Lütfen en azından bir soru fotoğrafı yükleyin veya soru metnini yazın.');
      return;
    }

    setSaving(true);

    try {
      let uploadedUrl: string | null = imageUrl;
      if (activeTab === 'photo' && selectedFile) {
        const uploadRes = await wrongQuestionsService.uploadImage(selectedFile);
        uploadedUrl = uploadRes.url;
      } else if (imagePreview) {
        uploadedUrl = imagePreview;
      }

      await wrongQuestionsService.addQuestion({
        student_id: studentId,
        image_url: uploadedUrl || null,
        raw_text: rawText.trim() || (activeTab === 'photo' ? 'Görselden yüklenen soru' : null),
        exam_type: examType,
        subject: subject,
        topic: topic.trim(),
        subtopic: subtopic.trim() || null,
        error_type: errorType,
        difficulty: difficulty,
        ai_explanation: null,
        study_tip: null,
        student_note: studentNote.trim() || null,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Kayıt sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // AI Analysis (Yapay zeka ile analiz edip zenginleştirme)
  const handleAnalyzeWithAI = async () => {
    setErrorMsg(null);

    if (quotaStatus?.isExceeded) {
      setErrorMsg(`Soru bankası kapasiteniz (${quotaStatus.maxLimit} soru) dolmuştur. Yeni soru eklemek için eski sorularınızı silebilir veya yöneticinizden kotanızı artırmasını talep edebilirsiniz.`);
      return;
    }

    if (activeTab === 'photo' && !selectedFile && !imagePreview && !rawText.trim()) {
      setErrorMsg('Lütfen analiz edilecek bir soru görseli yükleyin veya metin girin.');
      return;
    }

    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMsg('Lütfen analiz edilecek soru metnini yazın.');
      return;
    }

    setAnalyzing(true);

    try {
      let uploadedUrl: string | null = imageUrl;
      let base64Payload: string | undefined = undefined;

      if (activeTab === 'photo' && selectedFile) {
        const uploadRes = await wrongQuestionsService.uploadImage(selectedFile);
        uploadedUrl = uploadRes.url;
        setImageUrl(uploadRes.url);
        base64Payload = uploadRes.base64;
      } else if (activeTab === 'photo' && imagePreview) {
        base64Payload = imagePreview;
      }

      const result: AnalyzeQuestionResult = await wrongQuestionsService.analyzeQuestion({
        image_url: uploadedUrl || undefined,
        image_base64: base64Payload,
        raw_text: rawText || undefined,
        student_note: studentNote || undefined,
      });

      // Update fields if AI gave concrete results
      if (result.subject) {
        // Match existing subject key or keep
        const matchedKey = Object.keys(YKS_SUBJECT_TOPICS).find((k) =>
          k.toLowerCase().includes(result.subject.toLowerCase())
        );
        if (matchedKey) setSubject(matchedKey);
        else setSubject(result.subject);
      }
      if (result.topic) setTopic(result.topic);
      if (result.subtopic) setSubtopic(result.subtopic);
      if (result.error_type) setErrorType(result.error_type);
      if (result.difficulty) setDifficulty(result.difficulty);
      setAiExplanation(result.ai_explanation || '');
      setAiStudyTip(result.study_tip || '');

      // Switch to Step 2 Preview
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI analizi başarısız, lütfen tekrar deneyin.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 2 Final Save after AI Review
  const handleFinalSaveAfterAI = async () => {
    setErrorMsg(null);

    if (quotaStatus?.isExceeded) {
      setErrorMsg(`Soru bankası kapasiteniz (${quotaStatus.maxLimit} soru) dolmuştur. Yeni soru eklemek için eski sorularınızı siliniz veya kotanızı artırmasını talep ediniz.`);
      return;
    }

    setSaving(true);

    try {
      await wrongQuestionsService.addQuestion({
        student_id: studentId,
        image_url: activeTab === 'photo' ? (imageUrl || imagePreview) : null,
        raw_text: rawText || null,
        exam_type: examType,
        subject: subject,
        topic: topic,
        subtopic: subtopic || null,
        error_type: errorType,
        difficulty: difficulty,
        ai_explanation: aiExplanation || null,
        study_tip: aiStudyTip || null,
        student_note: studentNote || null,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Kayıt sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  // Available topics for currently selected subject
  const currentTopicList = YKS_SUBJECT_TOPICS[subject]?.topics || [];

  return (
    <div
      id="new-question-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#DFD9CC] rounded-t-3xl sm:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl transition-all max-h-[92vh] sm:max-h-[88vh] flex flex-col">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1 bg-black/20 rounded-full mx-auto my-2 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#DFD9CC] bg-[#F7F4EE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D97736]/10 text-[#D97736] flex items-center justify-center font-bold">
              {step === 'input' ? <BookmarkPlus className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#1B2A4A] tracking-tight">
                {step === 'input' ? 'Hata Kasasına Soru Ekle & Sınıflandır' : 'AI Soru Çözümü & İnceleme'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#4A5B78] line-clamp-1">
                {step === 'input'
                  ? 'Fotoğrafını çekin/yükleyin veya AI ile otomatik analiz edin.'
                  : 'Yapay zeka analizini inceleyip düzenleyerek onaylayın.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-[#EFEBE0] flex items-center justify-center text-[#7E8D9F] hover:text-[#1B2A4A] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quota Status Display Banner */}
        {quotaStatus && (
          <div
            className={`px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-b transition-colors shrink-0 ${
              quotaStatus.isExceeded
                ? 'bg-[#C0392B]/10 border-[#C0392B]/20 text-[#C0392B]'
                : quotaStatus.isNearLimit
                ? 'bg-[#D97736]/10 border-[#D97736]/20 text-[#D97736]'
                : 'bg-[#F7F4EE] border-[#DFD9CC] text-[#4A5B78]'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#1B2A4A]">Soru Bankası Kapasitesi:</span>
              <span className="font-semibold">
                <strong>{quotaStatus.currentCount}</strong> / <strong>{quotaStatus.maxLimit}</strong> soru (%{quotaStatus.percentage})
              </span>
              {quotaStatus.isExceeded ? (
                <span className="px-2 py-0.5 rounded-full bg-[#C0392B] text-white text-[10px] font-black uppercase tracking-wider">
                  Maksimum Kota Doldu
                </span>
              ) : quotaStatus.isNearLimit ? (
                <span className="px-2 py-0.5 rounded-full bg-[#D97736] text-white text-[10px] font-black uppercase tracking-wider">
                  Kotaya Yaklaşıldı
                </span>
              ) : null}
            </div>
            <div>
              {quotaStatus.isExceeded ? (
                <span className="font-bold text-[#C0392B]">Yeni soru ekleme geçici olarak kapalı</span>
              ) : (
                <span>
                  Kalan soru hakkı: <strong className="text-[#1B2A4A]">{quotaStatus.remaining}</strong> soru
                </span>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 touch-scroll space-y-5">
          {quotaStatus?.isExceeded && (
            <div className="p-4 rounded-2xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-bold flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-sm">Maksimum Soru Sınırına Ulaştınız ({quotaStatus.maxLimit} Soru)</p>
                <p className="font-normal text-[11px] opacity-90 leading-relaxed">
                  Yönetici tarafından tanımlanan soru bankası kapasitesi ({quotaStatus.maxLimit} adet) dolmuştur. Yeni soru kaydetmek için lütfen listenizdeki eski/öğrenilmiş sorularınızı siliniz veya yöneticinizden kotanızı artırmasını talep ediniz.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: FORM WITH FULL CLASSIFICATION CONTROLS */}
          {step === 'input' && (
            <div className="space-y-5">
              {/* SECTION 1: QUESTION INPUT (PHOTO OR TEXT) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#1B2A4A]" />
                    1. Soru Fotoğrafı veya Metni
                  </span>
                  {/* Tab Selector */}
                  <div className="flex p-0.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-lg">
                    <button
                      type="button"
                      id="tab-photo"
                      onClick={() => setActiveTab('photo')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                        activeTab === 'photo'
                          ? 'bg-[#1B2A4A] text-white shadow-xs'
                          : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Fotoğraf</span>
                    </button>
                    <button
                      type="button"
                      id="tab-text"
                      onClick={() => setActiveTab('text')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                        activeTab === 'text'
                          ? 'bg-[#1B2A4A] text-white shadow-xs'
                          : 'text-[#4A5B78] hover:text-[#1B2A4A]'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Metin</span>
                    </button>
                  </div>
                </div>

                {/* Photo Tab Content */}
                {activeTab === 'photo' && (
                  <div>
                    {/* Hidden inputs for gallery and direct camera */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[#DFD9CC] bg-[#F7F4EE] p-3 flex flex-col items-center">
                        <img
                          src={imagePreview}
                          alt="Soru Önizleme"
                          className="max-h-56 sm:max-h-64 rounded-xl object-contain shadow-2xs w-full"
                          referrerPolicy="no-referrer"
                        />
                        {optStats && (
                          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-[11px] font-bold shadow-2xs">
                            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            <span>
                              Akıllı Depolama: {formatBytes(optStats.originalSize)} ➔ {formatBytes(optStats.optimizedSize)} (%{optStats.savings} tasarruf)
                            </span>
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 min-w-[120px] py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-xs font-semibold text-[#1B2A4A] hover:bg-[#EFEBE0] transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#0071E3]" />
                            <span>Yeniden Çek</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 min-w-[120px] py-2 px-3 bg-white border border-[#DFD9CC] rounded-xl text-xs font-semibold text-[#1B2A4A] hover:bg-[#EFEBE0] transition-colors flex items-center justify-center gap-1.5 touch-manipulation"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#255A8A]" />
                            <span>Farklı Görsel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                            }}
                            className="py-2 px-3 bg-[#C0392B]/10 text-[#C0392B] rounded-xl text-xs font-semibold hover:bg-[#C0392B]/20 transition-colors touch-manipulation"
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Mobile Quick Action Buttons (Direct Camera vs Gallery) */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            id="btn-quick-camera"
                            onClick={() => cameraInputRef.current?.click()}
                            className="p-3 sm:p-3.5 rounded-2xl bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-[#0071E3] border border-[#0071E3]/25 flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-98 touch-manipulation shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#0071E3] text-white flex items-center justify-center shadow-xs">
                              <Camera className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold">Kamerayla Çek</span>
                            <span className="text-[10px] text-[#0071E3]/80">Telefon kamerası</span>
                          </button>

                          <button
                            type="button"
                            id="btn-quick-gallery"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 sm:p-3.5 rounded-2xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-[#1B2A4A] border border-[#DFD9CC] flex flex-col items-center justify-center gap-1.5 text-center transition-all active:scale-98 touch-manipulation shadow-xs"
                          >
                            <div className="w-9 h-9 rounded-xl bg-white border border-[#DFD9CC] text-[#255A8A] flex items-center justify-center shadow-2xs">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold">Galeri / Dosya</span>
                            <span className="text-[10px] text-[#7E8D9F]">Cihazdan yükle</span>
                          </button>
                        </div>

                        {/* Desktop Drag & Drop Area */}
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="hidden sm:flex border-2 border-dashed border-[#DFD9CC] hover:border-[#1B2A4A] bg-[#F7F4EE]/50 hover:bg-[#F7F4EE] rounded-2xl p-4 text-center cursor-pointer transition-all flex-col items-center justify-center group"
                        >
                          <p className="text-xs font-semibold text-[#4A5B78]">
                            veya soru görselini buraya sürükleyip bırakın (PNG, JPG, WEBP)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Tab Content */}
                {activeTab === 'text' && (
                  <div>
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={4}
                      placeholder="Soru metnini veya sorunun tam içeriğini buraya yapıştırabilirsiniz..."
                      className="w-full p-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] transition-colors leading-relaxed placeholder:text-[#7E8D9F]"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: MANUAL CLASSIFICATION (TYT / AYT, DERS, KONU, ALT KONU) */}
              <div className="bg-[#F7F4EE]/60 border border-[#DFD9CC] p-4 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#D97736]" />
                    2. Soru Sınıflandırması (Seçenekler ile Belirle)
                  </span>
                  <div className="flex items-center gap-1">
                    {(['TYT', 'AYT', 'Genel'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExamType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                          examType === type
                            ? 'bg-[#1B2A4A] text-white shadow-xs'
                            : 'bg-white text-[#4A5B78] hover:text-[#1B2A4A] border border-[#DFD9CC]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ders Seçimi */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                      Ders Seçimi <span className="text-[#C0392B]">*</span>
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                    >
                      {Object.keys(YKS_SUBJECT_TOPICS).map((subjKey) => (
                        <option key={subjKey} value={subjKey}>
                          {subjKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Konu Seçimi (Dinamik Liste & Yazılabilir) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                      Konu Seçimi <span className="text-[#C0392B]">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={currentTopicList.includes(topic) ? topic : 'other'}
                        onChange={(e) => {
                          if (e.target.value !== 'other') {
                            setTopic(e.target.value);
                          }
                        }}
                        className="w-full p-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs font-semibold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                      >
                        {currentTopicList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="other">✏️ Başka Bir Konu Yaz...</option>
                      </select>

                      {/* Custom Topic Input if not in list or user wants to customize */}
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Veya spesifik konu adını yazın..."
                        className="w-full py-1.5 px-3 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Alt Konu (Opsiyonel) */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                      Alt Konu / Kazanım (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={subtopic}
                      onChange={(e) => setSubtopic(e.target.value)}
                      placeholder="Örn: Ekstremum Noktalar, Snell Bağıntısı"
                      className="w-full p-2.5 bg-white border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] placeholder:text-[#7E8D9F]"
                    />
                  </div>

                  {/* Zorluk Seviyesi */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider mb-1">
                      Zorluk Seviyesi
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['kolay', 'orta', 'zor'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficulty(diff)}
                          className={`py-2 text-xs font-bold rounded-xl capitalize transition-all ${
                            difficulty === diff
                              ? diff === 'kolay'
                                ? 'bg-[#2E6B4F] text-white shadow-xs'
                                : diff === 'orta'
                                ? 'bg-[#D97736] text-white shadow-xs'
                                : 'bg-[#C0392B] text-white shadow-xs'
                              : 'bg-white text-[#4A5B78] hover:text-[#1B2A4A] border border-[#DFD9CC]'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ERROR TYPE SELECTION (5 KÖK NEDEN) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C0392B]" />
                  3. Hata Tipi & Kök Neden (Neden Yanlış Yapıldı?)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {ERROR_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setErrorType(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        errorType === opt.value
                          ? `${opt.color} ring-2 ring-[#1B2A4A]/20 font-bold shadow-xs`
                          : 'bg-[#F7F4EE]/50 hover:bg-[#F7F4EE] border-[#DFD9CC] text-[#1B2A4A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-extrabold leading-tight">{opt.label}</span>
                        {errorType === opt.value && (
                          <Check className="w-3.5 h-3.5 text-[#1B2A4A] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] opacity-75 mt-1 leading-tight">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 4: STUDENT NOTE (OPSİYONEL) */}
              <div>
                <label className="block text-xs font-bold text-[#1B2A4A] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#D97736]" />
                    Öğrenci Notu & Çözüm Hatası (Opsiyonel)
                  </span>
                </label>
                <textarea
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  rows={2}
                  placeholder="Örn: Soruda eksiyi dağıtırken işaret hatası yaptım, formülü unuttum..."
                  className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A] transition-colors placeholder:text-[#7E8D9F]"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider block mb-1">
                  Hızlı Örnek Doldur (Test İçin):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(sample)}
                      className="px-2.5 py-1 bg-[#EFEBE0] hover:bg-[#DFD9CC] text-[#1B2A4A] text-[11px] font-semibold rounded-lg transition-colors border border-[#DFD9CC]"
                    >
                      ⚡ {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 5: ACTION BUTTONS (MANUEL KAYIT & AI ANALİZİ) */}
              <div className="pt-3 border-t border-[#DFD9CC] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] rounded-xl transition-colors"
                >
                  İptal
                </button>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                  {/* Option A: Direct Manual Save */}
                  <button
                    type="button"
                    id="btn-direct-save"
                    onClick={handleDirectManualSave}
                    disabled={saving || analyzing || quotaStatus?.isExceeded}
                    className="w-full sm:w-auto py-2.5 px-4 bg-[#2E6B4F] hover:bg-[#2E6B4F]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Seçeneklerle Doğrudan Kaydet</span>
                      </>
                    )}
                  </button>

                  {/* Option B: AI Analysis */}
                  <button
                    type="button"
                    id="btn-analyze-ai"
                    onClick={handleAnalyzeWithAI}
                    disabled={analyzing || saving || quotaStatus?.isExceeded}
                    className="w-full sm:w-auto py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#F7F4EE] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D97736]" />
                        <span>AI Analiz Ediyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                        <span>Yapay Zeka ile Analiz Et & Çöz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & AI EDIT RESULTS */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 text-[#2E6B4F] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Yapay zeka soruyu inceleyip çözüm ve analiz önerilerini çıkardı! Dilerseniz alanları düzenleyebilirsiniz.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Exam Type & Subject */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1">
                    Ders
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1">
                    Ana Konu
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>

                {/* Subtopic */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1">
                    Alt Konu
                  </label>
                  <input
                    type="text"
                    value={subtopic}
                    onChange={(e) => setSubtopic(e.target.value)}
                    placeholder="Örn: Bileşke Fonksiyon"
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Error Type */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1">
                    Hata Tipi
                  </label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value as ErrorType)}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    {ERROR_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1">
                    Zorluk Seviyesi
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                    className="w-full p-2.5 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs font-bold text-[#1B2A4A] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="kolay">Kolay Seviye</option>
                    <option value="orta">Orta Seviye</option>
                    <option value="zor">Zor Seviye (Eleme Sorusu)</option>
                  </select>
                </div>
              </div>

              {/* AI Explanation */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97736]" />
                  AI Hata Analizi ve Çözüm Adımları
                </label>
                <textarea
                  value={aiExplanation}
                  onChange={(e) => setAiExplanation(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] leading-relaxed focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              {/* Study Tip */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E8D9F] mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#2E6B4F]" />
                  Öğrenciye Özel Pekiştirme ve Çalışma Tavsiyesi
                </label>
                <textarea
                  value={aiStudyTip}
                  onChange={(e) => setAiStudyTip(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-[#F7F4EE] border border-[#DFD9CC] rounded-xl text-xs text-[#1B2A4A] leading-relaxed focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#DFD9CC]">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3.5 py-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri Dön & Düzenle</span>
                </button>

                <button
                  type="button"
                  id="btn-confirm-save"
                  onClick={handleFinalSaveAfterAI}
                  disabled={saving || quotaStatus?.isExceeded}
                  className="py-2.5 px-5 bg-[#2E6B4F] hover:bg-[#2E6B4F]/90 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Onayla ve Kasaya Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
