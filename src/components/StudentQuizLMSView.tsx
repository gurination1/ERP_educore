import React, { useState, useEffect } from 'react';
import { User, LMSQuiz } from '../types';

interface StudentQuizLMSViewProps {
  currentUser: User | null;
}

const SAMPLE_QUIZZES: LMSQuiz[] = [
  {
    id: 'quiz-cs401',
    title: 'University Mid-Term Assessment: Design & Analysis of Algorithms',
    courseCode: 'BTCS-401-18',
    semester: 4,
    durationMinutes: 15,
    totalMarks: 30,
    passingMarks: 12,
    instructions: [
      'Each question carries specified marks. Negative marking of 0.25 marks applies for incorrect choices.',
      'Do not switch tabs during examination session; violations are flagged to proctoring log.',
      'Scores are automatically converted into CBCS Internal Assessment (30% weightage).',
    ],
    questions: [
      {
        id: 'q1',
        question: 'What is the tightest asymptotic upper bound (Big-O) for the worst-case time complexity of QuickSort when the pivot is chosen as the first element?',
        options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
        correctAnswer: 1,
        explanation: 'In the worst case (e.g. sorted array with first element as pivot), partition yields unbalanced subproblems of size 0 and n-1, resulting in O(n²) time complexity.',
        marks: 5,
      },
      {
        id: 'q2',
        question: 'Which algorithmic paradigm does Dijkstra’s Single-Source Shortest Path algorithm adhere to?',
        options: ['Dynamic Programming', 'Divide and Conquer', 'Greedy Method', 'Branch and Bound'],
        correctAnswer: 2,
        explanation: 'Dijkstra’s algorithm greedily chooses the unvisited vertex with the minimum tentative distance at each step.',
        marks: 5,
      },
      {
        id: 'q3',
        question: 'What is the space complexity of Floyd-Warshall All-Pairs Shortest Path algorithm for a graph with V vertices?',
        options: ['O(V)', 'O(V²)', 'O(V³)', 'O(E log V)'],
        correctAnswer: 1,
        explanation: 'Floyd-Warshall maintains a distance matrix of size V × V, requiring O(V²) space complexity.',
        marks: 5,
      },
      {
        id: 'q4',
        question: 'Under the Master Theorem, what is the solution to T(n) = 2T(n/2) + O(n)?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)'],
        correctAnswer: 1,
        explanation: 'Here a = 2, b = 2, f(n) = n. Since log_b(a) = log_2(2) = 1, and f(n) = Θ(n^1), Case 2 applies, giving T(n) = Θ(n log n).',
        marks: 5,
      },
      {
        id: 'q5',
        question: 'Which of the following problems is proven to be NP-Complete in computational complexity theory?',
        options: ['Shortest Path Problem', 'Minimum Spanning Tree (Prim)', '0/1 Knapsack Problem', 'Eulerian Circuit'],
        correctAnswer: 2,
        explanation: 'The 0/1 Knapsack decision problem is NP-Complete (weakly NP-hard, solvable in pseudo-polynomial time via dynamic programming).',
        marks: 5,
      },
      {
        id: 'q6',
        question: 'In Huffman Coding, what type of prefix tree structure is constructed for optimal symbol compression?',
        options: ['Full binary tree where every internal node has 2 children', 'Red-Black self-balancing tree', 'B-Tree of order 3', 'Max-Heap with root as lowest frequency'],
        correctAnswer: 0,
        explanation: 'Huffman codes produce a full binary tree where every internal non-leaf node has strictly two children.',
        marks: 5,
      },
    ],
  },
  {
    id: 'quiz-cs502',
    title: 'Cloud Computing & Distributed Systems Quiz',
    courseCode: 'BTCS-502-18',
    semester: 5,
    durationMinutes: 10,
    totalMarks: 20,
    passingMarks: 8,
    instructions: [
      'CAP Theorem, Consensus protocols (Raft/Paxos), and Docker Containerization principles.',
      'Timer begins upon clicking "Start Quiz Session".',
    ],
    questions: [
      {
        id: 'qc1',
        question: 'According to Brewer’s CAP theorem, which property MUST be sacrificed in a distributed system during a network partition (P)?',
        options: ['Either Consistency (C) or Availability (A)', 'Network Latency', 'Data Durability', 'Security / TLS Encryption'],
        correctAnswer: 0,
        explanation: 'Under network partitions, a distributed system must choose between serving stale/unavailable data (A) or refusing requests to maintain identical state (C).',
        marks: 5,
      },
      {
        id: 'qc2',
        question: 'In the Raft Consensus Protocol, what is the role of the Leader Heartbeat interval?',
        options: ['To re-encrypt client credentials', 'To prevent follower election timeouts', 'To execute garbage collection', 'To compact SQLite tables'],
        correctAnswer: 1,
        explanation: 'Heartbeat AppendEntries RPCs suppress follower election timers, maintaining the current leader’s authoritative term.',
        marks: 5,
      },
    ],
  },
];

