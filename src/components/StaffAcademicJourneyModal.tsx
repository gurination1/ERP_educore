import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StaffAcademicJourney, User } from '../types';

interface StaffAcademicJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const StaffAcademicJourneyModal: React.FC<StaffAcademicJourneyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [journeys, setJourneys] = useState<StaffAcademicJourney[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [qualificationLevel, setQualificationLevel] = useState<'PhD' | 'PostDoc' | 'M.Tech' | 'M.Sc' | 'MBA' | 'B.Tech' | 'B.Sc'>('PhD');
  const [degreeName, setDegreeName] = useState('');
  const [awardingUniversity, setAwardingUniversity] = useState('');
  const [yearOfPassing, setYearOfPassing] = useState(new Date().getFullYear() - 3);
  const [specialization, setSpecialization] = useState('');
  const [scopusPubs, setScopusPubs] = useState(0);
  const [sciPubs, setSciPubs] = useState(0);
  const [patents, setPatents] = useState(0);
  const [pastInstitutions, setPastInstitutions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJourneys = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStaffAcademicJourney();
      if (res.success && res.academicJourneys) {
        setJourneys(res.academicJourneys);
      }
    } catch (e) {
      console.error('Failed to load academic journeys:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJourneys();
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const res = await api.addStaffAcademicJourney(currentUser.id, {
        qualification_level: qualificationLevel,
        degree_name: degreeName,
        awarding_university: awardingUniversity,
        year_of_passing: Number(yearOfPassing),
        specialization,
        scopus_publications: Number(scopusPubs),
        sci_publications: Number(sciPubs),
        patents_count: Number(patents),
        past_institutions_summary: pastInstitutions,
        verified: currentUser.role === 'admin' || currentUser.role === 'super_admin',
      });
      if (res.success) {
        setShowAddForm(false);
        setDegreeName('');
        setAwardingUniversity('');
        setSpecialization('');
        fetchJourneys();
      }
    } catch (err) {
      console.error('Failed to add academic journey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] shadow-2xl border border-[#e1e3e4] flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00236f] text-white flex items-center justify-center shadow-sm">
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#191c1d]">Staff Academic Journey & Research R&D Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  SCOPUS / SCI INDEXED
                </span>
              </div>
              <p className="text-xs text-[#757682]">
                Faculty doctoral qualifications, journal citations, patents, and institutional service books.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#757682] hover:bg-[#e1e3e4] hover:text-[#191c1d] transition-all cursor-pointer"
          >
            <span className="font-bold text-[10px]">✕</span>
          </button>
        </div>

        {/* Action strip */}
        <div className="px-6 py-3 border-b border-[#e1e3e4] bg-white flex items-center justify-between">
          <div className="text-xs font-bold text-[#444651]">
            Total Documented Faculty Journeys: {journeys.length}
          </div>
          {(currentUser?.role === 'staff' || currentUser?.role === 'hod' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
            >
              
              <span>{showAddForm ? 'Cancel Entry' : 'Record Academic Degree / Patent'}</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fbfbfc] space-y-4">
          {showAddForm && (
            <form onSubmit={handleAdd} className="p-4 bg-white border border-[#e1e3e4] rounded-xl shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-sm text-[#00236f] flex items-center gap-1.5">
                
                Record New Academic Degree or Research Milestone
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Qualification Level</label>
                  <select
                    value={qualificationLevel}
                    onChange={e => setQualificationLevel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  >
                    <option value="PhD">Doctor of Philosophy (PhD)</option>
                    <option value="PostDoc">Post-Doctoral Fellowship</option>
                    <option value="M.Tech">Master of Technology (M.Tech)</option>
                    <option value="M.Sc">Master of Science (M.Sc)</option>
                    <option value="MBA">MBA</option>
                    <option value="B.Tech">B.Tech</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-[#191c1d] mb-1">Degree Title</label>
                  <input
                    type="text"
                    required
                    value={degreeName}
                    onChange={e => setDegreeName(e.target.value)}
                    placeholder="e.g. PhD in Distributed Cloud Systems & Microservices"
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Awarding University</label>
                  <input
                    type="text"
                    required
                    value={awardingUniversity}
                    onChange={e => setAwardingUniversity(e.target.value)}
                    placeholder="e.g. MRSPTU Bathinda / IIT Roorkee"
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Year of Passing</label>
                  <input
                    type="number"
                    required
                    value={yearOfPassing}
                    onChange={e => setYearOfPassing(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder="e.g. High Performance Cloud Computing"
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Scopus Indexed Papers</label>
                  <input
                    type="number"
                    min="0"
                    value={scopusPubs}
                    onChange={e => setScopusPubs(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">SCI / Web of Science Papers</label>
                  <input
                    type="number"
                    min="0"
                    value={sciPubs}
                    onChange={e => setSciPubs(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191c1d] mb-1">Patents Awarded / Published</label>
                  <input
                    type="number"
                    min="0"
                    value={patents}
                    onChange={e => setPatents(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block font-bold text-[#191c1d] mb-1">Past Institutional Service Book</label>
                  <input
                    type="text"
                    value={pastInstitutions}
                    onChange={e => setPastInstitutions(e.target.value)}
                    placeholder="e.g. Assistant Professor at GNDU Amritsar (2016-2021)"
                    className="w-full px-2.5 py-1.5 border border-[#e1e3e4] rounded-lg bg-[#f8f9fa]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 border border-[#e1e3e4] rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#00236f] text-white font-bold rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Qualification'}
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-xs text-[#757682]">
              Loading faculty academic records...
            </div>
          ) : journeys.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-xs text-[#757682] space-y-2">
              
              <p>No faculty academic journey records yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journeys.map(j => (
                <div
                  key={j.id}
                  className="p-4 bg-white border border-[#e1e3e4] rounded-xl shadow-xs space-y-2.5 hover:border-[#00236f]/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                          {j.qualification_level}
                        </span>
                        <h4 className="font-bold text-sm text-[#191c1d]">{j.staff_name}</h4>
                      </div>
                      <p className="text-xs font-semibold text-[#00236f] mt-1">{j.degree_name}</p>
                    </div>
                    {j.verified && (
                      <span className="font-bold text-[10px]">✓</span>
                    )}
                  </div>

                  <div className="text-xs text-[#444651] space-y-1">
                    <p><span className="font-bold">Awarding University:</span> {j.awarding_university} ({j.year_of_passing})</p>
                    <p><span className="font-bold">Specialization:</span> {j.specialization}</p>
                    {j.past_institutions_summary && (
                      <p className="text-[#757682] italic text-[11px]">
                        Service Record: {j.past_institutions_summary}
                      </p>
                    )}
                  </div>

                  {/* Research Metrics Strip */}
                  <div className="pt-2 border-t border-[#f1f3f4] grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 bg-[#f8f9fa] rounded-lg">
                      <div className="font-bold text-[#00236f]">{j.scopus_publications}</div>
                      <div className="text-[10px] text-[#757682]">Scopus Papers</div>
                    </div>
                    <div className="p-1.5 bg-[#f8f9fa] rounded-lg">
                      <div className="font-bold text-[#00236f]">{j.sci_publications}</div>
                      <div className="text-[10px] text-[#757682]">SCI Indexed</div>
                    </div>
                    <div className="p-1.5 bg-[#f8f9fa] rounded-lg">
                      <div className="font-bold text-purple-700">{j.patents_count}</div>
                      <div className="text-[10px] text-[#757682]">Patents</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between text-xs text-[#757682]">
          <span>Faculty Academic Matrix</span>
          <span>Aligned with NIRF & NAAC Criteria 3.4 (Research Publications & Awards)</span>
        </div>
      </div>
    </div>
  );
};
