# KARNE

Yapay zeka destekli YKS koçluk & takip sistemi — kişiselleştirilmiş çalışma planları, ilerleme takibi, sınav simülasyonları ve analizlerle öğrencilerin YKS hazırlığını güçlendirir.

## İçindekiler
- [Özet](#özeti)
- [Proje Nedir?](#proje-nedir)
- [Neden KARNE?](#neden-karne)
- [Özellikler](#özellikler)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı ve Mimarisi](#proje-yapısı-ve-mimarisi)
- [Hızlı Başlangıç](#hızlı-başlangıç)
  - [Gereksinimler](#gereksinimler)
  - [Kurulum](#kurulum)
  - [Ortam Değişkenleri](#ortam-değişkenleri)
  - [Çalıştırma](#çalıştırma)
- [Proje Nasıl Çalışır (Yüksek Seviye)](#proje-nasıl-çalışır-yüksek-seviye)
- [Geliştirme](#geliştirme)
- [Testler](#testler)
- [Dağıtım (Deployment)](#dağıtım-deployment)
- [Güvenlik ve Gizlilik](#güvenlik-ve-gizlilik)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)
- [İletişim](#iletişim)

---

## Özet
KARNE, yapay zeka ve veri analitiği kullanarak YKS hazırlanan öğrenciler için:
- Kişiye özel çalışma planları,
- İlerleme ve zayıf konu tespiti,
- Gerçek sınav simülasyonları,
- Günlük/haftalık takip panosu,
- Bildirimler ve motivasyon desteği
sunmayı amaçlar.

## Proje Nedir?
KARNE, YKS (Yükseköğretim Kurumları Sınavı) hazırlığı yapan öğrencilere yönelik AI destekli bir web uygulamasıdır. Sistem, öğrencinin profilini, performans geçmişini ve hedeflerini toplar; ardından kişiselleştirilmiş çalışma planları oluşturmak, alıştırma soruları önermek, sınav simülasyonları çalıştırmak ve ilerlemeyi görselleştirmek için yapay zeka ve analiz araçlarını kullanır.

Repo açıklaması: "yapay zeka destekli yks koçluk&takip sistemi" — bu proje, Türkiye'deki YKS sınav hazırlığına odaklanan yapay zeka destekli koçluk ve takip hizmetleri sunmayı amaçlar.

## Neden KARNE?
Geleneksel çalışma planları genellikle geneldir ve bireyin güçlü/zayıf yönlerine ya da değişen programına uyum sağlamaz. KARNE şu amaçları taşır:
- Öğrenci geliştikçe uyum sağlayan dinamik, kişiselleştirilmiş planlar sunmak.
- Zayıf konuları tespit edip otomatik olarak önceliklendirmek.
- Planlama ve takibi azaltıp öğrencilerin daha fazla çalışmasına yardımcı olmak.
- Öğrenci ve koçlara net görselleştirmeler ve otomatik öneriler sunmak.

## Özellikler
- Hedeflere, geçmiş performansa ve kullanılabilir zamana göre kişiselleştirilmiş çalışma planı oluşturma.
- Zamanlanmış çalışma oturumları ve hatırlatmalar (günlük/haftalık).
- YKS koşullarını taklit eden zamanlı tam/kısmi sınav simülasyonları.
- Konu ve alt konu bazında otomatik güçlü/zayıf yön tespiti.
- AI destekli soru önerileri ve çözüm açıklamaları.
- Grafiklerle desteklenen ilerleme panoları ve geçmiş karşılaştırmalar.
- Koç modu: mentorlar için plan atama, ilerlemeyi inceleme ve geri bildirim bırakma.
- PDF/CSV olarak dışa aktarılabilen raporlar.
- Rol tabanlı erişim kontrolü (öğrenci, koç, admin).
- Entegrasyonlar: e-posta/push bildirimleri, takvim senkronizasyonu ve opsiyonel harici AI sağlayıcıları.

## Teknoloji Yığını
(Projeye göre özelleştirin — repo TypeScript ağırlıklıdır)
- Dil: TypeScript
- Sunucu: Node.js (Express / NestJS / benzeri)
- İstemci: React / Next.js (TypeScript)
- Veritabanı: PostgreSQL veya MongoDB
- ORM: Prisma / TypeORM / Mongoose
- Önbellek/Kuyruk: Redis
- Yapay Zeka / LLM: OpenAI veya uyumlu modeller (API aracılığıyla)
- Konteynerleme: Docker & Docker Compose
- CI/CD: GitHub Actions (önerilir)
- Test: Jest / Vitest + React Testing Library

## Proje Yapısı ve Mimarisi (örnek)
- /apps
  - /api — backend servis (REST / GraphQL)
  - /web — frontend (SPA / SSR)
- /packages — paylaşılan kütüphaneler (types, utils, ui)
- /infra — Docker, deployment manifestleri, infra-as-code
- /scripts — helper scriptler (seed, migrations, testler)

Backend, planlama, sınavlar, kullanıcı yönetimi ve analizler için kimlik doğrulamalı API'ler sunar. AI motoru bir servis olarak kullanılır: istekler temizlenir/sınırlanır ve yalnızca gerekli veriler üçüncü taraf modellere gönderilir.

## Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ ve npm veya Yarn
- Docker (opsiyonel, geliştirme için önerilir)
- PostgreSQL veya MongoDB örneği (lokal veya bulut)

### Kurulum
1. Depoyu klonlayın:
   git clone https://github.com/TheSrScwarenter/KARNE.git
2. Klasöre girin:
   cd KARNE
3. Bağımlılıkları yükleyin:
   npm install
   veya
   yarn install

### Ortam Değişkenleri
Bir `.env` dosyası oluşturun (veya frontend için `.env.local`) en az şu değerlerle:

```
# Uygulama
PORT=3000
NODE_ENV=development

# Veritabanı
DATABASE_URL=postgres://user:password@localhost:5432/karne_db

# Kimlik doğrulama
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI Sağlayıcı
OPENAI_API_KEY=sk-...

# Redis (opsiyonel)
REDIS_URL=redis://localhost:6379

# E-posta / Bildirimler
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
```

Değerleri ortamınıza göre ayarlayın. Repo içinde `.env.example` varsa onu kopyalayarak başlayın.

### Çalıştırma
Geliştirme:

npm run dev
veya

yarn dev

Üretim için build & run:

npm run build
npm start

(Package.json içindeki script isimlerini kontrol edip README'i gerektiğinde güncelleyin.)

## Proje Nasıl Çalışır (Yüksek Seviye)
1. Kayıt & Profil: Öğrenci çalışma saatleri, hedef puan/tercihler ve başlangıç test sonuçlarını girer.
2. Değerlendirme: Sistem geçmiş testleri analiz ederek güçlü/zayıf konuları tespit eder.
3. Plan Oluşturma: AI + kural tabanlı yaklaşımla önceliklendirilmiş, zaman-bazlı çalışma planı üretilir.
4. Uygulama: Öğrenci atanan oturumları takip eder, soruları çözer ve simülasyonlar gerçekleştirir.
5. Geri Besleme Döngüsü: Sonuçlar yeniden sisteme alınır ve plan zayıf konulara göre güncellenir.
6. Raporlama: Panolar ve raporlar ilerleme trendlerini ve öngörüleri gösterir.

## Geliştirme
- Kod standartları: TypeScript strict mode, ESLint, Prettier.
- Branching: feature/*, fix/*, chore/*
- Commit mesajları: Conventional Commits önerilir.
- Lokal geliştirme: Docker Compose kullanın (sağlanmışsa) veya servisleri lokal çalıştırın.
- Yeni özellikler için kapsamlı testler ekleyin (birim + entegrasyon).

## Testler
- Birim testleri: jest/vitest
- Entegrasyon testleri: test veritabanı veya test konteynerleri kullanın
- E2E: Playwright / Cypress (opsiyonel)

Testleri çalıştırmak için:

npm test
veya

yarn test

## Dağıtım (Deployment)
- Servisleri Docker ile konteynerleştirin.
- CI (GitHub Actions) ile testleri çalıştırıp imajları build edin ve deploy edin.
- Frontend Vercel/Netlify, backend Heroku/DigitalOcean/AWS/GCP gibi platformlara dağıtılabilir.
- Gizli anahtarları ortam değişkenleri veya secret managerlarda saklayın.

## Güvenlik ve Gizlilik
- Öğrenci verileri hassastır. Gerekli yerlerde veriyi şifreleyin ve veri transferinde TLS kullanın.
- Üçüncü taraf AI API'lerine gönderilen verileri minimize edin; mümkünse anonimleştirin ve kullanıcı onayı alın.
- Rate limit ve input validation uygulayın.
- Düzenli olarak secret rotasyonu ve erişim denetimi gerçekleştirin.

## Katkıda Bulunma
Katkılar memnuniyetle karşılanır:
1. Depoyu fork edin.
2. Yeni bir branch oluşturun: git checkout -b feature/your-feature
3. Değişiklikleri yapın, test ve dokümantasyon ekleyin.
4. Push edip Pull Request açın; değişiklikleri ve test adımlarını açıklayın.

Kod stiline uyun ve yeni davranışlar için test ekleyin.

## Lisans
Repo içinde LICENSE dosyasını kontrol edin. Eğer yoksa MIT gibi bir açık kaynak lisansı eklemeyi düşünebilirsiniz.

## İletişim
Proje sahibi: TheSrScwarenter
Repo: https://github.com/TheSrScwarenter/KARNE

Teşekkürler — katkılar, hata raporları ve özellik talepleri için açığım.
