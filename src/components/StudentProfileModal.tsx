import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StudentProfile } from '../types';

interface StudentProfileModalProps {
  student: StudentProfile;
  onClose: () => void;
  onPayFee: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onPayFee,
}) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getStudentProfile(student.id).then(res => {
      if (res.success) {
        setProfileData(res.student);
      }
      setIsLoading(false);
    });
  }, [student.id]);

  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-5 my-6 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-[#f3f4f5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00236f] text-white flex items-center justify-center font-bold text-base">
              {student.first_name[0]}
              {student.last_name[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#191c1d]">{fullName}</h3>
              <p className="text-xs font-semibold text-[#00236f]">{student.student_id}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#757682] hover:text-[#191c1d]">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {isLoading ? (
          <p className="text-center py-8 text-xs text-[#757682]">Loading student records...</p>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#f8f9fa] rounded-xl border border-[#edeeef]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Course
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block">
                  {student.course?.name || student.course?.code || 'B.Tech'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Current Semester
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block">
                  Semester {student.current_semester}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Session
                </span>
                <span className="font-bold text-[#191c1d] mt-0.5 block">
                  {student.session?.name || '2025-26'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Email
                </span>
                <span className="font-medium text-[#191c1d] mt-0.5 block truncate">
                  {student.email}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Phone
                </span>
                <span className="font-medium text-[#191c1d] mt-0.5 block">{student.phone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#757682] block">
                  Fees Status
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    student.fees_status === 'paid'
                      ? 'bg-[#86f2e4]/40 text-[#006a61]'
                      : student.fees_status === 'due'
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}
                >
                  {student.fees_status}
                </span>
              </div>
            </div>

            {/* Guardian Info */}
            <div className="p-3 bg-[#ffffff] rounded-lg border border-[#e1e3e4]">
              <span className="font-bold text-[#191c1d] block mb-1">Guardian Contact:</span>
              <p className="text-[#444651]">
                {student.guardian_name} ({student.guardian_relation}) • {student.guardian_phone}
              </p>
            </div>

            {/* Fee Items Table */}
            <div>
              <h4 className="font-bold text-[#191c1d] mb-2 uppercase text-[11px] tracking-wider text-[#757682]">
                Assessed Fee Heads
              </h4>
              <div className="border border-[#e1e3e4] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8f9fa] border-b border-[#e1e3e4] text-[10px] text-[#757682] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Head</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Paid</th>
                      <th className="py-2 px-3">Due</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f5]">
                    {profileData?.fees?.map((f: any) => (
                      <tr key={f.id}>
                        <td className="py-2 px-3 font-semibold text-[#191c1d]">
                          {f.fee_head?.title || 'Academic Fee'}
                        </td>
                        <td className="py-2 px-3 font-semibold">₹ {f.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-[#006a61]">₹ {f.paid_amount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-[#ba1a1a] font-bold">
                          ₹ {f.due_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 uppercase font-bold text-[10px]">
                          {f.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#e1e3e4] rounded-lg font-semibold hover:bg-[#f8f9fa]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onPayFee(student.id);
                }}
                className="px-5 py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-lg"
              >
                Record Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
