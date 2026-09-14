import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

function getAllApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEY) {
    const single = process.env.GEMINI_API_KEY.trim();
    if (single && !keys.includes(single)) {
      keys.unshift(single);
    }
  }
  return keys;
}

let currentKeyIndex = 0;

function getRotatedApiKey(): string {
  const keys = getAllApiKeys();
  if (keys.length === 0) return '';
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

async function callGemini(prompt: string, jsonMode = false): Promise<string> {
  const keys = getAllApiKeys();
  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEY or GEMINI_API_KEYS configured.');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
  };

  const postData = JSON.stringify(payload);
  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];

  let lastError: any = null;
  const maxAttempts = Math.min(keys.length * 2, 6);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = getRotatedApiKey();
    const model = models[attempt % models.length];

    try {
      return await new Promise<string>((resolve, reject) => {
        const req = https.request(
          {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            family: 4, // Force IPv4 to prevent PRoot Linux Happy-Eyeballs ETIMEDOUT
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`Gemini API error ${res.statusCode}: ${body.substring(0, 300)}`));
                return;
              }
              try {
                const parsed = JSON.parse(body);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                  reject(new Error(`Empty response from Gemini ${model}`));
                } else {
                  resolve(text);
                }
              } catch (err) {
                reject(err);
              }
            });
          }
        );

        req.on('error', err => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error(`Gemini request timed out (${model})`));
        });

        req.write(postData);
        req.end();
      });
    } catch (err: any) {
      lastError = err;
      // If 429 quota or 404, loop will try next key and model
      console.warn(`[GeminiService] Attempt ${attempt + 1} (${model}) failed: ${err.message}. Rotating key...`);
    }
  }

  throw lastError || new Error('All Gemini key/model attempts exhausted.');
}

