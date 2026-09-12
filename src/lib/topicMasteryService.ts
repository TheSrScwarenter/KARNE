import { booksService } from './booksService';
import { wrongQuestionsService } from './wrongQuestionsService';
import { examsService } from './examsService';
import { TopicMasteryItem, SubjectMasterySummary, MasteryLevel } from '../types';

export interface YksTopicDefinition {
  subject: string;
  exam_type: 'TYT' | 'AYT';
  topic_name: string;
  importance: 'high' | 'medium' | 'standard';
  tip: string;
}

export const YKS_CURRICULUM: YksTopicDefinition[] = [
  // --- TYT TÜRKÇE ---
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Paragrafta Anlam & Ana Düşünce', importance: 'high', tip: 'Her gün en az 20 paragraf çözerek okuma hızını koru.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Cümlede Anlam & Yorum', importance: 'high', tip: 'Cümle tamamlama ve kesin yargı sorularında seçenek eleme yap.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Sözcükte Anlam & Deyimler', importance: 'medium', tip: 'Bağlamdan anlam çıkarma egzersizleri yap.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Yazım Kuralları & Büyük Harfler', importance: 'high', tip: 'TDK güncel yazım kılavuzundaki birleşik kelimelere odaklan.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Noktalama İşaretleri', importance: 'high', tip: 'Virgül ve noktalı virgülün kullanım farklarını ezberle.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Ses Bilgisi (Ünlü & Ünsüz Olayları)', importance: 'medium', tip: 'Ünsüz benzeşmesi ve ünlü daralmasına dikkat et.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)', importance: 'medium', tip: 'Sözcüğün cümledeki görevine bak.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Fiiller, Ek Eylem & Fiilimsiler', importance: 'medium', tip: 'Fiilimsilerin yan cümlecik kurma özelliğini unutma.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Cümlenin Ögeleri', importance: 'high', tip: 'Önce yüklem ve özneyi bul, ardından nesne ve tümleçleri ayır.' },
  { subject: 'Türkçe', exam_type: 'TYT', topic_name: 'Anlatım Bozuklukları', importance: 'standard', tip: 'Gereksiz sözcük ve özne-yüklem uyumsuzluklarını tara.' },

  // --- TYT MATEMATİK ---
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Temel Kavramlar & Sayı Kümeleri', importance: 'high', tip: 'Pozitif/negatif ve tek/çift sayı kurallarını pekiştir.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Basamak Kavramı & Çözümleme', importance: 'medium', tip: 'Sayı basamaklarını harfli ifadelerle yazarak sadeleştir.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Bölme & Bölünebilme Kuralları', importance: 'medium', tip: 'Asal çarpanlara ayırarak pratik yap.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'EBOB - EKOK Problemleri', importance: 'high', tip: 'Periyodik tekrar eden problem modellerine çalış.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Rasyonel & Ondalık Sayılar', importance: 'medium', tip: 'İşlem önceliğine ve devirli ondalıklara dikkat.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Basit Eşitsizlikler & Aralıklar', importance: 'high', tip: 'Eksi ile çarpmada yön değiştirmeyi unutma.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Mutlak Değer', importance: 'high', tip: 'İçerinin işaretini kontrol ederek dışarı çıkar.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Üslü & Köklü İfadeler', importance: 'high', tip: 'Eşlenikle çarpma ve üs kurallarını otomatikleştir.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Çarpanlara Ayırma & Özdeşlikler', importance: 'high', tip: 'Tam kare ve iki kare farkı her sorunun temelinde.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Oran - Orantı', importance: 'medium', tip: 'Doğru ve ters orantı kurgusunu netleştir.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Sayı & Kesir Problemleri', importance: 'high', tip: 'Denklem kurma adımlarını net şematize et.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Yaş Problemleri', importance: 'medium', tip: 'Yıllar geçtikçe yaş farkının sabit kaldığını kullan.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'İşçi & Hız - Hareket Problemleri', importance: 'high', tip: 'Birim zamanda yapılan iş ve bağıl hız formüllerini uygula.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Yüzde, Kâr-Zarar & Karışım', importance: 'high', tip: 'Maliyet ve satış fiyatı üzerinden 100x kabulüyle çöz.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Grafik & Tablo Yorumlama', importance: 'high', tip: 'ÖSYM yeni nesil hikayeli grafik sorularına odaklan.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Kümeler & Kartezyen Çarpım', importance: 'medium', tip: 'Venn şeması çizerek bölge bölge ele al.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Fonksiyonlar (Temel Tanım & Grafik)', importance: 'high', tip: 'Bileşke ve ters fonksiyon işlemlerini eksiksiz bitir.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'Permütasyon, Kombinasyon & Olasılık', importance: 'high', tip: 'Tüm durum - İstenmeyen durum yöntemini sık kullan.' },
  { subject: 'Temel Matematik', exam_type: 'TYT', topic_name: 'İstatistik & Veri Analizi', importance: 'medium', tip: 'Medyan, mod ve standart sapma kavramlarını öğren.' },

  // --- GEOMETRİ (TYT-AYT) ---
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Doğruda ve Üçgende Açılar', importance: 'high', tip: 'Z, M, U kuralları ve iç açıortay bağıntılarını çiz.' },
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Özel Üçgenler (3-4-5, 30-60-90, vb.)', importance: 'high', tip: 'Pisagor ve trigonometrik oranları ezbere bil.' },
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Üçgende Alan & Benzerlik', importance: 'high', tip: 'Alan oranlarının benzerlik oranının karesi olduğunu hatırla.' },
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Çokgenler & Dörtgenler', importance: 'medium', tip: 'Düzgün altıgen ve paralelkenar özelliklerini tara.' },
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Çember ve Dairede Açı & Alan', importance: 'high', tip: 'Teğet-kiriş özellikleri ve yay uzunlukları.' },
  { subject: 'Geometri', exam_type: 'TYT', topic_name: 'Katı Cisimler (Prizma, Piramit, Koni)', importance: 'high', tip: 'Hacim ve yüzey alanı formüllerini 3B canlandır.' },

  // --- TYT FEN (Fizik, Kimya, Biyoloji) ---
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Fizik Bilimine Giriş & Madde', importance: 'medium', tip: 'Özkütle ve adezyon/kohezyon kavramları.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Kuvvet, Hareket & Newton Yasaları', importance: 'high', tip: 'Sürtünme kuvveti ve net kuvvet denklemleri.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'İş, Güç ve Enerji', importance: 'high', tip: 'Mekanik enerji korunumu ve kinetik/potansiyel dönüşümü.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Isı, Sıcaklık & Genleşme', importance: 'high', tip: 'Q = m.c.deltaT ve hal değişimi grafiklerini oku.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Elektrostatik & Elektrik Akımı', importance: 'high', tip: 'Ohm yasası ve lamba parlaklığı karşılaştırmaları.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Optik (Aynalar, Kırılma, Mercekler)', importance: 'high', tip: 'Işın çizimlerini ve renk karışımlarını netleştir.' },
  { subject: 'Fizik (TYT)', exam_type: 'TYT', topic_name: 'Dalgalar (Ses, Su, Deprem, Yay)', importance: 'medium', tip: 'Hızın ortama, frekansın kaynağa bağlı olduğunu unutma.' },

  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Kimya Bilimi & Güvenlik Uyarıları', importance: 'medium', tip: 'Yaygın bileşik isimleri ve laboratuvar kuralları.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Atomun Yapısı & Periyodik Sistem', importance: 'high', tip: 'Elektronegatiflik ve iyonlaşma enerjisi periyodik trendleri.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Kimyasal Türler Arası Etkileşimler', importance: 'high', tip: 'Hidrojen bağı ve dipol-dipol etkileşimlerini ayırt et.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Maddenin Halleri & Gazlar', importance: 'medium', tip: 'Buhar basıncı ve kaynama noktası ilişkisi.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Kimyasal Hesaplamalar & Mol', importance: 'high', tip: 'Sınırlayıcı bileşen ve verim hesapları.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Karışımlar & Derişim Birimleri', importance: 'high', tip: 'Kütlece % derişim ve ayırma yöntemleri.' },
  { subject: 'Kimya (TYT)', exam_type: 'TYT', topic_name: 'Asitler, Bazlar ve Tuzlar', importance: 'high', tip: 'pH cetveli, nötralleşme ve indikatörler.' },

  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Canlıların Ortak Özellikleri & Temel Bileşikler', importance: 'high', tip: 'Enzimlerin çalışmasını etkileyen faktörler ve ATP.' },
  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Hücre Yapısı & Organeller', importance: 'high', tip: 'Madde geçişleri (osmoz, aktif taşıma, endositoz).' },
  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Canlılar Dünyası & Sınıflandırma', importance: 'medium', tip: 'Bakteri, arke, protista ve omurgalı özellikleri.' },
  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Hücre Bölünmeleri (Mitoz & Mayoz)', importance: 'high', tip: 'Krossing-over ve kromozom sayısı değişim grafikleri.' },
  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Kalıtım & Soyağaçları', importance: 'high', tip: 'X ve Y kromozomuna bağlı kalıtım modelleri.' },
  { subject: 'Biyoloji (TYT)', exam_type: 'TYT', topic_name: 'Ekosistem Ekolojisi & Çevre Sorunları', importance: 'medium', tip: 'Besin piramidi ve biyolojik birikim kuralları.' },

  // --- AYT MATEMATİK ---
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Polinomlar & Çarpanlara Ayırma', importance: 'high', tip: 'Kalan bulma teoremi ve derece kuralları.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: '2. Dereceden Denklemler & Karmaşık Sayılar', importance: 'high', tip: 'Kök-katsayı bağıntıları (x1+x2, x1.x2).' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Parabol (Tepe Noktası & Grafikler)', importance: 'high', tip: 'Maksimum/minimum problemleri ve simetri ekseni.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Eşitsizlikler & İşaret Tablosu', importance: 'high', tip: 'Çift katlı köklerde işaretin değişmediğine dikkat.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Trigonometri (Birim Çember & Formüller)', importance: 'high', tip: 'Toplam-fark ve yarım açı formüllerini ezbere çiz.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Logaritma & Üstel Fonksiyonlar', importance: 'high', tip: 'Taban değiştirme ve tanım kümesi kısıtlamaları.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Diziler & Aritmetik / Geometrik Dizi', importance: 'medium', tip: 'İlk n terim toplamı (Sn) formülleri.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Limit & Süreklilik', importance: 'high', tip: '0/0 belirsizliklerini sadeleştirerek çöz.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Türev & Türev Alma Kuralları', importance: 'high', tip: 'Zincir kuralı ve geometrik yorum (teğet eğimi).' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'Türev Uygulamaları (Artan-Azalan, Ekstremum)', importance: 'high', tip: '1. ve 2. türev işaret tabloları ile grafik çiz.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'İntegral & Değişken Değiştirme', importance: 'high', tip: 'Belirli integralde sınırları değiştirmeyi unutma.' },
  { subject: 'İleri Matematik (AYT)', exam_type: 'AYT', topic_name: 'İntegral ile Alan Hesabı', importance: 'high', tip: 'Eğriler arasında kalan alanı integral farkıyla bul.' },

  // --- AYT FİZİK ---
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Vektörler & Bağıl Hareket', importance: 'medium', tip: 'Nehir problemlerinde akıntı hızını vektörel ekle.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'İki Boyutta Hareket (Atışlar)', importance: 'high', tip: 'Yatayda sabit hızlı, düşeyde serbest düşme.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'İtme & Çizgisel Momentum', importance: 'high', tip: 'Momentum korunumu ve esnek/esnek olmayan çarpışmalar.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Tork & Denge & Kütle Merkezi', importance: 'high', tip: 'Dönme noktasına göre tork dengesi denklemleri.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Basit Makineler', importance: 'medium', tip: 'Verim ve kuvvet kazancı oranları.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Elektriksel Kuvvet, Alan & Potansiyel', importance: 'high', tip: 'Noktasal yükler ve paralel levhalar.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Manyetizma & İndüksiyon Akımı', importance: 'high', tip: 'Sağ el kuralı ve Lenz kanunu.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Alternatif Akım & Transformatörler', importance: 'medium', tip: 'Empedans ve rezonans durumu.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Düzgün Çembersel Hareket', importance: 'high', tip: 'Merkezcil kuvvet ve viraj dengesi şartları.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Basit Harmonik Hareket (Yay & Sarkaç)', importance: 'high', tip: 'Periyot formülleri (Tolga ve Tamk).' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Dalga Mekaniği (Kırınım & Girişim)', importance: 'high', tip: 'Çift yarıkta girişim ve saçak genişliği.' },
  { subject: 'Fizik (AYT)', exam_type: 'AYT', topic_name: 'Modern Fizik & Fotoelektrik Olay', importance: 'high', tip: 'Einstein fotoelektrik denklemi ve Compton saçılması.' },

  // --- AYT KİMYA ---
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Modern Atom Teorisi & Kuantum Sayıları', importance: 'high', tip: 'Hund kuralı ve Pauli ilkesi.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Gazlar & İdeal Gaz Denklemi', importance: 'high', tip: 'Kinetik teori ve Graham difüzyon yasası.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Sıvı Çözeltiler & Koligatif Özellikler', importance: 'high', tip: 'Molarite, molalite ve donma noktası alçalması.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Kimyasal Tepkimelerde Enerji (Entalpi)', importance: 'high', tip: 'Hess yasası ve oluşum entalpileri.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Kimyasal Tepkimelerde Hız', importance: 'high', tip: 'Hız bağıntısı ve basamaklı tepkimeler.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Kimyasal Denge & Le Chatelier İlkesi', importance: 'high', tip: 'Kc, Kp ve dengeye sıcaklık/basınç etkisi.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Asit-Baz Dengesi & Titrasyon', importance: 'high', tip: 'Tampon çözeltiler ve hidroliz.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Çözünürlük Dengesi (Kçç)', importance: 'high', tip: 'Ortak iyon etkisi ve çökelme şartları.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Elektrokimya & Piller / Elektroliz', importance: 'high', tip: 'Nernst denklemi ve Faraday kanunları.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Organik Kimyaya Giriş (Hibritleşme & VSEPR)', importance: 'high', tip: 'Sigma-pi bağları ve molekül geometrisi.' },
  { subject: 'Kimya (AYT)', exam_type: 'AYT', topic_name: 'Organik Bileşikler (Alkan, Alken, Alkin, Alkol)', importance: 'high', tip: 'IUPAC adlandırma ve fonksiyonel gruplar.' },

  // --- AYT BİYOLOJİ ---
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Sinir Sistemi & Duyu Organları', importance: 'high', tip: 'İmpuls iletimi, sinapslar ve göz/kulak yapısı.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Endokrin Sistem (Hormonlar)', importance: 'high', tip: 'Hipofiz, tiroid, böbrek üstü hormonları ve geri bildirim.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Destek ve Hareket Sistemi', importance: 'medium', tip: 'Kayan iplikler modeli (aktin-miyozin) ve kasılma.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Sindirim Sistemi', importance: 'high', tip: 'Mide, karaciğer ve pankreas enzimlerinin sindirimdeki rolü.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Dolaşım & Bağışıklık Sistemi', importance: 'high', tip: 'Kalbin çalışması, kan basıncı ve antikor üretimi.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Solunum Sistemi', importance: 'high', tip: 'Gazların kanda taşınması (hemoglobin-oksijen eğrileri).' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Boşaltım Sistemi (Üriner Sistem)', importance: 'high', tip: 'Nefron yapısı (süzülme, geri emilim, salgılama).' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Genden Proteine (DNA, RNA, Transkripsiyon)', importance: 'high', tip: 'Santral dogma, replikasyon ve protein sentezi basamakları.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Fotosentez & Kemosentez', importance: 'high', tip: 'Işığa bağımlı ve ışıktan bağımsız (Calvin) reaksiyonları.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Hücresel Solunum (Glikoliz, Krebs, ETS)', importance: 'high', tip: 'Oksijenli/oksijensiz solunum ve fermantasyon ATP verimi.' },
  { subject: 'Biyoloji (AYT)', exam_type: 'AYT', topic_name: 'Bitki Biyolojisi (Doku, Organ, Taşıma)', importance: 'high', tip: 'Ksilem-floem iletimi ve stoma hareketleri.' },

  // --- AYT EDEBİYAT ---
  { subject: 'Edebiyat (AYT)', exam_type: 'AYT', topic_name: 'Şiir Bilgisi & Edebi Sanatlar', importance: 'high', tip: 'Uyak düzeni, aruz ölçüsü, teşbih, istiare ve mecaz-ı mürsel.' },
  { subject: 'Edebiyat (AYT)', exam_type: 'AYT', topic_name: 'İslamiyet Öncesi & Halk Edebiyatı', importance: 'high', tip: 'Koşuk, sagu, sav, aşık tarzı ve tekke edebiyatı nazım türleri.' },
  { subject: 'Edebiyat (AYT)', exam_type: 'AYT', topic_name: 'Divan Edebiyatı & Şairleri', importance: 'high', tip: 'Fuzuli, Baki, Nedim, Şeyh Galip eserleri.' },
  { subject: 'Edebiyat (AYT)', exam_type: 'AYT', topic_name: 'Tanzimat & Servet-i Fünun Edebiyatı', importance: 'high', tip: 'Roman ve hikaye özellikleri, ana karakterler.' },
  { subject: 'Edebiyat (AYT)', exam_type: 'AYT', topic_name: 'Milli Edebiyat & Cumhuriyet Dönemi', importance: 'high', tip: 'Toplumcu gerçekçiler, garipçiler ve ikinci yeniciler.' },

  // --- TYT SOSYAL (Tarih, Coğrafya, Felsefe, Din Kültürü) ---
  // TYT TARİH
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Tarih Bilimine Giriş & Zaman', importance: 'medium', tip: 'Tarih yazıcılığı ve takvim çeşitlerini öğren.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'İlk ve Orta Çağlarda Türk Dünyası', importance: 'high', tip: 'Orta Asya göçleri, ikili teşkilat ve kut anlayışı.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'İslam Medeniyetinin Doğuşu & İlk Devletler', importance: 'high', tip: 'Dört Halife, Emeviler ve Abbasiler döneminin temel özellikleri.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Türklerin İslamiyeti Kabulü & İlk Türk-İslam Devletleri', importance: 'high', tip: 'Karahanlılar, Gazneliler ve Büyük Selçuklu Devleti.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Beylikten Devlete Osmanlı Siyaseti (1300-1453)', importance: 'high', tip: 'İskan ve istimalet politikaları ile gaza anlayışı.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Klasik Çağda Osmanlı Toplum & Devlet Düzeni', importance: 'high', tip: 'Divan-ı Hümayun, tımar sistemi ve yeniçeri ocağı.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Değişen Dünya Dengeleri Karşısında Osmanlı (1595-1774)', importance: 'medium', tip: 'Karlofça, Pasarofça ve Küçük Kaynarca antlaşmaları.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'En Uzun Yüzyıl (1789-1914 Islahatları & Dağılma)', importance: 'high', tip: 'Tanzimat, Islahat fermanları ve I. / II. Meşrutiyet.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: '20. Yüzyıl Başlarında Osmanlı & I. Dünya Savaşı', importance: 'high', tip: 'Trablusgarp, Balkan savaşları ve Çanakkale cephesi.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Milli Mücadele Hazırlık Dönemi & Genelgeler-Kongreler', importance: 'high', tip: 'Amasya Genelgesi, Erzurum ve Sivas Kongresi kararları.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Milli Mücadele Cepheleri & Mudanya-Lozan', importance: 'high', tip: 'Doğu, Güney ve Batı cephesi savaşları ile Lozan hükümleri.' },
  { subject: 'Tarih (TYT)', exam_type: 'TYT', topic_name: 'Atatürkçülük, Türk İnkılabı & İlkeler', importance: 'high', tip: 'Cumhuriyetçilik, Milliyetçilik, Halkçılık, Laiklik, Devletçilik, İnkılapçılık.' },

  // TYT COĞRAFYA
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Doğa ve İnsan & Coğrafyanın Bölümleri', importance: 'medium', tip: 'Fiziki ve beşeri coğrafyanın alt dallarını ayırt et.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Dünyanın Şekli ve Hareketleri', importance: 'high', tip: 'Eksen eğikliği, ekinoks tarihleri ve gece-gündüz süreleri.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Coğrafi Konum & Yerel Saat Hesapları', importance: 'high', tip: 'Meridyen, paralel, enlem etkisi ve ulusal saat dilimi.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Harita Bilgisi, Ölçekler & İzohipsler', importance: 'high', tip: 'İzohips haritasında vadi, sırt, falez ve tepe okuma.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'İklim Bilgisi (Sıcaklık, Basınç, Rüzgar, Nem)', importance: 'high', tip: 'Yüksek/alçak basınç ve orografik/cephesel yağış türleri.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Dünya ve Türkiye İklim Tipleri & Bitki Örtüsü', importance: 'high', tip: 'Akdeniz, Karadeniz ve karasal iklim grafiklerini çözümle.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'İç Kuvvetler (Orojenez, Epirojenez, Volkanizma, Deprem)', importance: 'high', tip: 'Levha tektoniği ve Türkiye aktif fay hatları.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Dış Kuvvetler (Akarsu, Rüzgar, Buzul, Dalga Şekilleri)', importance: 'high', tip: 'Delta ovası, kanyon, peri bacası ve traverten oluşumları.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Nüfus, Yerleşme & Göç Hareketleri', importance: 'high', tip: 'Nüfus piramitleri okuma ve göçlerin mekânsal etkileri.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Bölge Kavramı & Türleri', importance: 'medium', tip: 'Şekilsel ve işlevsel bölge ayrımları.' },
  { subject: 'Coğrafya (TYT)', exam_type: 'TYT', topic_name: 'Doğal Afetler & Çevre Sorunları', importance: 'high', tip: 'Deprem, heyelan, çığ ve erozyondan korunma yolları.' },

  // TYT FELSEFE
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Felsefenin Anlamı, Doğası & Özellikleri', importance: 'medium', tip: 'Refleksif, rasyonel, kümülatif ve eleştirel olma kavramları.' },
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Bilgi Felsefesi (Epistemoloji)', importance: 'high', tip: 'Rasyonalizm, empirizm, kritisizm ve pozitivizm ayrımları.' },
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Varlık Felsefesi (Ontoloji)', importance: 'high', tip: 'İdealizm, materyalizm, düalizm ve nihilizm bakış açıları.' },
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Ahlak Felsefesi (Etik)', importance: 'high', tip: 'Evrensel ahlak yasası, erdem etiği ve hedonizm/faydacılık.' },
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Sanat Felsefesi (Estetik)', importance: 'medium', tip: 'Taklit (mimesis), yaratma ve oyun olarak sanat kuramları.' },
  { subject: 'Felsefe (TYT)', exam_type: 'TYT', topic_name: 'Din & Siyaset & Bilim Felsefesi', importance: 'high', tip: 'Teizm, agnostisizm, ütopya türleri ve paradigma kavramı.' },

  // TYT DİN KÜLTÜRÜ
  { subject: 'Din Kültürü (TYT)', exam_type: 'TYT', topic_name: 'Bilgi ve İnanç (İslamda Bilgi Kaynakları)', importance: 'high', tip: 'Selim akıl, sadık haber ve salim duyular.' },
  { subject: 'Din Kültürü (TYT)', exam_type: 'TYT', topic_name: 'Din ve İslam & İbadet Esasları', importance: 'high', tip: 'İslamın inanç ve ibadet şartları, ihlas ve riya kavramları.' },
  { subject: 'Din Kültürü (TYT)', exam_type: 'TYT', topic_name: 'Ahlak ve Değerler & İslam Ahlakının Özü', importance: 'high', tip: 'Adalet, hikmet, iffet ve şecaat kavramları.' },
  { subject: 'Din Kültürü (TYT)', exam_type: 'TYT', topic_name: 'Hz. Muhammedin Örnekliği & Sünnet', importance: 'high', tip: 'Üsve-i hasene kavramı ve istişare anlayışı.' },
  { subject: 'Din Kültürü (TYT)', exam_type: 'TYT', topic_name: 'İslam Düşüncesinde Tasavvufi Yorumlar & Mezhepler', importance: 'high', tip: 'İtikadi (Eşari, Maturidi) ve fıkhi mezheplerin temel yaklaşımları.' },
];