const LMS_RESOURCES = [
  {
    id: 'res-01',
    title: 'University Scheme & Syllabus (B.Tech CSE Batch 2023-27)',
    subject: 'Academic Curriculum Ordinance',
    format: 'PDF (2.8 MB)',
    lecturer: 'University Academic Directorate',
    downloadUrl: '#',
  },
  {
    id: 'res-02',
    title: 'Unit 1-4 Complete Lecture Notes: Design & Analysis of Algorithms',
    subject: 'BTCS-401-18',
    format: 'PDF Slide Deck (14.2 MB)',
    lecturer: 'Prof. Sunita Rao (Dept of CSE)',
    downloadUrl: '#',
  },
  {
    id: 'res-03',
    title: 'Lab Manual: Advanced Data Structures in C++ / Java',
    subject: 'BTCS-403-18',
    format: 'Laboratory Handout (3.5 MB)',
    lecturer: 'Dept of CSE & IT Labs',
    downloadUrl: '#',
  },
  {
    id: 'res-04',
    title: 'NPTEL SWAYAM Video Lecture Links & Transcripts (Graph Algorithms)',
    subject: 'Algorithms MOOC',
    format: 'External Video Bookmarks',
    lecturer: 'IIT Madras / NPTEL Portal',
    downloadUrl: '#',
  },
];