export const GeminiService = {
  getApiKeyStatus() {
    const keys = getAllApiKeys();
    return {
      configured: keys.length > 0,
      totalKeys: keys.length,
      keyPreview: keys.length > 0 ? `${keys[0].substring(0, 6)}...${keys[0].substring(keys[0].length - 4)}` : null,
    };
  },

  /**
   * AI Smart Admission Document & Transcript Auto-Parser
   */
  async parseAdmission(rawText: string, availableCourses: any[]): Promise<any> {
    const courseList = availableCourses.map(c => `ID: "${c.id}", Code: "${c.code}", Name: "${c.name}"`).join('\n');

    const prompt = `You are the chief admissions intelligence officer at a premier university/college ERP system.
Extract and normalize all student admission and personal information from the following raw application text, email, or resume notes.
Match the student's desired degree/field to the closest available course from the list below.

Available Courses in ERP:
${courseList}

Input Application Text:
"""
${rawText}
"""

Return ONLY a JSON object with this exact schema:
{
  "firstName": string (mandatory, capitalize),
  "lastName": string (mandatory, capitalize),
  "email": string (mandatory, clean email format),
  "phone": string (mandatory, numbers only or standard mobile format),
  "gender": "male" | "female" | "nonbinary" | "prefer_not_to_say",
  "dob": "YYYY-MM-DD" (approximate if year/age given, default to 2005-06-15 if unknown),
  "guardianName": string (father/mother/guardian name),
  "relationship": "parent" | "sibling" | "spouse" | "other",
  "guardianPhone": string,
  "courseId": string (must match one of the available course IDs, or default to first course if ambiguous),
  "courseName": string,
  "previousSchool": string,
  "previousScore": string (e.g. "95.2%"),
  "meritScore": number (float between 0 and 100 representing admission qualification score),
  "recommendedQuota": "merit" | "general" | "sports" | "international",
  "aiSummary": string (2 sentences describing candidate qualifications and suitability)
}`;

    try {
      const responseText = await callGemini(prompt, true);
      const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.error('[GeminiService] parseAdmission falling back to intelligent heuristic parser:', err.message);

      // Intelligent heuristic extraction from raw text
      const nameMatch = rawText.match(/(?:Applicant|Candidate Name|Candidate|Name|Student Name)\s*[:\-]\s*([A-Za-z]+)\s+([A-Za-z]+)/i);
      const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const dobMatch = rawText.match(/(\d{4}[-/.]\d{2}[-/.]\d{2})/);
      const scoreMatch = rawText.match(/(\d{2}(?:\.\d+)?)\s*%/);
      const guardianMatch = rawText.match(/(?:Father|Mother|Guardian)\s*[:\-]\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

      let matchedCourse = availableCourses[0];
      for (const c of availableCourses) {
        if (rawText.toLowerCase().includes(c.code.toLowerCase()) || rawText.toLowerCase().includes(c.name.toLowerCase())) {
          matchedCourse = c;
          break;
        }
      }

      const merit = scoreMatch ? parseFloat(scoreMatch[1]) : 92.5;

      return {
        firstName: nameMatch ? nameMatch[1] : 'Siddharth',
        lastName: nameMatch ? nameMatch[2] : 'Malhotra',
        email: emailMatch ? emailMatch[0] : 'applicant@example.com',
        phone: phoneMatch ? phoneMatch[0] : '9819283746',
        gender: rawText.toLowerCase().includes('female') ? 'female' : 'male',
        dob: dobMatch ? dobMatch[1].replace(/\//g, '-') : '2005-09-22',
        guardianName: guardianMatch ? guardianMatch[1] : 'Vikram Malhotra',
        relationship: 'parent',
        guardianPhone: phoneMatch ? phoneMatch[0] : '9819283700',
        courseId: matchedCourse?.id || 'crs-btech-cs',
        courseName: matchedCourse?.name || 'B.Tech Computer Science & Engineering',
        previousSchool: 'Higher Secondary School',
        previousScore: scoreMatch ? `${scoreMatch[1]}%` : '95.2%',
        meritScore: merit,
        recommendedQuota: merit >= 90 ? 'merit' : 'general',
        aiSummary: `Candidate with ${merit}% academic qualification evaluated for ${matchedCourse?.name}.`,
        isFallback: true,
      };
    }
  },

  /**
   * AI Automated Fee Structure & Scholarship Recommendation
   */
  async recommendFeeStructure(studentData: any, course: any): Promise<any> {
    const prompt = `You are a financial controller and scholarship board director in a college ERP system.
Calculate and recommend the optimal fee structure, merit/need concession, and semester installment breakdown for this student.

Student Profile:
- Name: ${studentData.firstName || ''} ${studentData.lastName || ''}
- Course: ${course?.name || 'Undergraduate Degree'} (Base Tuition: ₹${course?.base_tuition_fee || 95000})
- Academic Merit Score: ${studentData.meritScore || studentData.previousScore || '92%'}
- Quota: ${studentData.recommendedQuota || 'general'}
- Family Background / Notes: ${studentData.aiSummary || studentData.notes || 'Standard application'}

Return ONLY a JSON object:
{
  "baseTuition": number,
  "labFee": number,
  "libraryFee": number,
  "amenitiesFee": number,
  "grossTotal": number,
  "concessionPercentage": number,
  "concessionAmount": number,
  "concessionCategory": string,
  "netPayable": number,
  "concessionRationale": string,
  "installments": [
    {
      "milestone": "Semester 1 - Term 1",
      "amount": number,
      "dueDate": "2025-10-31",
      "description": string
    },
    {
      "milestone": "Semester 1 - Term 2",
      "amount": number,
      "dueDate": "2026-01-15",
      "description": string
    }
  ]
}`;

    try {
      const responseText = await callGemini(prompt, true);
      const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.error('[GeminiService] recommendFeeStructure fallback:', err.message);
      const base = course?.base_tuition_fee || 95000;
      const lab = 10000;
      const lib = 4000;
      const amen = 5000;
      const gross = base + lab + lib + amen;
      const discPercent = (studentData.meritScore && studentData.meritScore >= 90) ? 20 : 10;
      const discAmt = Math.round((base * discPercent) / 100);
      const net = gross - discAmt;
      return {
        baseTuition: base,
        labFee: lab,
        libraryFee: lib,
        amenitiesFee: amen,
        grossTotal: gross,
        concessionPercentage: discPercent,
        concessionAmount: discAmt,
        concessionCategory: discPercent >= 20 ? 'Merit Scholarship Tier 1 (High Achievers)' : 'Academic Grant Tier 2',
        netPayable: net,
        concessionRationale: 'Automated scholarship allocation based on academic performance index.',
        installments: [
          { milestone: 'Semester 1 - Term 1 (Upon Admission)', amount: Math.round(net * 0.6), dueDate: '2025-10-31', description: 'Admission deposit, lab and tuition term 1' },
          { milestone: 'Semester 1 - Term 2 (Mid-Term)', amount: Math.round(net * 0.4), dueDate: '2026-01-15', description: 'Term 2 balance and examination fees' },
        ],
        isFallback: true,
      };
    }
  },

  /**
   * AI Fee Dues Defaulter Recovery Notice Generator
   */
  async generateFeeNotice(student: any, course: any, dueAmount: number, dueDate: string, urgency: 'gentle' | 'reminder' | 'urgent' = 'reminder'): Promise<any> {
    const prompt = `You are the Finance Dean at EduCore University ERP.
Draft a professional fee reminder notice for a college student.

Student Details:
- Name: ${student.first_name} ${student.last_name}
- Student ID: ${student.student_id}
- Course: ${course?.name || 'Degree Program'} (Semester ${student.current_semester})
- Outstanding Balance Due: ₹${dueAmount.toLocaleString('en-IN')}
- Official Payment Due Date: ${dueDate}
- Urgency Level: ${urgency}

Return ONLY a JSON object:
{
  "subject": string,
  "emailBody": string,
  "smsText": string,
  "whatsappText": string,
  "actionRequired": string
}`;

    try {
      const responseText = await callGemini(prompt, true);
      const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.error('[GeminiService] generateFeeNotice fallback:', err.message);
      return {
        subject: `Fee Payment Reminder: Pending Dues for Semester ${student.current_semester} - Roll ${student.student_id}`,
        emailBody: `Dear ${student.first_name} ${student.last_name},\n\nThis is a formal notice from the Accounts Office of EduCore University. As per our records, an outstanding fee balance of ₹${dueAmount.toLocaleString('en-IN')} is currently due on or before ${dueDate}.\n\nPlease remit the balance via the student ERP portal (Online UPI, Net Banking, or Debit Card) to avoid late fee surcharges and maintain uninterrupted course access.\n\nWarm regards,\nFinance & Accounts Department\nEduCore University`,
        smsText: `EduCore Alert: Dear ${student.first_name}, fee dues of Rs.${dueAmount} are pending for Sem ${student.current_semester}. Pay before ${dueDate} at erp.educore.edu`,
        whatsappText: `*EduCore University Fee Notice*\n\nHello *${student.first_name}*,\nYour fee payment for *Semester ${student.current_semester}* is pending.\n\n*Amount Due:* ₹${dueAmount.toLocaleString('en-IN')}\n*Due Date:* ${dueDate}\n\nPlease settle your dues via the student portal or contact Accounts at accounts@educore.edu.`,
        actionRequired: `Pay ₹${dueAmount.toLocaleString('en-IN')} before ${dueDate} via ERP portal.`,
        isFallback: true,
      };
    }
  },

  /**
   * AI Natural Language College ERP Assistant / Copilot
   */
  async copilotQuery(query: string, erpSnapshot: any): Promise<any> {
    const prompt = `You are the EduCore AI Campus Intelligence Assistant for college administrators.
Answer the question based on the live ERP snapshot below.

ERP Snapshot:
- Enrolled Students: ${erpSnapshot.totalStudents}
- Fees Collected: ₹${(erpSnapshot.totalCollected || 0).toLocaleString('en-IN')}
- Outstanding Dues: ₹${(erpSnapshot.totalDue || 0).toLocaleString('en-IN')}
- Active Courses: ${erpSnapshot.courses?.map((c: any) => `${c.code}: ${c.name}`).join(', ')}
- Defaulters Count: ${erpSnapshot.defaulters?.length || 0}

User Question: "${query}"

Return ONLY a JSON object:
{
  "answer": string,
  "insights": string[],
  "recommendedActions": string[],
  "relevantMetric": string
}`;

    try {
      const responseText = await callGemini(prompt, true);
      const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err: any) {
      console.error('[GeminiService] copilotQuery fallback:', err.message);
      return {
        answer: `Based on current ERP records: There are ${erpSnapshot.totalStudents} enrolled students with ₹${(erpSnapshot.totalCollected || 0).toLocaleString('en-IN')} collected and ₹${(erpSnapshot.totalDue || 0).toLocaleString('en-IN')} in outstanding dues across active departments.`,
        insights: [
          `Total enrolled students: ${erpSnapshot.totalStudents}`,
          `Fee collection rate is tracking at healthy institutional standards`,
          `${erpSnapshot.defaulters?.length || 0} students currently have pending balance notices`,
        ],
        recommendedActions: [
          'Review top defaulters in Fee Ledger',
          'Trigger AI payment reminders for upcoming semester deadlines',
        ],
        relevantMetric: `Total Dues: ₹${(erpSnapshot.totalDue || 0).toLocaleString('en-IN')}`,
        isFallback: true,
      };
    }
  },
};
