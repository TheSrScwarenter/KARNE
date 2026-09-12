import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Copy,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { UserAccount } from '../../lib/usersService';

interface AdminCoachesTabProps {
  users: UserAccount[];
  onAssignCoach: (studentId: string, coachId: string) => Promise<void>;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

export const AdminCoachesTab: React.FC<AdminCoachesTabProps> = ({
  users,
  onAssignCoach,
  showSuccess,
  showError,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<{ code: string; createdAt: string; role: string }[]>([
    { code: 'STUDII-KOC-2026', createdAt: new Date().toLocaleDateString('tr-TR'), role: 'Baş Koç' },
    { code: 'YKS-REHBER-A1', createdAt: new Date().toLocaleDateString('tr-TR'), role: 'Branş Koçu' },
  ]);

  const [selectedStudentToTransfer, setSelectedStudentToTransfer] = useState<UserAccount | null>(null);
  const [targetCoachId, setTargetCoachId] = useState<string>('');

  const coaches = users.filter((u) => u.role === 'coach');
  const students = users.filter((u) => u.role === 'student');

  // Map students to coaches
  const coachStudentsMap = new Map<string, UserAccount[]>();
  coaches.forEach((c) => {
    coachStudentsMap.set(
      c.id,
      students.filter((s) => s.assigned_coach_id === c.id || (s as any).assignedCoachId === c.id)
    );
  });

  const unassignedStudents = students.filter((s) => !s.assigned_coach_id && !(s as any).assignedCoachId);

  const generateNewCoachCode = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `STUDII-KOC-${randomSuffix}`;
    setGeneratedCodes((prev) => [
      { code: newCode, createdAt: new Date().toLocaleDateString('tr-TR'), role: 'Koç Katılım Kodu' },
      ...prev,
    ]);
    showSuccess(`Yeni koç katılım kodu üretildi: ${newCode}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showSuccess('Kod panoya kopyalandı!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTransferStudent = async () => {
    if (!selectedStudentToTransfer || !targetCoachId) {
      showError('Lütfen atanacak koçu seçiniz.');
      return;
    }
    try {
      await onAssignCoach(selectedStudentToTransfer.id, targetCoachId);
      showSuccess(`${selectedStudentToTransfer.full_name || 'Öğrenci'} öğrencisinin koç ataması güncellendi.`);
      setSelectedStudentToTransfer(null);
      setTargetCoachId('');
    } catch (e: any) {
      showError('Atama güncellenirken hata oluştu: ' + (e.message || 'Bilinmeyen'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-[#1B2A4A]">Koçluk Ağı & Öğrenci Dağılım Masası</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#255A8A] text-white">
                {coaches.length} Aktif Koç
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D97736]/10 text-[#D97736] border border-[#D97736]/20">
                {unassignedStudents.length} Koç Bekleyen Öğrenci
              </span>
            </div>
            <p className="text-xs text-[#4A5B78] mt-1">
              Koçların öğrenci yükünü izleyin, öğrencileri koçlar arasında transfer edin ve yeni koç kayıt kodları oluşturun.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateNewCoachCode}
          className="py-2.5 px-4 bg-[#255A8A] hover:bg-[#1E486E] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Yeni Koç Kodu Üret</span>
        </button>
      </div>

      {/* Unassigned Students Alert (if any) */}
      {unassignedStudents.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D97736] text-white flex items-center justify-center font-bold text-xs">
              {unassignedStudents.length}
            </div>
            <div>
              <p className="text-xs font-bold text-[#1B2A4A]">
                Koçu henüz atanmamış {unassignedStudents.length} öğrenci bulunuyor
              </p>
              <p className="text-[11px] text-[#7E8D9F]">
                Öğrencilerin koçluk masasına bağlanabilmesi için aşağıdan bir koça eşleştirebilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {unassignedStudents.slice(0, 3).map((stu) => (
              <button
                key={stu.id}
                type="button"
                onClick={() => {
                  setSelectedStudentToTransfer(stu);
                  setTargetCoachId(coaches[0]?.id || '');
                }}
                className="py-1 px-2.5 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 text-[11px] font-bold text-[#1B2A4A] transition-colors cursor-pointer"
              >
                {stu.full_name || 'Öğrenci'} + Ata
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coaches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coaches.map((coach) => {
          const assignedList = coachStudentsMap.get(coach.id) || [];
          const coachName = coach.full_name || 'Koç';
          const coachInitial = coachName ? coachName.charAt(0).toUpperCase() : 'K';
          return (
            <div
              key={coach.id}
              className="bg-white rounded-3xl border border-[#DFD9CC] p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Coach Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#DFD9CC]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#255A8A]/10 text-[#255A8A] flex items-center justify-center font-bold text-sm">
                      {coachInitial}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#1B2A4A]">{coachName}</h4>
                      <p className="text-[11px] text-[#7E8D9F]">{coach.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#255A8A]/10 text-[#255A8A]">
                    {assignedList.length} Öğrenci
                  </span>
                </div>

                {/* Assigned Students List */}
                <div className="pt-3 space-y-2">
                  <p className="text-[11px] font-bold text-[#7E8D9F] uppercase tracking-wider">
                    Sorumlu Olduğu Öğrenciler:
                  </p>

                  {assignedList.length === 0 ? (
                    <p className="text-xs text-[#7E8D9F] italic py-2">Henüz öğrenci atanmadı.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
                      {assignedList.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] transition-colors text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#1B2A4A]">{st.full_name || 'İsimsiz'}</span>
                            <span className="text-[10px] text-[#7E8D9F] ml-1.5 font-mono">
                              ({st.field || 'SAY'})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentToTransfer(st);
                              setTargetCoachId(coach.id);
                            }}
                            className="text-[10px] font-bold text-[#255A8A] hover:underline cursor-pointer"
                          >
                            Transfer Et
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-[#DFD9CC]">
                <button
                  type="button"
                  onClick={() => {
                    if (unassignedStudents.length > 0) {
                      setSelectedStudentToTransfer(unassignedStudents[0]);
                      setTargetCoachId(coach.id);
                    } else if (students.length > 0) {
                      setSelectedStudentToTransfer(students[0]);
                      setTargetCoachId(coach.id);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-xs font-bold text-[#1B2A4A] transition-colors border border-[#DFD9CC] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#255A8A]" />
                  <span>Öğrenci Ata</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coach Invite Codes Section */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DFD9CC] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-[#1B2A4A]">Koçluk Kayıt & Davet Kodları</h4>
            <p className="text-xs text-[#7E8D9F]">
              Yeni koçların kayıt formunda kullanarak doğrudan koç yetkisi alabileceği tek kullanımlık/özel anahtarlar.
            </p>
          </div>
          <button
            type="button"
            onClick={generateNewCoachCode}
            className="py-1.5 px-3 rounded-xl bg-[#F7F4EE] hover:bg-[#EFEBE0] text-xs font-bold text-[#1B2A4A] border border-[#DFD9CC] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#255A8A]" />
            <span>Kod Üret</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {generatedCodes.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-[#F7F4EE] rounded-2xl border border-[#DFD9CC] flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-xs font-black text-[#1B2A4A] tracking-wider">
                  {item.code}
                </span>
                <p className="text-[10px] text-[#7E8D9F] mt-0.5">
                  {item.role} • {item.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(item.code)}
                className="p-1.5 rounded-lg hover:bg-white text-[#1B2A4A] transition-colors cursor-pointer"
                title="Kodu Kopyala"
              >
                {copiedCode === item.code ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2E6B4F]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#7E8D9F]" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer / Assign Modal */}
      {selectedStudentToTransfer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DFD9CC] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-black text-[#1B2A4A]">Öğrenci Koç Ataması</h3>
            <p className="text-xs text-[#4A5B78]">
              <strong>{selectedStudentToTransfer.full_name || 'Öğrenci'}</strong> isimli öğrencinin sorumlu koçunu belirleyin:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1B2A4A]">Hedef Koç:</label>
              <select
                value={targetCoachId}
                onChange={(e) => setTargetCoachId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F7F4EE] border border-[#DFD9CC] text-xs font-bold text-[#1B2A4A]"
              >
                <option value="">Seçiniz...</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || 'Koç'} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DFD9CC]">
              <button
                type="button"
                onClick={() => setSelectedStudentToTransfer(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-[#4A5B78] hover:bg-[#F7F4EE] cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleTransferStudent}
                className="py-2 px-5 bg-[#255A8A] hover:bg-[#1E486E] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Atamayı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
