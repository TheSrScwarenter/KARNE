# 🎓 Karne — YKS Çalışma Takip Platformu

**FAZ 1/6 — Proje Kurulumu, Auth, Veritabanı, İskelet**

Karne, YKS hazırlık sürecinde öğrencilerin ve koçların çalışma disiplinini, yanlış soru analizlerini, deneme sınavı gelişimlerini ve haftalık programlarını tek bir çatı altında toplayan yeni nesil çalışma takip platformudur.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend & Runtime:** React 19, TypeScript, Vite, Tailwind CSS (v4)
- **Veritabanı & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Grafik & Veri Görselleştirme:** Recharts
- **Tipografi:** Google Fonts *Manrope* (Gövde metni) & *Caveat* (Aksan & el yazısı notlar)
- **Tasarım Dili:** Kağıt tonu (`#F7F4EE`), Derin mürekkep mavisi (`#1B2A4A`), Hata kırmızısı (`#C0392B`), Başarı yeşili (`#2E6B4F`)

---

## 🗄️ Veritabanı Şeması (`supabase/migrations/0001_init.sql`)

İlk fazda tüm platform modüllerinin veritabanı tabloları ve Row Level Security (RLS) kuralları eksiksiz olarak oluşturulmuştur:

| Tablo Adı | Açıklama | İlgili Faz |
| :--- | :--- | :--- |
| `users_profile` | Öğrenci ve Koç profil bilgileri, rol (`student` / `coach`) | Faz 1 |
| `coach_student_links` | Öğrenci - Koç davet kodlu bağlantıları (`pending`, `approved`, `revoked`) | Faz 6 |
| `wrong_questions` | Yanlış soru bankası, hata tipleri, zorluk, AI açıklaması | Faz 2 |
| `study_sessions` | Pomodoro ve manuel çalışma süreleri, ders & konu logları | Faz 3 |
| `exams` | TYT, AYT ve branş denemeleri | Faz 4 |
| `exam_subject_results` | Deneme sınavı ders bazlı doğru/yanlış/boş/net sonuçları | Faz 4 |
| `exam_topic_results` | Deneme sınavı konu bazlı yanlış soru dağılımı | Faz 4 |
| `study_programs` | Haftalık çalışma programları (`active` / `archived`) | Faz 5 |
| `program_items` | Program gün/saat blokları ve AI/Koç gerekçelendirmeleri | Faz 5 |
| `coach_notes` | Koçların öğrencilerine bıraktığı haftalık değerlendirme notları | Faz 6 |

### 🔒 Row Level Security (RLS) Politikaları
1. **Öğrenci Yetkileri:** Her öğrenci kendi `student_id`'sine ait tüm satırlarda tam okuma, ekleme, güncelleme ve silme (CRUD) yetkisine sahiptir.
2. **Koç Yetkileri:** `coach_student_links` tablosu üzerinde `status = 'approved'` olan koçlar, kendilerine bağlı öğrencilerin soru, süre, deneme ve program verilerini yalnızca okuyabilir (`SELECT`); kendi yazdıkları koç notlarında ise tam yetkilidir.

---

## 🚀 Kurulum ve Çalıştırma Adımları

### 1. Depoyu İndirin ve Bağımlılıkları Kurun
```bash
npm install
```

### 2. Ortam Değişkenlerini Tanımlayın
`.env.example` dosyasını `.env` olarak kopyalayın ve Supabase bilgilerinizi girin:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Supabase Veritabanı Migration'ını Uygulayın
Supabase Dashboard -> **SQL Editor** ekranına gidin ve `supabase/migrations/0001_init.sql` dosyasının içeriğini yapıştırıp çalıştırın.

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 🧭 Gelecek Fazlar Yol Haritası

- **FAZ 2:** Yanlış Soru Bankası (Fotoğraf yükleme, 5 hata tipi sınıflandırması, Gemini AI çözüm analizi)
- **FAZ 3:** Çalışma Logu (Pomodoro zamanlayıcı, manuel süre kaydı, günlük verimlilik analitiği)
- **FAZ 4:** Deneme Analizi (TYT & AYT net hesaplama, Recharts gelişim grafikleri, konu açığı tespiti)
- **FAZ 5:** Program Danışmanı (AI & Koç destekli dinamik haftalık çalışma programı stüdyosu)
- **FAZ 6:** Koçluk Paneli & İletişim (Çoklu öğrenci denetimi, davet kodu yönetimi, haftalık koç notları)