class TopicMasteryService {
  public async getMasteryMatrix(studentId: string, examTypeFilter: 'ALL' | 'TYT' | 'AYT' = 'ALL'): Promise<{
    items: TopicMasteryItem[];
    summaries: SubjectMasterySummary[];
    overallMasteryPercentage: number;
    hasRealActivity: boolean;
  }> {
    if (!studentId) {
      return {
        items: [],
        summaries: [],
        overallMasteryPercentage: 0,
        hasRealActivity: false,
      };
    }

    const [books, wrongQuestions, exams] = await Promise.all([
      booksService.getBooks(studentId),
      wrongQuestionsService.getQuestions(studentId),
      examsService.getExams(studentId).catch(() => []),
    ]);

    const hasRealActivity = books.length > 0 || wrongQuestions.length > 0 || exams.length > 0;

    // Build lookup index for books
    const bookProgressMap: Record<string, { status: 'not_started' | 'in_progress' | 'completed'; completedTests: number }> = {};
    books.forEach((b) => {
      b.topics?.forEach((t) => {
        const key = `${b.subject}_${t.topic_name}`.toLowerCase();
        bookProgressMap[key] = {
          status: t.status,
          completedTests: t.completed_tests_count || 0,
        };
      });
    });

    // Build lookup for wrong questions (from Question Bank and Exam Wrong Topics)
    const wrongCountMap: Record<string, number> = {};
    wrongQuestions.forEach((wq) => {
      const key = `${wq.subject}_${wq.topic}`.toLowerCase();
      wrongCountMap[key] = (wrongCountMap[key] || 0) + 1;
    });

    // Also include wrong topics from entered exams
    exams.forEach((ex) => {
      (ex.topic_results || []).forEach((tr) => {
        if (!tr.topic) return;
        const trSubj = (tr.subject || '').toLowerCase();
        const trTop = (tr.topic || '').toLowerCase();
        const directKey = `${trSubj}_${trTop}`;
        wrongCountMap[directKey] = (wrongCountMap[directKey] || 0) + (tr.wrong_count || 1);

        // Correlate with curriculum keys
        YKS_CURRICULUM.forEach((c) => {
          const cSubj = c.subject.toLowerCase();
          const cTop = c.topic_name.toLowerCase();
          const isSubjMatch = cSubj.includes(trSubj) || trSubj.includes(cSubj) ||
            (trSubj.includes('mat') && cSubj.includes('mat')) ||
            (trSubj.includes('fiz') && cSubj.includes('fiz')) ||
            (trSubj.includes('kim') && cSubj.includes('kim')) ||
            (trSubj.includes('biyo') && cSubj.includes('biyo')) ||
            (trSubj.includes('türk') && cSubj.includes('türk'));

          if (isSubjMatch && (cTop === trTop || cTop.includes(trTop) || trTop.includes(cTop))) {
            const curKey = `${c.subject}_${c.topic_name}`.toLowerCase();
            wrongCountMap[curKey] = (wrongCountMap[curKey] || 0) + (tr.wrong_count || 1);
          }
        });
      });
    });

    // Filter curriculum
    const filteredDefs = YKS_CURRICULUM.filter((c) => {
      if (examTypeFilter === 'ALL') return true;
      return c.exam_type === examTypeFilter;
    });

    const items: TopicMasteryItem[] = filteredDefs.map((def, idx) => {
      const key = `${def.subject}_${def.topic_name}`.toLowerCase();
      const bookData = bookProgressMap[key];
      const wrongCount = wrongCountMap[key] || 0;

      const bookStatus = bookData?.status || 'not_started';
      const testsDone = bookData?.completedTests || 0;

      let percentage = 0;
      let level: MasteryLevel = 'learning';

      if (!hasRealActivity) {
        // No real data recorded yet
        percentage = 0;
        level = 'learning';
      } else {
        // Dynamic formula based on actual student progress
        if (bookStatus === 'completed') {
          percentage = 90;
        } else if (bookStatus === 'in_progress') {
          percentage = 50 + Math.min(30, testsDone * 6);
        } else if (testsDone > 0) {
          percentage = Math.min(60, testsDone * 10);
        } else {
          percentage = 0;
        }

        // Penalize for active unresolved wrong questions
        if (wrongCount > 0) {
          percentage = Math.max(0, percentage - Math.min(50, wrongCount * 15));
        }

        if (percentage >= 85) level = 'mastered';
        else if (percentage >= 60) level = 'competent';
        else if (wrongCount > 0) level = 'critical';
        else if (percentage > 0) level = 'learning';
        else level = 'learning';
      }

      return {
        id: `topic-mat-${idx}-${def.topic_name.replace(/\s+/g, '-').toLowerCase()}`,
        subject: def.subject,
        exam_type: def.exam_type,
        topic_name: def.topic_name,
        importance_tier: def.importance,
        mastery_percentage: percentage,
        mastery_level: level,
        total_questions_solved: testsDone * 12,
        wrong_questions_count: wrongCount,
        book_status: bookStatus,
        ai_tip: def.tip,
      };
    });

    // Compute Subject Summaries
    const summaryMap: Record<string, SubjectMasterySummary> = {};

    items.forEach((item) => {
      const sKey = `${item.exam_type}_${item.subject}`;
      if (!summaryMap[sKey]) {
        summaryMap[sKey] = {
          subject: item.subject,
          exam_type: item.exam_type,
          topics_count: 0,
          completed_topics_count: 0,
          average_mastery_percentage: 0,
          total_wrong_count: 0,
          critical_topics_count: 0,
        };
      }

      summaryMap[sKey].topics_count++;
      if (item.mastery_level === 'mastered') summaryMap[sKey].completed_topics_count++;
      if (item.mastery_level === 'critical') summaryMap[sKey].critical_topics_count++;
      summaryMap[sKey].total_wrong_count += item.wrong_questions_count;
      summaryMap[sKey].average_mastery_percentage += item.mastery_percentage;
    });

    const summaries = Object.values(summaryMap).map((s) => ({
      ...s,
      average_mastery_percentage: Math.round(s.average_mastery_percentage / (s.topics_count || 1)),
    }));

    const activeItems = items.filter((it) => it.mastery_percentage > 0 || it.wrong_questions_count > 0);
    const overallMastery = activeItems.length
      ? Math.round(activeItems.reduce((acc, it) => acc + it.mastery_percentage, 0) / activeItems.length)
      : 0;

    return {
      items,
      summaries,
      overallMasteryPercentage: overallMastery,
      hasRealActivity,
    };
  }
}

export const topicMasteryService = new TopicMasteryService();
