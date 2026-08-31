import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Users,
  BrainCircuit,
  FileText,
  Settings,
  ArrowLeft,
  Sparkles,
  Database,
  Layers,
  Code2,
} from 'lucide-react';

interface ModuleConfig {
  phase: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  plannedFeatures: string[];
  samplePreviewText: string;
}

export const PlaceholderModule: React.FC<{ path: string }> = ({ path }) => {
  const { user, navigate } = useAuth();

  const configs: Record<string, ModuleConfig> = {
    '/wrong-questions': {
      phase: 'FAZ 2',
      title: 'Yanlış Soru Bankası',
      subtitle: 'Hatalı soruların AI destekli sınıflandırılması ve analizi',
      icon: HelpCircle,
      iconBg: 'bg-[#C0392B]/10',
      iconColor: 'text-[#C0392B]',
      plannedFeatures: [
        'Fotoğraf yükleme ve OCR ile soru metni çıkarma',
        '5 Temel Hata Tipi: Bilgi Eksikliği, Dikkatsizlik, Zaman Yetersizliği, Kavram Yanılgısı, Soru Tipi Yanlış Anlama',
        'Gemini AI ile adım adım çözüm ve eksik konu tespiti',
        'Zorluk derecesi ve derse göre akıllı filtreleme',
      ],
      samplePreviewText: 'Faz 2 ile birlikte yanlış çözdüğünüz soruları doğrudan cep telefonunuzdan veya bilgisayarınızdan yükleyip AI teşhisi alabileceksiniz.',
    },
    '/study-log': {
      phase: 'FAZ 3',
      title: 'Çalışma Logu & Pomodoro Zamanlayıcı',
      subtitle: 'Süre ve verimlilik odaklı günlük ders takip sistemi',
      icon: Clock,
      iconBg: 'bg-[#255A8A]/10',
      iconColor: 'text-[#255A8A]',
      plannedFeatures: [
        'Entegre Pomodoro Sayacı (25dk çalışma / 5dk mola)',
        'Manuel ders süresi ve çözülen soru adedi girişi',
        'Haftalık ve aylık ders bazlı çalışma dağılım grafikleri',
        'Günlük çalışma hedefi ilerleme çubuğu',
      ],
      samplePreviewText: 'Faz 3 ile masa başında veya kütüphanede çalışırken tek tıkla sayacı başlatıp çalışma loglarınızı kaydedebileceksiniz.',
    },
    '/exams': {
      phase: 'FAZ 4',
      title: 'Deneme Analizi & Net Takibi',
      subtitle: 'TYT, AYT ve Branş denemeleri için derinlemesine istatistik',
      icon: BarChart3,
      iconBg: 'bg-[#2E6B4F]/10',
      iconColor: 'text-[#2E6B4F]',
      plannedFeatures: [
        'TYT & AYT standart net hesaplama (Doğru - Yanlış/4)',
        'Ders ve konu bazında yanlış soru dağılım grafikleri (Recharts)',
        'ÖSYM puan projeksiyonu ve sıralama tahmini',
        'Branş bazlı eksik analizi ve alarm sistemi',
      ],
      samplePreviewText: 'Faz 4 ile girdiğiniz tüm kurumsal denemelerin optik sonuçlarını girip net trendlerinizi interaktif grafiklerle inceleyebileceksiniz.',
    },
    '/program': {
      phase: 'FAZ 5',
      title: 'Haftalık Kişisel Çalışma Programı',
      subtitle: 'Dinamik zaman blokları ve akıllı konu takvimi',
      icon: CalendarDays,
      iconBg: 'bg-[#D97736]/10',
      iconColor: 'text-[#D97736]',
      plannedFeatures: [
        'Haftalık 7 günlük interaktif zaman çizelgesi',
        'AI ve Koç tarafından optimize edilen ders blokları',
        'Tamamlanan saatleri işaretleme ve program uyum skoru',
        'Eksik konulara öncelik veren otomatik program jeneratörü',
      ],
      samplePreviewText: 'Faz 5 ile haftalık hedeflerinize ve deneme eksiklerinize göre özelleştirilmiş dinamik bir çalışma takvimi kullanacaksınız.',
    },
    '/students': {
      phase: 'FAZ 6',
      title: 'Öğrenci Yönetimi & Koçluk',
      subtitle: 'Koçlar için çoklu öğrenci izleme ve denetleme alanı',
      icon: Users,
      iconBg: 'bg-[#255A8A]/10',
      iconColor: 'text-[#255A8A]',
      plannedFeatures: [
        'Davet kodu ile yeni öğrenci ekleme ve onaylama',
        'Öğrencinin anlık çalışma logunu ve deneme grafiklerini inceleme',
        'Öğrenciye özel hedef belirleme ve başarı takibi',
        'Güvenli veri izolasyonu ve profil yönetimi',
      ],
      samplePreviewText: 'Faz 6 ile koçlar, bağlı oldukları tüm öğrencilerin gelişimini tek bir ekrandan eş zamanlı takip edebilecektir.',
    },
    '/program-advisor': {
      phase: 'FAZ 5',
      title: 'AI & Koç Program Danışmanı',
      subtitle: 'Veriye dayalı haftalık program hazırlama stüdyosu',
      icon: BrainCircuit,
      iconBg: 'bg-[#D97736]/10',
      iconColor: 'text-[#D97736]',
      plannedFeatures: [
        'Öğrencinin son deneme netlerine göre zayıf konuları otomatik tespit',
        'Gemini AI ile optimize edilmiş saatlik çalışma taslağı',
        'Koç düzenleme ve öğrenciye onaylı program aktarma',
        'Haftalık program arşivleme ve kıyaslama',
      ],
      samplePreviewText: 'Faz 5 ile koçlar yapay zekadan destek alarak öğrencileri için dakikalar içinde nokta atışı çalışma programı üretebilecektir.',
    },
    '/coach-notes': {
      phase: 'FAZ 6',
      title: 'Koçluk Notları & Strateji Değerlendirmeleri',
      subtitle: 'Birebir rehberlik notları ve geribildirim akışı',
      icon: FileText,
      iconBg: 'bg-[#2E6B4F]/10',
      iconColor: 'text-[#2E6B4F]',
      plannedFeatures: [
        'Haftalık görüşme notlarını kaydetme',
        'Öğrenciye özel motivasyon ve strateji mesajları iletme',
        'Geçmiş not arşivi ve kronolojik gelişim günlüğü',
        'Öğrenci ekranında anında bildirim ve görünüm',
      ],
      samplePreviewText: 'Faz 6 ile koçun yazdığı notlar öğrencinin paneline otomatik olarak yansıyacak ve çift yönlü iletişim sağlanacaktır.',
    },
    '/settings': {
      phase: 'FAZ 1+',
      title: 'Profil & Sistem Ayarları',
      subtitle: 'Hesap bilgileri, veritabanı durumu ve tercihler',
      icon: Settings,
      iconBg: 'bg-[#1B2A4A]/10',
      iconColor: 'text-[#1B2A4A]',
      plannedFeatures: [
        'Ad Soyad ve şifre güncelleme',
        'Koç davet kodu bağlantısı kurma / kaldırma',
        'Veritabanı bağlantı durum kontrolü',
        'Tema ve bildirim tercihleri',
      ],
      samplePreviewText: 'Hesap bilgilerinizi ve koç bağlantı kodunuzu buradan yönetebilirsiniz.',
    },
  };

  const currentConfig = configs[path] || {
    phase: 'Gelecek Faz',
    title: 'Modül İskeleti',
    subtitle: 'Bu sayfa sonraki geliştirme fazında doldurulacaktır',
    icon: Layers,
    iconBg: 'bg-[#1B2A4A]/10',
    iconColor: 'text-[#1B2A4A]',
    plannedFeatures: ['Gelecek fazlarda eklenecek özellikler'],
    samplePreviewText: 'Bu alan planlanan fazda aktif olacaktır.',
  };

  const Icon = currentConfig.icon;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#4A5B78] hover:text-[#1B2A4A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kontrol Paneline Dön</span>
      </button>

      {/* Main Module Bento Card */}
      <div className="bento-card p-6 sm:p-8 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${currentConfig.iconBg} ${currentConfig.iconColor} flex items-center justify-center flex-shrink-0 border border-current/10`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#1B2A4A] text-white">
                  {currentConfig.phase}
                </span>
                <span className="font-caveat text-lg text-[#D97736] font-bold">
                  Genişletilebilir Mimari İskeleti
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight mt-1">
                {currentConfig.title}
              </h2>
              <p className="text-sm text-[#4A5B78] mt-1">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Planned Features List Bento Grid */}
        <div className="mt-6">
          <h3 className="text-sm font-extrabold text-[#1B2A4A] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97736]" />
            <span>Bu Modülde Yer Alan Özellikler:</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentConfig.plannedFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] flex items-start gap-3 text-xs text-[#1B2A4A] font-medium transition-all hover:bg-[#EFEBE0]/60"
              >
                <div className="w-5 h-5 rounded-full bg-[#1B2A4A] text-[#F7F4EE] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description Box */}
        <div className="mt-6 p-4 rounded-xl bg-[#EFEBE0]/70 border border-[#DFD9CC] text-xs text-[#4A5B78] flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#D97736] flex-shrink-0" />
          <span>{currentConfig.samplePreviewText}</span>
        </div>
      </div>
    </div>
  );
};
