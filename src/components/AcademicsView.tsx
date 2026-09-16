import React, { useState } from 'react';
import { User } from '../types';

interface AcademicsViewProps {
  currentUser: User | null;
}

interface SyllabusUnit {
  unitNo: string;
  title: string;
  hours: number;
  topics: string[];
}

interface CourseItem {
  id: string;
  code: string;
  title: string;
  department: string;
  semester: number;
  credits: number;
  ltp: string; // e.g. 3-1-0
  instructor: string;
  description: string;
  units: SyllabusUnit[];
  textbooks: string[];
}

const COURSES: CourseItem[] = [
  {
    id: 'crs-cs401',
    code: 'CS-401',
    title: 'Distributed Cloud Architecture & Microservices',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-1-0',
    instructor: 'Prof. Sunita Rao (Assistant Professor)',
    description: 'Covers principles of cloud architecture, distributed consensus, container orchestration, microservice communication patterns, and resilient distributed data systems.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Cloud Foundations & Virtualization',
        hours: 10,
        topics: [
          'Cloud computing deployment models: Public, Private, Hybrid & Multi-Cloud',
          'Virtualization technologies: Type-1 vs Type-2 Hypervisors, Containerization (Docker, cgroups, namespaces)',
          'Cloud service models: IaaS, PaaS, SaaS, and Serverless event-driven execution',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Distributed Systems & Consensus Protocols',
        hours: 12,
        topics: [
          'CAP theorem, PACELC theorem, and eventual consistency models',
          'Consensus algorithms: Raft, Paxos, and distributed leader election',
          'Vector clocks, Lamport timestamps, and distributed state coordination',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'Microservices & Inter-Service Communication',
        hours: 11,
        topics: [
          'Decomposing monoliths: Domain-Driven Design (DDD) bounded contexts',
          'RESTful APIs, gRPC protocol buffers, and GraphQL query federation',
          'API Gateways, circuit breakers, rate limiters, and distributed tracing (OpenTelemetry)',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'Resilient Cloud Storage & Orchestration',
        hours: 12,
        topics: [
          'Kubernetes architecture: Control plane, Pods, Deployments, Services, and Ingress controllers',
          'Distributed storage systems: Ceph, AWS S3 object storage, and sharded relational clusters',
          'Continuous deployment pipelines and infrastructure as code (IaC with Terraform)',
        ],
      },
    ],
    textbooks: [
      'Distributed Systems: Principles and Paradigms (3rd Edition) - Andrew S. Tanenbaum & Maarten Van Steen',
      'Designing Data-Intensive Applications - Martin Kleppmann',
      'Cloud Computing: Principles and Paradigms - Rajkumar Buyya, Christian Vecchiola',
    ],
  },
  {
    id: 'crs-cs402',
    code: 'CS-402',
    title: 'Advanced Relational DBMS & MariaDB Internals',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-0-2',
    instructor: 'Dr. Ramesh Chandra (Academic Provost)',
    description: 'In-depth study of storage engine architectures, B-tree indexes, ACID transaction isolation levels, write-ahead logging (WAL), query execution planners, and MariaDB replication.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Storage Engines & File Structures',
        hours: 10,
        topics: [
          'Relational database physical layout: Slotted pages, row records, and variable-length attributes',
          'Storage engines: InnoDB vs Aria vs MyISAM, memory buffering, and buffer pool eviction algorithms',
          'B+ Tree index organization, clustered vs secondary indexing, and composite search keys',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Advanced SQL & Query Processing',
        hours: 11,
        topics: [
          'Window functions, Common Table Expressions (CTEs), and recursive hierarchical queries',
          'Query parsing, logical plan rewriting, and cost-based physical plan generation',
          'Hash joins, merge joins, index nested loops, and query profiling (EXPLAIN ANALYZE)',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'Transaction Management & Concurrency',
        hours: 12,
        topics: [
          'ACID properties, Write-Ahead Logging (WAL), and ARIES recovery algorithm',
          'Multi-Version Concurrency Control (MVCC), snapshot isolation, and repeatable read anomalies',
          'Two-Phase Locking (2PL), deadlock detection, wait-for graphs, and timeout mitigation',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'Distributed DB & High Availability',
        hours: 12,
        topics: [
          'Galera Cluster synchronous multi-master replication in MariaDB',
          'Semi-synchronous replication, binlog positions, and GTID failover mechanics',
          'Horizontal table partitioning, sharding architectures, and distributed connection pooling',
        ],
      },
    ],
    textbooks: [
      'Database System Concepts (7th Edition) - Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      'High Performance MySQL / MariaDB (4th Edition) - Silvia Botros & Jeremy Tinley',
      'Database Management Systems - Raghu Ramakrishnan & Johannes Gehrke',
    ],
  },
  {
    id: 'crs-cs403',
    code: 'CS-403',
    title: 'Design & Analysis of Algorithms',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-1-0',
    instructor: 'Prof. K. Venkatesh',
    description: 'Rigorous algorithmic paradigms: divide and conquer, dynamic programming, greedy methods, amortized analysis, graph algorithms, and NP-completeness proofs.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Asymptotic Analysis & Recurrences',
        hours: 10,
        topics: [
          'Big-O, Big-Omega, Big-Theta notations and mathematical limits',
          'Solving recurrences: Master Theorem, recursion tree method, and substitution',
          'Amortized analysis: Aggregate method, accounting method, and potential method',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Divide-and-Conquer & Greedy Paradigms',
        hours: 11,
        topics: [
          'Strassen matrix multiplication, closest pair of points, and median finding in linear time',
          'Greedy choice property & optimal substructure: Huffman coding, fractional knapsack',
          'Minimum Spanning Trees: Kruskal and Prim algorithms with Disjoint Set Union (DSU)',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'Dynamic Programming & Graph Algorithms',
        hours: 12,
        topics: [
          'Matrix chain multiplication, 0/1 Knapsack, Longest Common Subsequence (LCS), and Bellman-Ford',
          'All-pairs shortest paths: Floyd-Warshall and Johnson algorithms',
          'Maximum network flow: Ford-Fulkerson method and Edmonds-Karp algorithm',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'Tractability & NP-Completeness',
        hours: 12,
        topics: [
          'Complexity classes: P, NP, NP-Hard, and NP-Complete',
          'Polynomial-time reductions: 3-SAT to Clique, Vertex Cover, and Hamiltonian Cycle',
          'Approximation algorithms: Traveling Salesperson Problem (TSP) and Vertex Cover 2-approximation',
        ],
      },
    ],
    textbooks: [
      'Introduction to Algorithms (CLRS 4th Edition) - Cormen, Leiserson, Rivest, Stein',
      'Algorithm Design - Jon Kleinberg & Éva Tardos',
    ],
  },
  {
    id: 'crs-cs404',
    code: 'CS-404',
    title: 'Operating Systems & Unix Kernel Programming',
    department: 'Computer Science & Engineering',
    semester: 4,
    credits: 4,
    ltp: '3-0-2',
    instructor: 'Prof. Ananya Sen',
    description: 'Process life-cycle, POSIX threads, semaphores, monitors, virtual memory paging, disk scheduling, and Linux kernel system call programming.',
    units: [
      {
        unitNo: 'Unit I',
        title: 'Process Management & Multithreading',
        hours: 10,
        topics: [
          'Process Control Block (PCB), context switching overhead, and fork/exec system calls',
          'CPU scheduling algorithms: CFS (Completely Fair Scheduler), Round Robin, Multi-level feedback queues',
          'POSIX threads (pthreads), user-level vs kernel-level threads, and race condition synchronization',
        ],
      },
      {
        unitNo: 'Unit II',
        title: 'Synchronization & Deadlocks',
        hours: 11,
        topics: [
          'Critical section problem, Peterson algorithm, mutex locks, counting semaphores, and condition variables',
          'Classical synchronization problems: Dining Philosophers, Readers-Writers, Producer-Consumer',
          'Deadlock characterization (Coffman conditions), Banker algorithm for avoidance, and recovery strategies',
        ],
      },
      {
        unitNo: 'Unit III',
        title: 'Memory Hierarchy & Virtual Memory',
        hours: 12,
        topics: [
          'Address binding, dynamic linking, logical vs physical address spaces, and Memory Management Unit (MMU)',
          'Paging: Page tables, Translation Lookaside Buffer (TLB), inverted page tables, and multi-level paging',
          'Page replacement algorithms: LRU, Clock algorithm, FIFO, and thrashing prevention through working set model',
        ],
      },
      {
        unitNo: 'Unit IV',
        title: 'File Systems & Linux I/O Architecture',
        hours: 12,
        topics: [
          'Virtual File System (VFS), Inodes, directory structures, and file allocation methods (Ext4)',
          'Disk scheduling algorithms: SCAN, C-SCAN, LOOK, and SSD wear-leveling controllers',
          'Linux kernel modules: Writing a character device driver and registering kernel interrupts',
        ],
      },
    ],
    textbooks: [
      'Operating System Concepts (10th Edition) - Silberschatz, Galvin, Gagne',
      'Modern Operating Systems (4th Edition) - Andrew S. Tanenbaum & Herbert Bos',
    ],
  },
];

export const AcademicsView: React.FC<AcademicsViewProps> = () => {
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadSyllabus = (course: CourseItem) => {
    const textContent = `
================================================================================
MAHARAJA RANJIT SINGH PUNJAB TECHNICAL UNIVERSITY (MRSPTU), BATHINDA
BABA FARID COLLEGE OF ENGINEERING & TECHNOLOGY (BFGI)
DEPARTMENT OF ${course.department.toUpperCase()}
OFFICIAL COURSE SYLLABUS & CURRICULUM SCHEME (CBCS 2025-26)
================================================================================

COURSE CODE: ${course.code}
COURSE TITLE: ${course.title}
SEMESTER: Semester ${course.semester}
CREDITS: ${course.credits} Credits (L-T-P: ${course.ltp})
COURSE INSTRUCTOR: ${course.instructor}

COURSE OVERVIEW:
${course.description}

--------------------------------------------------------------------------------
DETAILED SYLLABUS MODULES:
--------------------------------------------------------------------------------
${course.units
  .map(
    u => `
[${u.unitNo}: ${u.title}] (Contact Hours: ${u.hours})
${u.topics.map((t, idx) => `  ${idx + 1}. ${t}`).join('\n')}
`
  )
  .join('\n')}

--------------------------------------------------------------------------------
RECOMMENDED TEXTBOOKS & REFERENCE LITERATURE:
--------------------------------------------------------------------------------
${course.textbooks.map((b, idx) => `  [${idx + 1}] ${b}`).join('\n')}

--------------------------------------------------------------------------------
EVALUATION SCHEME (MRSPTU STATUTORY CRITERIA):
--------------------------------------------------------------------------------
  1. Internal Continuous Assessment: 60 Marks (Passing Cutoff: 24/60)
     - Mid-Semester Test 1 (MST-1): 24 Marks
     - Mid-Semester Test 2 (MST-2): 24 Marks
     - Continuous Lab / Assignments / Attendance: 12 Marks
  2. External End-Semester University Examination: 40 Marks (Passing Cutoff: 16/40)
  3. Minimum Attendance Requirement: 75% Mandatory (MRSPTU Ordinance 7.4)

Controller of Examinations & Academic Council
EduCore ERP • Institutional Record Generated on ${new Date().toISOString().slice(0, 10)}
================================================================================
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRSPTU_Syllabus_${course.code}_${new Date().getFullYear()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    setDownloadSuccess(`Official syllabus for ${course.code} downloaded successfully.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div id="academics-curriculum-screen" className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">
            Academics & Course Curriculum
          </h2>
          <p className="text-sm text-[#444651] mt-1">
            Maharaja Ranjit Singh Punjab Technical University (MRSPTU) Choice Based Credit System (CBCS)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 bg-[#86f2e4]/30 text-[#006a61] rounded-lg border border-[#86f2e4]">
            Academic Session 2025-26
          </span>
          <span className="text-xs font-bold px-3 py-1.5 bg-[#00236f]/10 text-[#00236f] rounded-lg">
            Semester 4 (Regular)
          </span>
        </div>
      </div>

      {/* Download Alert Toast */}
      {downloadSuccess && (
        <div className="p-3.5 bg-[#86f2e4]/20 border border-[#86f2e4] text-[#006a61] rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Academic Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
          <div className="flex items-center gap-2.5 text-[#00236f]">
            <span className="material-symbols-outlined text-[20px]">school</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Degree Program
            </h4>
          </div>
          <p className="text-base font-bold text-[#191c1d] mt-2">
            B.Tech Computer Science & Engg.
          </p>
          <span className="text-xs text-[#757682] mt-1 block">
            4-Year Full-Time • AICTE & MRSPTU Affiliated
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
          <div className="flex items-center gap-2.5 text-[#006a61]">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Evaluation Ratio
            </h4>
          </div>
          <p className="text-base font-bold text-[#191c1d] mt-2">
            60% Internal • 40% University
          </p>
          <span className="text-xs text-[#757682] mt-1 block">
            MST-1 (24) + MST-2 (24) + Assessment (12)
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-[#e1e3e4] shadow-xs">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[20px]">rule</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#757682]">
              Statutory Attendance Rule
            </h4>
          </div>
          <p className="text-base font-bold text-[#191c1d] mt-2">
            75% Mandatory Cutoff
          </p>
          <span className="text-xs text-[#757682] mt-1 block">
            MRSPTU Ordinance 7.4 Hall Ticket Requirement
          </span>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#191c1d]">
          Prescribed Theory & Practical Courses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {COURSES.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-[#e1e3e4] shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-[#00236f]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-[#dce1ff] text-[#00236f]">
                    {course.code}
                  </span>
                  <span className="text-xs font-bold text-[#757682]">
                    Credits: {course.credits} ({course.ltp})
                  </span>
                </div>

                <h4 className="text-lg font-bold text-[#191c1d] mt-3">
                  {course.title}
                </h4>

                <p className="text-xs text-[#757682] mt-1">
                  Instructor: {course.instructor}
                </p>

                <p className="text-xs text-[#444651] mt-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="mt-4 pt-3 border-t border-[#f3f4f5] flex flex-wrap gap-2 text-[11px] text-[#757682]">
                  <span className="bg-[#f8f9fa] px-2 py-1 rounded border border-[#edeeef]">
                    4 Units • 45 Lecture Hours
                  </span>
                  <span className="bg-[#f8f9fa] px-2 py-1 rounded border border-[#edeeef]">
                    MRSPTU CBCS Core Subject
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#f3f4f5] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(course)}
                  className="text-xs font-bold text-[#00236f] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Detailed Syllabus</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSyllabus(course)}
                  className="px-3 py-1.5 bg-[#f3f4f5] hover:bg-[#e1e3e4] text-[#191c1d] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>Download Syllabus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Syllabus Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e1e3e4] flex items-center justify-between bg-[#f8f9fa]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#00236f] text-white rounded text-xs font-bold">
                    {selectedCourse.code}
                  </span>
                  <span className="text-xs font-semibold text-[#757682]">
                    Credits: {selectedCourse.credits} (L-T-P: {selectedCourse.ltp})
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#191c1d] mt-1">
                  {selectedCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] hover:bg-[#edeeef] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-[#191c1d] text-sm uppercase tracking-wider text-[#757682] mb-1">
                  Course Synopsis
                </h4>
                <p className="text-[#444651] leading-relaxed">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Units Breakdown */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#191c1d] text-sm uppercase tracking-wider text-[#757682]">
                  Curriculum Modules (MRSPTU)
                </h4>
                <div className="space-y-3">
                  {selectedCourse.units.map(unit => (
                    <div key={unit.unitNo} className="p-3.5 bg-[#f8f9fa] rounded-xl border border-[#edeeef] space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-[#00236f] font-bold text-xs">
                          {unit.unitNo}: {unit.title}
                        </strong>
                        <span className="text-[10px] text-[#757682] font-semibold">
                          {unit.hours} Hours
                        </span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[#444651] pl-1">
                        {unit.topics.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Textbooks */}
              <div>
                <h4 className="font-bold text-[#191c1d] text-sm uppercase tracking-wider text-[#757682] mb-2">
                  Prescribed Textbooks & References
                </h4>
                <ul className="space-y-1.5 text-[#444651]">
                  {selectedCourse.textbooks.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#00236f] font-bold">[{idx + 1}]</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex items-center justify-between">
              <span className="text-xs text-[#757682]">
                Official Syllabus Document • MRSPTU 2025-26
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 bg-white border border-[#c5c5d3] text-[#444651] rounded-lg text-xs font-semibold hover:bg-[#f3f4f5] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSyllabus(selectedCourse)}
                  className="px-4 py-2 bg-[#00236f] text-white rounded-lg text-xs font-bold hover:bg-[#1e3a8a] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
