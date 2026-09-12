import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Quote,
  RefreshCw,
  Copy,
  Check,
  Lightbulb,
  Share2,
  Bookmark,
  Compass,
} from 'lucide-react';

export interface InspirationItem {
  id: string;
  text: string;
  author: string;
  role?: string;
  category: 'Motivasyon' | 'Disiplin' | 'YKS Stratejisi' | 'Zihinsel Odak';
  tip?: string;
}

export const INSPIRATION_ITEMS: InspirationItem[] = [
  {
    id: '1',
    text: 'Gelecek, bugünden hazırlananlara aittir. Zafer, "Zafer benimdir" diyebilenindir.',
    author: 'Mustafa Kemal Atatürk',
    role: 'Türkiye Cumhuriyeti Kurucusu',
    category: 'Motivasyon',
    tip: 'Bugün yapacağın 1 saatlik kaliteli çalışma, sınav günü sana binlerce sıralama kazandırır.',
  },
  {
    id: '2',
    text: 'Büyük başarılar, her gün bıkmadan tekrarlanan küçük disiplinlerin toplamıdır.',
    author: 'Robert Collier',
    role: 'Yazar',
    category: 'Disiplin',
    tip: 'Büyük hedefleri parçalara böl: Günlük soru hedefini tamamlamadan günü sonlandırma.',
  },
  {
    id: '3',
    text: 'Çoğu insan zekaya inanır, ben inanmıyorum. Bizi birbirimizden ayıran emektir, çalışmaktır.',
    author: 'Prof. Dr. Aziz Sancar',
    role: 'Nobel Kimya Ödülü Sahibi',
    category: 'Disiplin',
    tip: 'Yapamadığın soruların peşini bırakma; zeka değil, yanlış soru defterin seni ilk bine sokar.',
  },
  {
    id: '4',
    text: 'Matematikte zekadan önce sabır ve odak gelir. Anlamadığın her formül, keşfedilmeyi bekleyen bir haritadır.',
    author: 'Cahit Arf',
    role: 'Matematikçi & Bilim İnsanı',
    category: 'YKS Stratejisi',
    tip: 'Matematik branş denemelerinde turlama taktiğini uygula; zorlandığın soruda inatlaşma.',
  },
  {
    id: '5',
    text: 'Odaklanmak bir şeye evet demek değildir; çevrendeki diğer yüzlerce dikkat dağıtıcıya hayır diyebilmektir.',
    author: 'Steve Jobs',
    role: 'Girişimci & Vizyoner',
    category: 'Zihinsel Odak',
    tip: 'Odaklanma seansına başlamadan önce telefonunu başka bir odaya bırak.',
  },
  {
    id: '6',
    text: 'Bir şeyi 6 yaşındaki bir çocuğa basitçe anlatamıyorsan, konuyu yeterince anlamamışsın demektir.',
    author: 'Richard Feynman',
    role: 'Fizikçi & Eğitimci',
    category: 'YKS Stratejisi',
    tip: 'Feynman tekniği: Bir konuyu bitirdikten sonra boş bir kağıda sesli olarak özetlemeye çalış.',
  },
  {
    id: '7',
    text: 'Zor olan yolu seçenler, huzurlu ve güçlü bir gelecekle ödüllendirilir.',
    author: 'Marcus Aurelius',
    role: 'Düşünür',
    category: 'Zihinsel Odak',
    tip: 'Bugün masaya oturmak zor geldiğinde, sınav günü hissedeceğin gururu hatırla.',
  },
  {
    id: '8',
    text: 'İlim ve fen nerede ise oradan alacağız ve her millet ferdinin kafasına koyacağız.',
    author: 'Ali Kuşçu',
    role: 'Gökbilimci ve Matematikçi',
    category: 'Motivasyon',
    tip: 'TYT ve AYT Fen bilimlerinde kavram yanılgılarını MEB kazanım testleriyle netleştir.',
  },
  {
    id: '9',
    text: 'Hayatta hiçbir şeyden korkmayın, yalnızca anlamaya çalışın. Şimdi daha çok anlama ve daha az korkma zamanı.',
    author: 'Marie Curie',
    role: 'Nobel Fizik & Kimya Ödüllü Bilim İnsanı',
    category: 'Motivasyon',
    tip: 'Deneme netlerin düştüğünde kaygılanma; denemeler hata tespit dedektörüdür.',
  },
  {
    id: '10',
    text: 'Rüzgarın yönünü değiştiremezsin ama yelkenlerini hedefine varacak şekilde ayarlayabilirsin.',
    author: 'Epiktetos',
    role: 'Filozof',
    category: 'Zihinsel Odak',
    tip: 'Kalan zamanı dert etmek yerine, bugünkü 24 saati en verimli şekilde yönetmeye odaklan.',
  },
];