export const StudentQuizLMSView: React.FC<StudentQuizLMSViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'lms_resources'>('quizzes');
  const [activeQuiz, setActiveQuiz] = useState<LMSQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);

  // Timer Effect
  useEffect(() => {
    if (!activeQuiz || isSubmitted) return;

    if (timeLeftSeconds <= 0) {
      handleSubmitQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, isSubmitted, timeLeftSeconds]);

  const handleStartQuiz = (quiz: LMSQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setQuizScore(null);
    setTimeLeftSeconds(quiz.durationMinutes * 60);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    let earnedMarks = 0;
    activeQuiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        earnedMarks += q.marks;
      }
    });
    const percentage = Math.round((earnedMarks / activeQuiz.totalMarks) * 100);
    const passed = earnedMarks >= activeQuiz.passingMarks;

    setQuizScore({
      score: earnedMarks,
      total: activeQuiz.totalMarks,
      percentage,
      passed,
    });
    setIsSubmitted(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Sleek Action Toolbar - Navy/Orange Theme, Space Efficient */}
      <div className="bg-white border border-[#e1e3e4] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-black text-[#00236f] tracking-tight">Student Quiz & LMS Learning Portal</h1>
          <p className="text-[10px] text-[#757682]">CBCS Continuous Assessment (CA) & University Courseware</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-[#f8f9fa] p-1 rounded-lg border border-[#e1e3e4]">
          <button
            onClick={() => { setActiveTab('quizzes'); setActiveQuiz(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quizzes'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            Online Quizzes ({SAMPLE_QUIZZES.length})
          </button>
          <button
            onClick={() => { setActiveTab('lms_resources'); setActiveQuiz(null); }}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lms_resources'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-[#757682] hover:text-[#191c1d]'
            }`}
          >
            LMS Courseware ({LMS_RESOURCES.length})
          </button>
        </div>
      </div>

      {/* QUIZ INTERFACE OR ROSTER */}
      {activeTab === 'quizzes' && (
        <>
          {activeQuiz ? (
            /* ACTIVE QUIZ RUNNER */
            <div className="space-y-6 animate-fadeIn">
              {/* Top Bar: Title + Timer + Action Buttons */}
              <div className="bg-white p-4 rounded-2xl border border-[#e1e3e4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#00236f] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {activeQuiz.courseCode} • Semester {activeQuiz.semester}
                  </span>
                  <h2 className="text-base font-black text-[#191c1d] mt-1">{activeQuiz.title}</h2>
                </div>

                <div className="flex items-center gap-3">
                  {!isSubmitted && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-mono text-sm font-bold shadow-xs">
                      
                      <span>{formatTimer(timeLeftSeconds)}</span>
                    </div>
                  )}

                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="font-bold text-[10px]">✓</span>
                      <span>Finish & Submit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Back to Quiz Roster
                    </button>
                  )}
                </div>
              </div>

              {/* Quiz Results Card (If Submitted) */}
              {isSubmitted && quizScore && (
                <div className={`p-6 rounded-2xl border shadow-md space-y-3 animate-fadeIn ${
                  quizScore.passed
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
                    : 'bg-gradient-to-r from-rose-50 to-amber-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black">
                        {quizScore.passed ? 'Assessment Passed Successfully!' : 'Needs Revision'}
                      </h3>
                      <p className="text-xs">
                        Statutory CBCS Internal Assessment Credit Synchronized.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-black">{quizScore.score} / {quizScore.total}</span>
                      <span className="block text-xs font-bold">({quizScore.percentage}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Quiz View: Questions + Palette */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Question Area */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-6">
                  {(() => {
                    const q = activeQuiz.questions[currentQuestionIndex];
                    const selectedIdx = selectedAnswers[q.id];
                    const isAnswered = selectedIdx !== undefined;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs border-b border-[#f3f4f5] pb-3">
                          <span className="font-bold text-[#757682]">
                            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                          </span>
                          <span className="font-mono font-bold text-[#00236f] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {q.marks} Marks
                          </span>
                        </div>

                        <p className="text-sm font-bold text-[#191c1d] leading-relaxed">
                          {q.question}
                        </p>

                        {/* Options Cards */}
                        <div className="space-y-2.5 pt-2">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selectedIdx === optIdx;
                            const isCorrect = q.correctAnswer === optIdx;

                            let optStyle = 'border-[#e1e3e4] bg-[#f8f9fa] hover:bg-white hover:border-[#00236f]/40';
                            if (isSubmitted) {
                              if (isCorrect) optStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold';
                              else if (isChosen && !isCorrect) optStyle = 'border-rose-500 bg-rose-50/70 text-rose-950';
                            } else if (isChosen) {
                              optStyle = 'border-[#00236f] bg-blue-50/50 text-[#00236f] shadow-xs font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${optStyle}`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                  isChosen
                                    ? 'bg-[#00236f] text-white border-[#00236f]'
                                    : 'border-[#c5c5d3] text-[#757682]'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="text-xs">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* If Submitted: Show Explanation */}
                        {isSubmitted && (
                          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-[#00236f] space-y-1">
                            <span className="font-bold flex items-center gap-1">
                              
                              <span>Examiner Answer Key & Explanation:</span>
                            </span>
                            <p className="text-[11px] leading-relaxed">{q.explanation}</p>
                          </div>
                        )}

                        {/* Question Pagination Controls */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#f3f4f5]">
                          <button
                            type="button"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="px-4 py-2 border border-[#e1e3e4] hover:bg-[#f8f9fa] rounded-lg text-xs font-bold text-[#444651] disabled:opacity-30 cursor-pointer flex items-center gap-1"
                          >
                            <span className="font-bold text-[10px]">←</span>
                            <span>Previous</span>
                          </button>

                          <button
                            type="button"
                            disabled={currentQuestionIndex === activeQuiz.questions.length - 1}
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="px-4 py-2 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-lg text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1"
                          >
                            <span>Next Question</span>
                            <span className="font-bold text-[10px]">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Question Navigator Palette */}
                <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                    Question Palette
                  </h3>

                  <div className="grid grid-cols-4 gap-2">
                    {activeQuiz.questions.map((q, qIdx) => {
                      const isCurrent = currentQuestionIndex === qIdx;
                      const isAnswered = selectedAnswers[q.id] !== undefined;

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(qIdx)}
                          className={`w-full py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#00236f] text-white border-[#00236f]'
                              : isAnswered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-[#f8f9fa] text-[#757682] border-[#e1e3e4] hover:bg-[#eceef0]'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#f3f4f5] text-[10px] space-y-1 text-[#757682]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Answered ({Object.keys(selectedAnswers).length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f8f9fa] border border-[#e1e3e4]"></span>
                      <span>Remaining ({activeQuiz.questions.length - Object.keys(selectedAnswers).length})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* QUIZ CATALOGUE ROSTER */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {SAMPLE_QUIZZES.map(quiz => (
                <div
                  key={quiz.id}
                  className="bg-white p-6 rounded-2xl border border-[#e1e3e4] hover:border-[#00236f]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-[#00236f] px-2.5 py-0.5 rounded-full border border-blue-200">
                        {quiz.courseCode} • Sem {quiz.semester}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {quiz.totalMarks} Total Marks
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#191c1d]">{quiz.title}</h3>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                      <div>
                        <span className="text-[10px] text-[#757682] block">Duration</span>
                        <strong className="text-[#191c1d]">{quiz.durationMinutes} Mins</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#757682] block">Questions</span>
                        <strong className="text-[#191c1d]">{quiz.questions.length} Items</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#757682] block">Pass Mark</span>
                        <strong className="text-emerald-700">{quiz.passingMarks}</strong>
                      </div>
                    </div>

                    <ul className="text-[11px] text-[#757682] space-y-1 list-disc pl-4">
                      {quiz.instructions.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full py-2.5 bg-[#00236f] hover:bg-[#1a4bb0] text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    
                    <span>Start Online Assessment</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* LMS COURSEWARE TAB */}
      {activeTab === 'lms_resources' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-xs flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#191c1d]">University Curriculum & Lecture Notes Repository</h2>
            <span className="text-xs text-[#757682] font-mono">B.Tech Computer Science & Engineering</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LMS_RESOURCES.map(res => (
              <div
                key={res.id}
                className="bg-white p-5 rounded-2xl border border-[#e1e3e4] hover:border-[#00236f]/40 transition-all shadow-xs flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                    
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#191c1d]">{res.title}</h3>
                    <p className="text-[11px] text-[#00236f] font-semibold mt-0.5">{res.subject}</p>
                    <p className="text-[10px] text-[#757682] mt-0.5">Faculty: {res.lecturer} • {res.format}</p>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Simulated downloading: ${res.title}`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <span className="font-bold text-[10px]">[DL]</span>
                  <span>Get PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
