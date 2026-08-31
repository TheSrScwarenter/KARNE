-- ==============================================================================
-- KARNE - YKS ÇALIŞMA TAKİP PLATFORMU
-- MIGRATION 0002: Add weekly_target_minutes to users_profile
-- FAZ 3/6: Çalışma Saati Logu Modülü
-- ==============================================================================

ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS weekly_target_minutes int DEFAULT 1800; -- Varsayılan 30 saat (1800 dakika)