interface DailyInspirationWidgetProps {
  className?: string;
  onQuoteChange?: (quote: { text: string; author: string }) => void;
}

export const DailyInspirationWidget: React.FC<DailyInspirationWidgetProps> = ({
  className = '',
  onQuoteChange,
}) => {
  // Use day of the year or random state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    // Select deterministic quote of the day based on date
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const initialIdx = dayOfYear % INSPIRATION_ITEMS.length;
    setCurrentIndex(initialIdx);
    if (onQuoteChange) {
      onQuoteChange({
        text: INSPIRATION_ITEMS[initialIdx].text,
        author: INSPIRATION_ITEMS[initialIdx].author,
      });
    }
  }, []);

  const currentItem = INSPIRATION_ITEMS[currentIndex];

  const handleNextQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      let filtered = INSPIRATION_ITEMS;
      if (selectedCategory !== 'Tümü') {
        filtered = INSPIRATION_ITEMS.filter((i) => i.category === selectedCategory);
      }
      if (filtered.length > 0) {
        const nextFilteredIdx = Math.floor(Math.random() * filtered.length);
        const item = filtered[nextFilteredIdx];
        const newGlobalIdx = INSPIRATION_ITEMS.findIndex((i) => i.id === item.id);
        setCurrentIndex(newGlobalIdx !== -1 ? newGlobalIdx : 0);
        if (onQuoteChange) {
          onQuoteChange({ text: item.text, author: item.author });
        }
      }
      setIsAnimating(false);
    }, 150);
  };

  const handleCopy = async () => {
    const textToCopy = `"${currentItem.text}" — ${currentItem.author}\n🎯 YKS Tavsiyesi: ${currentItem.tip || ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const categories = ['Tümü', 'Motivasyon', 'Disiplin', 'YKS Stratejisi', 'Zihinsel Odak'];

  return (
    <div
      id="daily-inspiration-widget"
      className={`bg-white rounded-3xl border border-black/[0.08] overflow-hidden p-5 sm:p-6 text-[#1D1D1F] transition-all duration-300 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1B2A4A] flex items-center gap-1.5">
              Günün İlhamı & Bilgeliği
            </h3>
            <p className="text-[11px] text-[#86868B] font-medium">
              Zihnini toparla, hedefine kilitlen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-all cursor-pointer"
            title="Sözü Kopyala"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleNextQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Başka bir söz getir"
          >
            <RefreshCw className={`w-3 h-3 ${isAnimating ? 'animate-spin' : ''}`} />
            <span>Yeni Söz</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar text-xs">
        {categories.map((cat) => {
          const isSel = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                if (cat !== 'Tümü') {
                  const match = INSPIRATION_ITEMS.find((i) => i.category === cat);
                  if (match) {
                    const idx = INSPIRATION_ITEMS.findIndex((i) => i.id === match.id);
                    setCurrentIndex(idx);
                  }
                }
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                isSel
                  ? 'bg-[#0071E3] text-white shadow-2xs'
                  : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.06]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Quote Card */}
      <div
        className={`p-5 rounded-2xl bg-gradient-to-br from-[#F5F5F7] via-white to-amber-500/[0.04] border border-black/[0.06] relative transition-opacity duration-200 ${
          isAnimating ? 'opacity-40' : 'opacity-100'
        }`}
      >
        <Quote className="w-8 h-8 text-[#D97736]/20 absolute top-3 right-3 pointer-events-none" />

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-[#D97736]">
            <Compass className="w-3 h-3" />
            <span>{currentItem.category}</span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-[#1B2A4A] leading-relaxed italic">
            "{currentItem.text}"
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-black/[0.04]">
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] block">
                {currentItem.author}
              </span>
              {currentItem.role && (
                <span className="text-[11px] text-[#86868B] block">
                  {currentItem.role}
                </span>
              )}
            </div>

            <span className="text-[10px] text-[#86868B] font-medium">
              Günün Seçkisi
            </span>
          </div>
        </div>
      </div>

      {/* Daily Study Action Tip */}
      {currentItem.tip && (
        <div className="mt-3.5 p-3 rounded-2xl bg-[#0071E3]/5 border border-[#0071E3]/15 flex items-start gap-2.5">
          <span className="p-1.5 rounded-xl bg-[#0071E3]/10 text-[#0071E3] shrink-0 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </span>
          <div className="text-xs">
            <span className="font-bold text-[#0071E3] block">Günün YKS Tavsiyesi:</span>
            <p className="text-[#1D1D1F] font-medium leading-normal mt-0.5">
              {currentItem.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
