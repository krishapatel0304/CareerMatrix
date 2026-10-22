import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  generateInterviewQuestions,
  startMockInterview,
  generateNextMockQuestion,
  regenerateMockQuestion,
  evaluateMockInterview,
} from "../../services/interviewService";
import { CAREER_FIELDS } from "../../constants/careerFields";
import { ResumeContext } from "../../context/ResumeContext";
import { UserContext } from "../../context/UserContext";
import { getRandomUnusedQuestion, INTERVIEW_QUESTION_BANK } from "../../data/interviewQuestionBank";

console.log("[QUESTION BANK DEBUG]", {
  total: INTERVIEW_QUESTION_BANK?.length,
  getRandomUnusedQuestionType: typeof getRandomUnusedQuestion,
});

// Dual AI Interviewer Personas
export const INTERVIEWER_PERSONAS = {
  HR: {
    id: "hr",
    gender: "male",
    name: "Marcus Vance",
    roleLabel: "AI HR Interviewer",
    title: "HR & Behavioral Specialist",
    themeColor: "#3b82f6",
    voicePitch: 0.90,
    voiceRate: 0.95,
  },
  TECH: {
    id: "tech",
    gender: "female",
    name: "Dr. Elena Rostova",
    roleLabel: "AI Technical Interviewer",
    title: "Technical Lead & Domain Specialist",
    themeColor: "#a855f7",
    voicePitch: 1.15,
    voiceRate: 0.98,
  },
};

// Professional Vector Avatar for Male HR Interviewer (Marcus Vance)
export function MaleHRAvatar({ active, speaking }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: "50%",
        display: "block",
        transition: "all 0.3s ease",
      }}
    >
      <defs>
        <radialGradient id="maleBg" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="60%" stopColor="#172554" />
          <stop offset="100%" stopColor="#0b1120" />
        </radialGradient>
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="60" cy="60" r="60" fill="url(#maleBg)" />

      {/* Suit Jacket & Shoulders */}
      <path
        d="M20 120 C22 96 36 82 50 80 L70 80 C84 82 98 96 100 120 Z"
        fill="url(#suitGrad)"
      />

      {/* White Collared Shirt */}
      <polygon points="52,80 68,80 64,104 56,104" fill="url(#shirtGrad)" />
      <polygon points="46,80 54,88 56,80" fill="#ffffff" />
      <polygon points="74,80 66,88 64,80" fill="#ffffff" />

      {/* Tie */}
      <polygon points="58,82 62,82 64,106 60,112 56,106" fill="url(#tieGrad)" />

      {/* Lapels */}
      <polygon points="44,80 54,106 36,98" fill="#1e293b" opacity="0.9" />
      <polygon points="76,80 66,106 84,98" fill="#1e293b" opacity="0.9" />

      {/* Neck */}
      <rect x="53" y="66" width="14" height="18" rx="4" fill="#e2b170" />

      {/* Head / Face */}
      <ellipse cx="60" cy="52" rx="18" ry="22" fill="#e2b170" />

      {/* Ears */}
      <circle cx="41" cy="53" r="4.5" fill="#d49e5d" />
      <circle cx="79" cy="53" r="4.5" fill="#d49e5d" />

      {/* Hair */}
      <path
        d="M41 48 C41 33 48 24 60 24 C72 24 79 33 79 48 C77 45 74 44 71 44 C67 44 64 42 60 42 C56 42 52 45 48 45 C45 45 43 46 41 48 Z"
        fill="url(#hairGrad)"
      />

      {/* Eyebrows */}
      <path d="M48 44 Q53 42 56 44" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M64 44 Q67 42 72 44" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Eyes */}
      <ellipse cx="52" cy="49" rx="2.5" ry="2.2" fill="#0f172a" />
      <ellipse cx="68" cy="49" rx="2.5" ry="2.2" fill="#0f172a" />
      <circle cx="53" cy="48" r="0.8" fill="#ffffff" />
      <circle cx="69" cy="48" r="0.8" fill="#ffffff" />

      {/* Nose */}
      <path d="M60 49 L58.5 56 L61.5 56" stroke="#c28c4c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Friendly Smile */}
      {speaking ? (
        <ellipse cx="60" cy="62" rx="5" ry="3.5" fill="#881337" />
      ) : (
        <path d="M54 61 Q60 66 66 61" stroke="#881337" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* ID Badge on Lapel */}
      <rect x="36" y="92" width="7" height="9" rx="1.5" fill="#3b82f6" />
      <rect x="37" y="93" width="5" height="3" fill="#ffffff" />
    </svg>
  );
}

// Professional Vector Avatar for Female Technical Interviewer (Dr. Elena Rostova)
export function FemaleTechAvatar({ active, speaking }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: "50%",
        display: "block",
        transition: "all 0.3s ease",
      }}
    >
      <defs>
        <radialGradient id="femBg" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="60%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#0b1120" />
        </radialGradient>
        <linearGradient id="femSuit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="femBlouse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id="femHair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3f1d24" />
          <stop offset="50%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="60" cy="60" r="60" fill="url(#femBg)" />

      {/* Hair (Back Layer) */}
      <path d="M36 50 C34 76 38 96 44 104 L76 104 C82 96 86 76 84 50 Z" fill="url(#femHair)" />

      {/* Suit / Blazer */}
      <path
        d="M20 120 C22 96 36 82 50 80 L70 80 C84 82 98 96 100 120 Z"
        fill="url(#femSuit)"
      />

      {/* Inner Blouse */}
      <polygon points="50,80 70,80 65,108 55,108" fill="url(#femBlouse)" />
      <polygon points="53,80 60,94 67,80" fill="#f8fafc" opacity="0.9" />

      {/* Neck */}
      <rect x="54" y="66" width="12" height="18" rx="4" fill="#f3ba7a" />

      {/* Head / Face */}
      <ellipse cx="60" cy="52" rx="17" ry="21" fill="#f3ba7a" />

      {/* Ears & Earrings */}
      <circle cx="42" cy="53" r="4" fill="#dfa566" />
      <circle cx="78" cy="53" r="4" fill="#dfa566" />
      <circle cx="42" cy="55" r="1.5" fill="#e9d5ff" />
      <circle cx="78" cy="55" r="1.5" fill="#e9d5ff" />

      {/* Hair Cut */}
      <path
        d="M42 46 C42 30 50 23 60 23 C70 23 78 30 78 46 C75 42 70 41 65 41 C58 41 53 38 48 40 C45 42 43 44 42 46 Z"
        fill="url(#femHair)"
      />
      <path d="M42 46 C41 55 42 66 45 72 C46 66 45 56 44 48 Z" fill="url(#femHair)" />
      <path d="M78 46 C79 55 78 66 75 72 C74 66 75 56 76 48 Z" fill="url(#femHair)" />

      {/* Eyebrows */}
      <path d="M48 43 Q53 41 56 43" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M64 43 Q67 41 72 43" stroke="#2e1065" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Smart Wireframe Glasses */}
      <rect x="46" y="45" width="11" height="9" rx="3" stroke="#c084fc" strokeWidth="1.8" fill="rgba(255,255,255,0.15)" />
      <rect x="63" y="45" width="11" height="9" rx="3" stroke="#c084fc" strokeWidth="1.8" fill="rgba(255,255,255,0.15)" />
      <path d="M57 48 L63 48" stroke="#c084fc" strokeWidth="1.8" />
      <path d="M46 48 L42 46" stroke="#c084fc" strokeWidth="1.4" />
      <path d="M74 48 L78 46" stroke="#c084fc" strokeWidth="1.4" />

      {/* Eyes */}
      <ellipse cx="51.5" cy="49.5" rx="2.4" ry="2.2" fill="#1e1b4b" />
      <ellipse cx="68.5" cy="49.5" rx="2.4" ry="2.2" fill="#1e1b4b" />
      <circle cx="52.5" cy="48.5" r="0.8" fill="#ffffff" />
      <circle cx="69.5" cy="48.5" r="0.8" fill="#ffffff" />

      {/* Nose */}
      <path d="M60 50 L59 56 L61 56" stroke="#dfa566" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Lips */}
      {speaking ? (
        <ellipse cx="60" cy="62" rx="4.8" ry="3.2" fill="#9f1239" />
      ) : (
        <path d="M55 61 Q60 65 65 61" stroke="#9f1239" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* Tech Pin */}
      <polygon points="38,92 42,92 44,98 36,98" fill="#a855f7" />
      <circle cx="40" cy="95" r="1.5" fill="#f8fafc" />
    </svg>
  );
}

/**
 * Natural Turn-Taking Distribution for the 9-Question Interview Panel:
 * - Male HR (Marcus Vance): ~3-4 questions (Q1 Intro, Q3 Project/Motivation, Q6 Troubleshooting Approach/Situational, Q8 STAR Behavioral/Teamwork).
 * - Female Tech (Dr. Elena Rostova): ~5-6 questions (Q2 Fundamentals, Q4 Architecture, Q5 Applied Practice, Q7 Advanced Standards, Q9 Production Recovery/Scenario).
 */
export const getInterviewerForQuestion = (qObj, index = 0) => {
  if (!qObj && index === 0) return INTERVIEWER_PERSONAS.HR;
  if (index === 0) return INTERVIEWER_PERSONAS.HR;

  const qText = (typeof qObj === "string" ? qObj : (qObj?.question || "")).toLowerCase();
  const category = (qObj?.category || "").toLowerCase();

  // 1. Mandatory Q1 Self-Introduction
  if (
    qText.includes("tell me about yourself") ||
    qText.includes("introduce yourself") ||
    qText.includes("walk me through your background") ||
    qText.includes("walk me through your resume")
  ) {
    return INTERVIEWER_PERSONAS.HR;
  }

  // 2. Behavioral, Leadership, Culture, Teamwork, Situational STAR keywords -> Always Male HR
  if (
    category.includes("behavioral") ||
    category.includes("teamwork") ||
    category.includes("star") ||
    category.includes("leadership") ||
    category.includes("conflict") ||
    category.includes("interpersonal") ||
    category.includes("culture") ||
    category.includes("hr") ||
    category.includes("career goals")
  ) {
    return INTERVIEWER_PERSONAS.HR;
  }

  const hrPatterns = [
    "tell me about a time",
    "describe a time",
    "describe a situation",
    "give an example of a time",
    "handling conflict",
    "handle conflict",
    "disagreement with",
    "disagreed with",
    "team member",
    "coworker",
    "colleague",
    "cross-functional collaboration",
    "tight deadline",
    "under high pressure",
    "why are you interested in this role",
    "why do you want to work",
    "where do you see yourself",
    "greatest strength",
    "greatest weakness",
    "handled a mistake",
    "handled failure",
    "constructive feedback",
    "work style",
    "prioritize competing",
    "developer productivity and security",
    "balancing strict security",
    "balancing engineering trade-offs with business deadlines",
    "mentoring junior",
    "why should we hire you",
    "career goals",
  ];

  if (hrPatterns.some((pattern) => qText.includes(pattern))) {
    return INTERVIEWER_PERSONAS.HR;
  }

  // 3. Balanced Panel Distribution by Question Slot (4 HR / 5 Tech):
  // Q1 (idx 0) -> HR
  // Q2 (idx 1) -> Tech
  // Q3 (idx 2) -> HR (Project Experience / Motivation / Team Execution)
  // Q4 (idx 3) -> Tech (System Architecture / Tooling)
  // Q5 (idx 4) -> Tech (Applied Technical Scenario)
  // Q6 (idx 5) -> HR (Diagnostic Approach / High-Pressure Scenario)
  // Q7 (idx 6) -> Tech (Advanced Standards / Resilience)
  // Q8 (idx 7) -> HR (STAR Behavioral & Teamwork)
  // Q9 (idx 8) -> Tech (Production Incident Recovery / Final Scenario)
  if (index === 2 || index === 5 || index === 7) {
    return INTERVIEWER_PERSONAS.HR;
  }

  if (index === 1 || index === 3 || index === 4 || index === 6 || index === 8) {
    return INTERVIEWER_PERSONAS.TECH;
  }

  // Default to Female Technical Interviewer for all other engineering domain questions
  return INTERVIEWER_PERSONAS.TECH;
};

/**
 * Categorize candidate response quality without altering scoring:
 * Categories: 'I_DONT_KNOW' | 'NO_RESPONSE' | 'PARTIAL' | 'STRONG' | 'ACCEPTABLE'
 */
export const classifyAnswerQuality = (answer = "", questionObj = null) => {
  const text = (answer || "").trim().toLowerCase();
  if (!text || text === "no response provided" || text === "no response") {
    return "NO_RESPONSE";
  }

  const idkWays = [
    "i don't know",
    "i do not know",
    "dont know",
    "don't know",
    "not sure",
    "no idea",
    "i haven't learned",
    "haven't learned that",
    "haven't learned this",
    "not familiar",
    "i am not familiar",
    "i'm not familiar",
    "no clue",
    "i haven't worked with",
    "haven't worked with",
    "i don't recall",
    "don't recall",
    "can't remember",
    "cannot remember",
    "pass on this",
    "skip this",
    "skip",
    "pass",
    "i have no idea",
    "no idea about this",
  ];

  const words = text.split(/\s+/).filter(Boolean);

  // If candidate explicitly stated they don't know (short phrase under 14 words containing idk phrases)
  if (words.length <= 14 && idkWays.some((phrase) => text.includes(phrase))) {
    return "I_DONT_KNOW";
  }

  // Check key concepts if present
  const keyConcepts = questionObj?.keyConcepts || [];
  const conceptMatches = keyConcepts.filter((c) => text.includes(c.toLowerCase())).length;

  if (words.length < 5) {
    return "PARTIAL";
  }

  if (words.length >= 25 || conceptMatches >= 2) {
    return "STRONG";
  }

  return "ACCEPTABLE";
};

/**
 * Extract technical and domain entities from candidate speech to enable real conversational listening
 */
export const extractEntitiesFromText = (text = "") => {
  if (!text || typeof text !== "string") return [];
  const lower = text.toLowerCase();

  const entityDefinitions = [
    { label: "React", patterns: ["react", "react.js", "reactjs"] },
    { label: "Node.js", patterns: ["node", "node.js", "nodejs"] },
    { label: "PostgreSQL", patterns: ["postgres", "postgresql"] },
    { label: "MongoDB", patterns: ["mongo", "mongodb"] },
    { label: "Redis", patterns: ["redis"] },
    { label: "Context API", patterns: ["context api", "react context", "usecontext"] },
    { label: "Redux", patterns: ["redux", "redux toolkit", "rtk"] },
    { label: "Zustand", patterns: ["zustand"] },
    { label: "Docker", patterns: ["docker", "containerization"] },
    { label: "Kubernetes", patterns: ["kubernetes", "k8s"] },
    { label: "AWS", patterns: ["aws", "amazon web services", "s3", "ec2", "lambda"] },
    { label: "TypeScript", patterns: ["typescript"] },
    { label: "Python", patterns: ["python", "django", "fastapi", "flask"] },
    { label: "Java", patterns: ["java", "spring boot", "spring framework"] },
    { label: "REST APIs", patterns: ["rest api", "rest apis", "restful", "rest endpoints"] },
    { label: "GraphQL", patterns: ["graphql"] },
    { label: "Microservices", patterns: ["microservices", "microservice"] },
    { label: "JWT", patterns: ["jwt", "json web token", "token-based auth", "token expiration"] },
    { label: "CI/CD", patterns: ["ci/cd", "ci cd", "jenkins", "github actions"] },
    { label: "SIEM", patterns: ["siem", "splunk", "sentinel"] },
    { label: "Wireshark", patterns: ["wireshark", "zeek", "pcap", "packet analysis"] },
    { label: "OWASP", patterns: ["owasp", "sql injection", "sqli", "xss", "csrf"] },
    { label: "Zero Trust", patterns: ["zero trust", "rbac", "abac", "least privilege", "polp"] },
    { label: "Tailwind", patterns: ["tailwind", "css modules"] },
    { label: "Next.js", patterns: ["next.js", "nextjs", "ssr"] },
    { label: "Kafka", patterns: ["kafka", "rabbitmq", "message queue"] },
    { label: "SQL", patterns: ["sql", "mysql", "relational database"] },
  ];

  const matched = [];
  for (const item of entityDefinitions) {
    if (item.patterns.some((p) => lower.includes(p))) {
      matched.push(item.label);
    }
  }
  return matched;
};

/**
 * Human-like Conversational Spoken Lead-in & Handoffs:
 * Real panel dynamics between Marcus Vance (HR) and Dr. Elena Rostova (Tech).
 * 100% authentic conversational behavior — listens to candidate content, supports follow-ups,
 * allows direct Question-to-Answer transitions, and eliminates all robotic template loops and unearned praise.
 */
export const getConversationalSpokenText = ({
  questionText = "",
  index = 0,
  interviewer,
  prevInterviewer,
  previousAnswer = "",
  previousQuestion = null,
  allPreviousAnswers = {},
  role = "",
}) => {
  const cleanQ = (questionText || "").trim();

  // 1. Q1 Opening Welcome Statement (Marcus Vance - Male HR)
  if (index === 0) {
    const roleName = role ? role.trim() : "target";
    return `Hi, welcome. Let's start with your background for the ${roleName} role. Tell me about yourself.`;
  }

  // 2. Classify Quality & Extract Content Entities from Candidate's Response
  const quality = classifyAnswerQuality(previousAnswer, previousQuestion);
  const recentEntities = extractEntitiesFromText(previousAnswer);
  const allEntities = Object.values(allPreviousAnswers || {})
    .flatMap((ans) => extractEntitiesFromText(ans))
    .filter(Boolean);
  const distinctAllEntities = Array.from(new Set(allEntities));

  // A. Candidate said "I don't know" / "Not sure" / "No idea"
  // Real interviewer reaction: calm, normal, zero praise, frequently no filler at all.
  if (quality === "I_DONT_KNOW") {
    // 40% of the time: directly ask the question without a filler sentence
    if (index % 3 === 0) {
      return cleanQ;
    }
    const idkResponses = [
      `Alright. ${cleanQ}`,
      `Okay, let's move on. ${cleanQ}`,
      `Fair enough. Let's try something else: ${cleanQ}`,
      `Alright, let's look at another area: ${cleanQ}`,
    ];
    return idkResponses[index % idkResponses.length];
  }

  // B. Candidate gave No Response / Silence timeout
  if (quality === "NO_RESPONSE") {
    if (index % 2 === 0) {
      return cleanQ;
    }
    return `Let's move to the next question: ${cleanQ}`;
  }

  // C. Candidate gave a Very Short / 1-sentence Partial answer (< 5 words)
  if (quality === "PARTIAL") {
    if (index === 2 || index === 5) {
      return `Can you tell me a little more about how you approached that? ${cleanQ}`;
    }
    if (index % 2 === 0) {
      return `Okay. ${cleanQ}`;
    }
    return cleanQ;
  }

  // D. Content-Aware Listening: Candidate mentioned specific technologies/tools in their previous response
  if (recentEntities.length > 0 && (index === 1 || index === 3 || index === 4 || index === 6)) {
    const mentionedTech = recentEntities[0];
    const qLower = cleanQ.toLowerCase();
    // Avoid double prefixing if the raw question already mentions the tech in its opening words
    if (!qLower.startsWith(`in ${mentionedTech.toLowerCase()}`) && !qLower.startsWith(`when using ${mentionedTech.toLowerCase()}`)) {
      if (index === 1) {
        return `You mentioned working with ${mentionedTech}. ${cleanQ}`;
      }
      if (index === 3 || index === 4) {
        return `Looking at your work with ${mentionedTech}: ${cleanQ}`;
      }
    }
  }

  // E. Natural Turn-Taking & Direct Question Delivery across the 9 Questions

  // Q2 (index === 1: Marcus HR -> Dr. Elena Tech)
  if (index === 1) {
    if (distinctAllEntities.length > 0 && (index + cleanQ.length) % 2 === 0) {
      return `You mentioned working with ${distinctAllEntities[0]}. ${cleanQ}`;
    }
    const q2Starters = [
      `Let's talk about the technical side. ${cleanQ}`,
      `I'd like to dive into your technical foundation: ${cleanQ}`,
      cleanQ,
    ];
    return q2Starters[index % q2Starters.length];
  }

  // Q3 (index === 2: Dr. Elena Tech -> Marcus HR - Practical Project Execution)
  if (index === 2) {
    const q3Starters = [
      `Let's talk about your practical project experience. ${cleanQ}`,
      `Stepping into your project work and execution: ${cleanQ}`,
      `Right. ${cleanQ}`,
      cleanQ,
    ];
    return q3Starters[index % q3Starters.length];
  }

  // Q4 (index === 3: Marcus HR -> Dr. Elena Tech - System Architecture & Tooling)
  if (index === 3) {
    const q4Starters = [
      `Let's look at system architecture: ${cleanQ}`,
      `Now looking at the architectural side: ${cleanQ}`,
      `Got it. ${cleanQ}`,
      cleanQ,
    ];
    return q4Starters[index % q4Starters.length];
  }

  // Q5 (index === 4: Dr. Elena Tech continuing - Applied Scenario)
  if (index === 4) {
    const q5Starters = [
      `Consider this scenario: ${cleanQ}`,
      `How would you handle this situation in practice: ${cleanQ}`,
      `Understood. ${cleanQ}`,
      cleanQ,
    ];
    return q5Starters[index % q5Starters.length];
  }

  // Q6 (index === 5: Dr. Elena Tech -> Marcus HR - Diagnostic Approach Under Pressure)
  if (index === 5) {
    const q6Starters = [
      `Let's switch gears for a moment to look at problem-solving under pressure. ${cleanQ}`,
      `I'd like to understand your approach when dealing with a challenging problem. ${cleanQ}`,
      `Right. ${cleanQ}`,
      cleanQ,
    ];
    return q6Starters[index % q6Starters.length];
  }

  // Q7 (index === 6: Marcus HR -> Dr. Elena Tech - Advanced Standards & Trade-offs)
  if (index === 6) {
    const q7Starters = [
      `Now let's examine system trade-offs: ${cleanQ}`,
      `Looking at technical resilience and best practices: ${cleanQ}`,
      `Okay. ${cleanQ}`,
      cleanQ,
    ];
    return q7Starters[index % q7Starters.length];
  }

  // Q8 (index === 7: Dr. Elena Tech -> Marcus HR - STAR Collaboration / Conflict)
  if (index === 7) {
    // If question already starts with "Describe a situation" or "Tell me about a time", ask directly
    if (cleanQ.toLowerCase().startsWith("describe a") || cleanQ.toLowerCase().startsWith("tell me about") || cleanQ.toLowerCase().startsWith("give an example")) {
      return cleanQ;
    }
    const q8Starters = [
      `Let's talk about teamwork and collaboration: ${cleanQ}`,
      `Looking at how you work with colleagues: ${cleanQ}`,
      cleanQ,
    ];
    return q8Starters[index % q8Starters.length];
  }

  // Q9 (index === 8: Dr. Elena Tech - Production Incident Recovery / Final Scenario)
  if (index === 8) {
    const q9Starters = [
      `For our final scenario today: ${cleanQ}`,
      `To round out our technical discussion: ${cleanQ}`,
      cleanQ,
    ];
    return q9Starters[index % q9Starters.length];
  }

  // Fallback: Direct question without filler
  return cleanQ;
};

// Global cached voices for Web Speech API
let cachedSpeechVoices = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cachedSpeechVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedSpeechVoices = window.speechSynthesis.getVoices();
  };
}

function InterviewQuestions() {
  const navigate = useNavigate();
  const { resumeData } = useContext(ResumeContext);
  const { user } = useContext(UserContext);

  // Mode: "mock" (Interactive Live Interview) vs "bank" (Static Question Bank)
  const [activeTab, setActiveTab] = useState("mock");

  // Step in Mock Interview: "setup" -> "permission_check" -> "interview" -> "result"
  const [viewMode, setViewMode] = useState("setup");

  // Setup Form State
  const [careerField, setCareerField] = useState("");
  const [customField, setCustomField] = useState("");
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate (2-5 years)");
  const [skills, setSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill from saved Resume
  useEffect(() => {
    const prof = resumeData?.professional;
    if (prof || user) {
      if (prof?.careerField || user?.career_field) {
        setCareerField((prev) => prev || prof?.careerField || user?.career_field || "");
      }
      if (prof?.customField) {
        setCustomField((prev) => prev || prof.customField);
      }
      if (prof?.targetRole) {
        setRole((prev) => prev || prof.targetRole);
      }
      if (prof?.skills) {
        setSkills((prev) => prev || prof.skills);
      }
      if (prof?.experience && prof.experience.toLowerCase().includes("senior")) {
        setExperienceLevel("Advanced / Senior (5+ years)");
      } else if (prof?.experience && prof.experience.toLowerCase().includes("fresher")) {
        setExperienceLevel("Beginner / Fresher (0-2 years)");
      }
      if (prof?.careerField || prof?.targetRole || prof?.skills) {
        setAutoFilled(true);
      }
    }
  }, [resumeData, user]);

  // Practice Question Bank State
  const [bankData, setBankData] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [expandedBankAnswers, setExpandedBankAnswers] = useState({});
  const [copiedBankIdx, setCopiedBankIdx] = useState(null);

  // Mock Interview Questions, History & Answers
  const [questions, setQuestions] = useState([]);
  const [sessionAskedQuestions, setSessionAskedQuestions] = useState([]); // Questions in current live session
  const [sessionId, setSessionId] = useState(() => "mock_sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8));
  const [sessionCount, setSessionCount] = useState(() => {
    try {
      const stored = localStorage.getItem("cm_mock_session_count");
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      return 0;
    }
  });
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [index]: "answer string" }
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Helper functions for persistent recent question history across sessions
  const getStoredInterviewHistory = () => {
    try {
      const raw = localStorage.getItem("cm_mock_interview_history");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const appendToInterviewHistory = (newQuestions) => {
    try {
      const existing = getStoredInterviewHistory();
      const questionTexts = (Array.isArray(newQuestions) ? newQuestions : [newQuestions])
        .map((q) => (typeof q === "string" ? q.trim() : q?.question?.trim()))
        .filter((q) => q && !q.toLowerCase().includes("tell me about yourself"));
      const updated = Array.from(new Set([...existing, ...questionTexts]));
      // Keep up to 100 recent questions to prevent history bloat
      const trimmed = updated.slice(-100);
      localStorage.setItem("cm_mock_interview_history", JSON.stringify(trimmed));
    } catch (e) {
      console.warn("Could not save interview history:", e);
    }
  };

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [isRegeneratingQ, setIsRegeneratingQ] = useState(false);
  const [error, setError] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef(null);

  // Evaluation Result State
  const [evaluation, setEvaluation] = useState(null);
  const [expandedEvalDetails, setExpandedEvalDetails] = useState({});

  // Media Devices & Streams
  const videoPreviewRef = useRef(null);
  const liveVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState("prompt"); // "prompt", "granted", "denied"
  const [permissionErrorMsg, setPermissionErrorMsg] = useState("");

  // Speech Recognition (Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  // Text to Speech (Speaking Question) & Preparation Delay
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Refs to avoid stale closures in Web Speech API & async events
  const questionsRef = useRef([]);
  const currentQIndexRef = useRef(0);
  const userAnswersRef = useRef({});
  const currentAnswerRef = useRef("");
  const isSpeakingQuestionRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isPreparingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const viewModeRef = useRef("setup");
  const micActiveRef = useRef(false);

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { currentQIndexRef.current = currentQIndex; }, [currentQIndex]);
  useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);
  useEffect(() => { currentAnswerRef.current = currentAnswer; }, [currentAnswer]);
  useEffect(() => { isSpeakingQuestionRef.current = isSpeakingQuestion; }, [isSpeakingQuestion]);
  useEffect(() => { isTransitioningRef.current = isTransitioning; }, [isTransitioning]);
  useEffect(() => { isPreparingRef.current = isPreparing; }, [isPreparing]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { micActiveRef.current = micActive; }, [micActive]);

  // Active AI Interviewer on the panel for current question
  const activeInterviewer = getInterviewerForQuestion(questions[currentQIndex], currentQIndex);
  const isHrActive = activeInterviewer?.id === "hr";
  const isTechActive = activeInterviewer?.id === "tech";

  // Automatic Answer Submission & Seamless Question Transition
  const handleAutoSubmitAnswer = async () => {
    if (isTransitioningRef.current || isPreparingRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    }

    const qIdx = currentQIndexRef.current;
    const currentQList = questionsRef.current;
    const answer = (currentAnswerRef.current || "").trim() || "No response provided";

    const updatedAnswers = {
      ...userAnswersRef.current,
      [qIdx]: answer,
    };
    userAnswersRef.current = updatedAnswers;
    setUserAnswers(updatedAnswers);

    // If candidate has completed all questions
    if (qIdx >= currentQList.length - 1) {
      await handleCompleteInterview(updatedAnswers);
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      return;
    }

    // Otherwise, advance to next question automatically
    const nextIdx = qIdx + 1;
    setCurrentQIndex(nextIdx);
    currentQIndexRef.current = nextIdx;
    setCurrentAnswer("");
    currentAnswerRef.current = "";

    if (questionsRef.current[nextIdx]?.question) {
      setSessionAskedQuestions((prev) => Array.from(new Set([...prev, questionsRef.current[nextIdx].question])));
    }

    // Brief transition pause for natural conversational flow
    setTimeout(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      if (questionsRef.current[nextIdx]?.question) {
        speakQuestion(
          questionsRef.current[nextIdx].question,
          getInterviewerForQuestion(questionsRef.current[nextIdx], nextIdx)
        );
      }
    }, 1200);
  };

  // Initialize Speech Recognition Support & Continuous Listening
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        if (isSpeakingQuestionRef.current || isTransitioningRef.current || isPreparingRef.current) return;

        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        const cleaned = transcript.trim();
        setCurrentAnswer(cleaned);
        currentAnswerRef.current = cleaned;

        // Reset silence timer on speech activity
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        // When user speaks, wait 3 seconds of silence to finalize answer automatically
        if (cleaned.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            handleAutoSubmitAnswer();
          }, 3000);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically keep microphone active during interview mode
        if (
          viewModeRef.current === "interview" &&
          !isSpeakingQuestionRef.current &&
          !isTransitioningRef.current &&
          !isPreparingRef.current &&
          micActiveRef.current
        ) {
          setTimeout(() => {
            try {
              recognition.start();
              setIsListening(true);
            } catch (e) {}
          }, 150);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopMediaStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Timer Effect during live interview (starts when preparation is finished)
  useEffect(() => {
    if (viewMode === "interview" && !isPreparing) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, isPreparing]);

  // Connect live video ref when entering interview view
  useEffect(() => {
    if (viewMode === "interview" && liveVideoRef.current && mediaStreamRef.current) {
      liveVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [viewMode, cameraActive]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Stop Media Stream Tracks
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Request Camera and Microphone Permissions
  const requestMediaPermissions = async () => {
    setError("");
    setPermissionErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });

      mediaStreamRef.current = stream;
      setCameraActive(true);
      setMicActive(true);
      setCameraPermissionState("granted");

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Media permission error:", err);
      setCameraPermissionState("denied");
      setCameraActive(false);
      setMicActive(false);
      setPermissionErrorMsg(
        "Camera/Microphone access was denied or not found. Please grant permissions to continue with the voice interview."
      );
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (!mediaStreamRef.current) return;
    const videoTracks = mediaStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const newEnabled = !videoTracks[0].enabled;
      videoTracks[0].enabled = newEnabled;
      setCameraActive(newEnabled);
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (!mediaStreamRef.current) return;
    const audioTracks = mediaStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const newEnabled = !audioTracks[0].enabled;
      audioTracks[0].enabled = newEnabled;
      setMicActive(newEnabled);
      if (!newEnabled && isListening) {
        stopSpeechRecognition();
      }
    }
  };

  // Start Speech Recognition
  const startSpeechRecognition = () => {
    if (
      recognitionRef.current &&
      !isListening &&
      !isSpeakingQuestionRef.current &&
      !isTransitioningRef.current &&
      !isPreparingRef.current
    ) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Recognition start err:", err);
      }
    }
  };

  // Stop Speech Recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Recognition stop err:", err);
      }
      setIsListening(false);
    }
  };

  // Toggle Speech-to-Text
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Text-To-Speech: Speak Question aloud with natural human-like conversational transitions
  const speakQuestion = (rawQuestionText, interviewerOverride = null, customSpokenOverride = null) => {
    if (!rawQuestionText && !customSpokenOverride) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        setIsListening(false);
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      const currentIdx = currentQIndexRef.current;
      const currentQ = questionsRef.current[currentIdx];
      const prevQ = currentIdx > 0 ? questionsRef.current[currentIdx - 1] : null;

      const targetInterviewer = interviewerOverride || getInterviewerForQuestion(currentQ, currentIdx);
      const prevInterviewer = prevQ ? getInterviewerForQuestion(prevQ, currentIdx - 1) : null;
      const prevAnswer = currentIdx > 0 ? (userAnswersRef.current[currentIdx - 1] || currentAnswerRef.current || "") : "";

      // Generate conversational spoken lead-in
      const spokenText = customSpokenOverride || getConversationalSpokenText({
        questionText: rawQuestionText || currentQ?.question || "",
        index: currentIdx,
        interviewer: targetInterviewer,
        prevInterviewer,
        previousAnswer: prevAnswer,
        previousQuestion: prevQ,
        allPreviousAnswers: userAnswersRef.current,
        role: role.trim(),
      });

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const voices = (cachedSpeechVoices && cachedSpeechVoices.length > 0)
        ? cachedSpeechVoices
        : (window.speechSynthesis.getVoices() || []);

      if (targetInterviewer?.gender === "male") {
        const maleVoice = voices.find((v) => {
          const name = (v.name || "").toLowerCase();
          const lang = (v.lang || "").toLowerCase();
          return (
            lang.startsWith("en") &&
            (name.includes("male") ||
              name.includes("david") ||
              name.includes("george") ||
              name.includes("mark") ||
              name.includes("alex") ||
              name.includes("daniel") ||
              name.includes("james") ||
              name.includes("guy"))
          );
        });
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = targetInterviewer.voicePitch || 0.90;
        utterance.rate = targetInterviewer.voiceRate || 0.95;
      } else {
        const femaleVoice = voices.find((v) => {
          const name = (v.name || "").toLowerCase();
          const lang = (v.lang || "").toLowerCase();
          return (
            lang.startsWith("en") &&
            (name.includes("female") ||
              name.includes("zira") ||
              name.includes("samantha") ||
              name.includes("victoria") ||
              name.includes("karen") ||
              name.includes("jenny") ||
              name.includes("aria") ||
              name.includes("google us english"))
          );
        });
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = targetInterviewer?.voicePitch || 1.15;
        utterance.rate = targetInterviewer?.voiceRate || 0.98;
      }

      utterance.onstart = () => {
        setIsSpeakingQuestion(true);
        isSpeakingQuestionRef.current = true;
      };

      const handleSpeechDone = () => {
        setIsSpeakingQuestion(false);
        isSpeakingQuestionRef.current = false;

        // Automatically start listening for candidate's answer
        if (viewModeRef.current === "interview" && micActiveRef.current && !isTransitioningRef.current) {
          setTimeout(() => {
            startSpeechRecognition();
          }, 250);
        }
      };

      utterance.onend = handleSpeechDone;
      utterance.onerror = handleSpeechDone;

      window.speechSynthesis.speak(utterance);
    }
  };

  // ==========================================
  // Flow Handlers
  // ==========================================

  // Step 1 -> Step 2: Go to Permission Check
  const handleProceedToDeviceCheck = (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!role.trim()) {
      setError("Please enter your Target Job Role to begin.");
      return;
    }

    setViewMode("permission_check");
    setTimeout(() => {
      requestMediaPermissions();
    }, 200);
  };

  // Step 2 -> Step 3: Initialize Mock Interview (5.5-second silent preparation delay before Question 1)
  const handleStartInterview = async () => {
    setError("");
    setLoading(true);
    setIsPreparing(true);
    isPreparingRef.current = true;

    const effectiveCareerField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    const freshSessionId = "mock_sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const nextSessionCount = sessionCount + 1;
    setSessionId(freshSessionId);
    setSessionCount(nextSessionCount);
    try {
      localStorage.setItem("cm_mock_session_count", String(nextSessionCount));
    } catch (e) {}

    const recentHistory = getStoredInterviewHistory();
    console.log(`[START_MOCK] Starting Session #${nextSessionCount} (${freshSessionId}) with ${recentHistory.length} recent questions in history.`);

    try {
      const response = await startMockInterview({
        careerField: effectiveCareerField,
        role: role.trim(),
        experienceLevel,
        skills: skills.trim(),
        education: resumeData?.professional?.education || "",
        experience: resumeData?.professional?.experience || "",
        projects: resumeData?.professional?.projects || "",
        certifications: resumeData?.professional?.certifications || "",
        candidateName: resumeData?.personal?.name || user?.name || "",
        objective: resumeData?.professional?.objective || "",
        resumeData: resumeData,
        jobDescription: jobDescription.trim(),
        recentQuestions: recentHistory,
        askedQuestions: sessionAskedQuestions,
        sessionId: freshSessionId,
        sessionCount: nextSessionCount,
      });

      if (response.questions && response.questions.length > 0) {
        let qList = [...response.questions];
        // Enforce mandatory first question: "Tell me about yourself."
        if (!qList[0]?.question || !qList[0].question.toLowerCase().includes("tell me about yourself")) {
          qList[0] = {
            id: 1,
            level: "Basic",
            question: "Tell me about yourself.",
            keyConcepts: ["Self-Introduction", "Background", "Career Goals"],
            hint: "Provide a concise summary of your education, background, core skills, and career passion.",
          };
        }

        const questionTexts = qList.map((q) => q.question);
        setQuestions(qList);
        questionsRef.current = qList;
        setSessionAskedQuestions(questionTexts);
        appendToInterviewHistory(qList);

        setCurrentQIndex(0);
        currentQIndexRef.current = 0;
        setUserAnswers({});
        userAnswersRef.current = {};
        setCurrentAnswer("");
        currentAnswerRef.current = "";
        setSecondsElapsed(0);
        setViewMode("interview");
        viewModeRef.current = "interview";
        setLoading(false);

        // Approximately 5.5-second silent preparation delay inside interview room (No countdown UI)
        setTimeout(() => {
          setIsPreparing(false);
          isPreparingRef.current = false;
          if (qList[0]?.question) {
            speakQuestion(qList[0].question, getInterviewerForQuestion(qList[0], 0));
          }
        }, 5500);
      } else {
        setIsPreparing(false);
        isPreparingRef.current = false;
        setError("Unable to initialize mock interview questions. Please try again.");
      }
    } catch (err) {
      console.error("Start interview error:", err);
      setIsPreparing(false);
      isPreparingRef.current = false;
      setError("Failed to start mock interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Current Mock Question (Strict Uniqueness, Question Bank + AI Fallback & Double-Click Protection)
  const handleRegenerateCurrentQuestion = async () => {
    console.log("[REGENERATE] Button clicked");
    if (questions.length === 0 || isRegeneratingQ || isPreparingRef.current) {
      console.log("[REGENERATE] Aborted: questions.length =", questions.length, "isRegeneratingQ =", isRegeneratingQ, "isPreparing =", isPreparingRef.current);
      return;
    }
    const currentQ = questions[currentQIndex];
    if (!currentQ) {
      console.log("[REGENERATE] Aborted: currentQ is undefined for index", currentQIndex);
      return;
    }

    // Cancel any pending transition state if user manually requests regeneration
    if (isTransitioningRef.current || isTransitioning) {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }

    // Immediately stop any ongoing speech synthesis & speech recognition
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    stopSpeechRecognition();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsRegeneratingQ(true);
    setError("");

    const effectiveCareerField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    // Scope exclusion to questions previously answered, current question, and recent history
    const previouslyAnsweredQuestions = questions.slice(0, currentQIndex).map((q) => q.question);
    const recentHistory = getStoredInterviewHistory();
    const combinedExclusion = Array.from(
      new Set([
        ...recentHistory,
        ...sessionAskedQuestions,
        ...previouslyAnsweredQuestions,
        currentQ.question,
        "Tell me about yourself.",
      ].filter(Boolean))
    );

    console.log("[REGENERATE] Current question:", currentQ.question);
    console.log("[REGENERATE] Used / Excluded questions count:", combinedExclusion.length);
    console.log("[REGENERATE] Target Career Field:", effectiveCareerField, "| Target Level:", currentQ.level || experienceLevel);

    let newQuestionObj = null;

    console.log("[REGENERATE] Requesting verified relevant question from AI engine...");
    try {
      const response = await regenerateMockQuestion({
        careerField: effectiveCareerField,
        role: role.trim() || "Engineering Professional",
        experienceLevel,
        difficulty: currentQ.level,
        level: currentQ.level,
        skills: skills.trim(),
        education: resumeData?.professional?.education || "",
        experience: resumeData?.professional?.experience || "",
        projects: resumeData?.professional?.projects || "",
        certifications: resumeData?.professional?.certifications || "",
        candidateName: resumeData?.personal?.name || user?.name || "",
        objective: resumeData?.professional?.objective || "",
        resumeData: resumeData,
        jobDescription: jobDescription.trim(),
        currentQuestion: currentQ.question,
        askedQuestions: combinedExclusion,
        recentQuestions: recentHistory,
        sessionId,
        sessionCount,
      });

      console.log("[REGENERATE] AI Engine response received:", response);
      const qObj = response?.question || response?.data?.question || response;
      if (qObj && qObj.question && typeof qObj.question === "string") {
        newQuestionObj = qObj;
        console.log("[REGENERATE] AI Engine question parsed:", newQuestionObj.question);
      }
    } catch (apiErr) {
      console.error("[REGENERATE] ERROR during AI regeneration call:", apiErr);
    }

    try {
      if (newQuestionObj && newQuestionObj.question && typeof newQuestionObj.question === "string") {
        const newQuestion = newQuestionObj.question.trim();
        console.log("[REGENERATE] Selected question:", newQuestion);
        console.log("[REGENERATE] Updating question state");

        const updatedQuestions = [...questions];
        updatedQuestions[currentQIndex] = {
          ...currentQ,
          question: newQuestion,
          keyConcepts: newQuestionObj.keyConcepts || currentQ.keyConcepts || ["Core Principles"],
          hint: newQuestionObj.hint || currentQ.hint || "Explain your technical thought process.",
        };

        setQuestions(updatedQuestions);
        questionsRef.current = updatedQuestions;
        setSessionAskedQuestions((prev) => Array.from(new Set([...prev, currentQ.question, newQuestion])));
        appendToInterviewHistory([newQuestion]);
        setCurrentAnswer("");
        currentAnswerRef.current = "";
        setUserAnswers((prev) => ({ ...prev, [currentQIndex]: "" }));

        console.log("[REGENERATE] Question state updated successfully");
        speakQuestion(newQuestion, getInterviewerForQuestion(updatedQuestions[currentQIndex], currentQIndex));
      } else {
        console.warn("[REGENERATE] All questions exhausted for this category");
        setError("All available questions for this category have been used. You can proceed with the current question.");
      }
    } catch (error) {
      console.error("[REGENERATE] ERROR updating question state:", error);
      setError(error.message || "Failed to generate a new question. Please try clicking Regenerate again.");
    } finally {
      setIsRegeneratingQ(false);
      console.log("[REGENERATE] Reset loading state (isRegeneratingQ = false)");
    }
  };

  // Next Question or Finish Interview
  const handleSubmitAnswer = async () => {
    stopSpeechRecognition();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    // Save answer
    const updatedAnswers = {
      ...userAnswers,
      [currentQIndex]: currentAnswer.trim(),
    };
    setUserAnswers(updatedAnswers);

    // If more questions remain, advance to next question
    if (currentQIndex < questions.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setCurrentAnswer(updatedAnswers[nextIdx] || "");

      // Auto-speak next question
      setTimeout(() => {
        if (questions[nextIdx]?.question) {
          speakQuestion(questions[nextIdx].question, getInterviewerForQuestion(questions[nextIdx], nextIdx));
        }
      }, 300);
    } else {
      // All questions answered -> Finish and Evaluate!
      await handleCompleteInterview(updatedAnswers);
    }
  };

  // End Interview & Send Evaluation Request
  const handleCompleteInterview = async (finalAnswers) => {
    setLoading(true);
    setError("");

    // Speak natural closing statement from the active panel member
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const closingUtterance = new SpeechSynthesisUtterance(
        "That covers all the questions our interview panel had for you today. Thank you for your time, and best of luck! We're finalizing your evaluation report now."
      );
      closingUtterance.rate = 0.96;
      closingUtterance.pitch = activeInterviewer?.voicePitch || 1.0;
      const voices = (cachedSpeechVoices && cachedSpeechVoices.length > 0)
        ? cachedSpeechVoices
        : (window.speechSynthesis.getVoices() || []);
      if (activeInterviewer?.gender === "male") {
        const maleVoice = voices.find((v) => {
          const name = (v.name || "").toLowerCase();
          const lang = (v.lang || "").toLowerCase();
          return lang.startsWith("en") && (name.includes("male") || name.includes("david") || name.includes("george") || name.includes("alex"));
        });
        if (maleVoice) closingUtterance.voice = maleVoice;
      } else {
        const femaleVoice = voices.find((v) => {
          const name = (v.name || "").toLowerCase();
          const lang = (v.lang || "").toLowerCase();
          return lang.startsWith("en") && (name.includes("female") || name.includes("zira") || name.includes("samantha") || name.includes("google us english"));
        });
        if (femaleVoice) closingUtterance.voice = femaleVoice;
      }
      try {
        window.speechSynthesis.speak(closingUtterance);
      } catch (e) {}
    }

    const effectiveCareerField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    // Build QA transcript payload using the actual submitted answers
    const sourceAnswers = finalAnswers || userAnswers;
    const qaList = questions.map((q, idx) => ({
      level: q.level,
      question: q.question,
      answer: sourceAnswers[idx] !== undefined && sourceAnswers[idx] !== null ? sourceAnswers[idx] : "No response provided",
    }));

    try {
      const response = await evaluateMockInterview({
        careerField: effectiveCareerField,
        role: role.trim(),
        experienceLevel,
        skills: skills.trim(),
        education: resumeData?.professional?.education || "",
        experience: resumeData?.professional?.experience || "",
        projects: resumeData?.professional?.projects || "",
        certifications: resumeData?.professional?.certifications || "",
        candidateName: resumeData?.personal?.name || user?.name || "",
        resumeData: resumeData,
        qaList,
      });

      if (response.evaluation) {
        setEvaluation(response.evaluation);
        const defaultExpanded = {};
        if (Array.isArray(response.evaluation.detailedFeedback)) {
          response.evaluation.detailedFeedback.forEach((_, idx) => {
            defaultExpanded[idx] = true;
          });
        }
        setExpandedEvalDetails(defaultExpanded);
        setViewMode("result");
        stopMediaStream();
      } else {
        setError("Unable to process interview evaluation. Please try again.");
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setError("Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
      setShowEndModal(false);
    }
  };

  // Reset Mock Interview to Setup
  const handleRetryInterview = () => {
    setViewMode("setup");
    setQuestions([]);
    // Retain persistent interview history so the next interview generates fresh questions
    setSessionAskedQuestions([]);
    setCurrentQIndex(0);
    setUserAnswers({});
    setCurrentAnswer("");
    setEvaluation(null);
    setSecondsElapsed(0);
    setError("");
    stopMediaStream();
  };

  // ==========================================
  // Practice Question Bank Handlers
  // ==========================================
  const handleGenerateQuestionBank = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!role.trim()) {
      setError("Please enter your Target Job Role.");
      return;
    }

    const effectiveCareerField = careerField === "Other"
      ? (customField.trim() || "Other Discipline")
      : careerField.trim();

    setBankLoading(true);

    try {
      const response = await generateInterviewQuestions({
        careerField: effectiveCareerField,
        role: role.trim(),
        difficulty: experienceLevel,
        skills: skills.trim(),
        education: resumeData?.professional?.education || "",
        experience: resumeData?.professional?.experience || "",
        projects: resumeData?.professional?.projects || "",
        certifications: resumeData?.professional?.certifications || "",
        candidateName: resumeData?.personal?.name || user?.name || "",
        jobDescription: jobDescription.trim(),
      });

      if (response.data) {
        setBankData(response.data);
        setExpandedBankAnswers({});
      } else {
        setError("Unable to generate AI question bank. Please try again.");
      }
    } catch (err) {
      console.error("Question bank error:", err);
      setError("Failed to generate question bank. Please try again.");
    } finally {
      setBankLoading(false);
    }
  };

  const toggleBankAnswer = (categoryIdx, questionIdx) => {
    const key = `${categoryIdx}-${questionIdx}`;
    setExpandedBankAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyBankQuestion = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedBankIdx(idx);
    setTimeout(() => setCopiedBankIdx(null), 2500);
  };

  // Helper for Difficulty Level Badge Class
  const getLevelBadge = (lvl) => {
    switch (lvl?.toLowerCase()) {
      case "basic":
        return <span className="badge bg-info px-3 py-2 fs-6">🟢 Level 1: Basic</span>;
      case "intermediate":
        return <span className="badge bg-warning text-dark px-3 py-2 fs-6">🟡 Level 2: Intermediate</span>;
      case "advanced":
        return <span className="badge bg-danger px-3 py-2 fs-6">🔴 Level 3: Advanced</span>;
      default:
        return <span className="badge bg-primary px-3 py-2 fs-6">{lvl}</span>;
    }
  };

  // Helper for Score Tier Badge Class
  const getTierBadgeClass = (score) => {
    if (score >= 90) return "badge bg-success fs-6";
    if (score >= 75) return "badge bg-success fs-6";
    if (score >= 60) return "badge bg-primary fs-6";
    if (score >= 40) return "badge bg-warning text-dark fs-6";
    return "badge bg-danger fs-6";
  };

  // Helper for Question Score Badge Class
  const getQuestionScoreBadgeClass = (score) => {
    if (score >= 70) return "badge bg-success";
    if (score >= 40) return "badge bg-warning text-dark";
    return "badge bg-danger";
  };

  return (
    <div className={`d-flex flex-column ${viewMode === "interview" ? "overflow-hidden" : "min-vh-100 bg-light"}`}>
      {viewMode !== "interview" && <Navbar />}

      <div className={viewMode === "interview" ? "" : "container py-4 flex-grow-1"}>
        {/* ========================================================================= */}
        {/* VIEW 1: SETUP FORM SCREEN                                                */}
        {/* ========================================================================= */}
        {viewMode === "setup" && (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-4">
                <span className="badge bg-primary px-3 py-2 fs-6 mb-2">
                  Interactive AI Mock Interview Studio
                </span>
                <h2 className="text-dark fw-bold mb-1">🎙️ AI Mock Online Interview</h2>
                <p className="text-muted">
                  Simulate a realistic online video interview with a 2-interviewer AI panel (Male HR Lead + Female Technical Lead) across any engineering or academic discipline
                </p>
              </div>

              {/* Navigation Mode Tabs */}
              <div className="d-flex justify-content-center mb-4">
                <div className="btn-group p-1 bg-white border rounded-pill shadow-sm" role="group">
                  <button
                    type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${
                      activeTab === "mock" ? "btn-primary shadow-sm" : "btn-light text-secondary"
                    }`}
                    onClick={() => setActiveTab("mock")}
                  >
                    🎥 Live AI Mock Interview
                  </button>
                  <button
                    type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${
                      activeTab === "bank" ? "btn-primary shadow-sm" : "btn-light text-secondary"
                    }`}
                    onClick={() => setActiveTab("bank")}
                  >
                    📚 Practice Question Bank
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show shadow-sm mb-4" role="alert">
                  <strong>⚠️ {error}</strong>
                  <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
                </div>
              )}

              {/* Form Card */}
              <div className="card shadow-sm border-0 p-4 p-md-5 bg-white mb-4">
                {autoFilled && (
                  <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-center justify-content-between small">
                    <span>✨ <strong>Auto-filled from your saved resume:</strong> Review or modify your target role, career field & skills below anytime.</span>
                    <button type="button" className="btn-close btn-sm" onClick={() => setAutoFilled(false)} aria-label="Close"></button>
                  </div>
                )}
                <form
                  onSubmit={
                    activeTab === "mock"
                      ? handleProceedToDeviceCheck
                      : (e) => handleGenerateQuestionBank(e, false)
                  }
                >
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Career Field / Industry <span className="text-muted small">(Optional / Recommended)</span>
                      </label>
                      <select
                        className="form-select"
                        value={careerField}
                        onChange={(e) => setCareerField(e.target.value)}
                      >
                        <option value="">-- Select Career Field / Industry --</option>
                        {CAREER_FIELDS.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>

                      {careerField === "Other" && (
                        <div className="mt-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Specify your field (e.g. Food Technology, Architecture, Law, Agriculture)"
                            value={customField}
                            onChange={(e) => setCustomField(e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Target Job Role / Position <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Mechanical Design Engineer, Process Engineer, Civil Engineer, Frontend Dev"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Experience Level</label>
                      <select
                        className="form-select"
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                      >
                        <option value="Beginner / Fresher (0-2 years)">Beginner / Fresher (0-2 years)</option>
                        <option value="Intermediate (2-5 years)">Intermediate (2-5 years)</option>
                        <option value="Advanced / Senior (5+ years)">Advanced / Senior (5+ years)</option>
                        <option value="Lead / Principal">Lead / Principal</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Key Skills / Tools to Emphasize</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. AutoCAD, SolidWorks, FEA / Thermodynamics, Aspen Plus / React, SQL"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Job Description / Company Notes (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Paste specific job requirements or company context to tailor interview..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="col-12 d-flex justify-content-between align-items-center mt-4 pt-2 border-top">
                      <div className="small text-muted">
                        {activeTab === "mock" ? (
                          <span>
                            🎥 Includes <strong>9 Progressive Questions</strong> (3 Basic → 3 Intermediate → 3 Advanced) + Live AI Scoring
                          </span>
                        ) : (
                          <span>📚 Full categorized question bank with model talking points</span>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary px-4 py-2 fw-bold shadow-sm">
                        {activeTab === "mock" ? (
                          "Continue to Device & Camera Setup →"
                        ) : bankLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Generating Question Bank...
                          </>
                        ) : (
                          "Generate Question Bank →"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Practice Question Bank Result (if tab is bank and bankData available) */}
              {activeTab === "bank" && bankData && (
                <div className="card shadow border-0 p-4 p-md-5 bg-white">
                  <div className="border-bottom pb-3 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-success px-3 py-1">{bankData.difficulty} Level</span>
                      <span className="badge bg-primary px-3 py-1">
                        📚 {bankData.totalQuestions || bankData.categories?.reduce((acc, cat) => acc + (cat.questions?.length || 0), 0) || 50} Practice Questions
                      </span>
                    </div>
                    <h4 className="fw-bold text-dark mb-0">{bankData.role} Question Bank</h4>
                  </div>

                  {bankData.categories?.map((cat, catIdx) => (
                    <div key={catIdx} className="mb-4">
                      <h5 className="fw-bold text-primary mb-2">📌 {cat.name}</h5>
                      <div className="d-flex flex-column gap-3">
                        {cat.questions?.map((q, qIdx) => {
                          const key = `${catIdx}-${qIdx}`;
                          const isExpanded = !!expandedBankAnswers[key];
                          return (
                            <div key={qIdx} className="p-3 bg-light rounded border">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <h6 className="fw-bold text-dark mb-1">
                                  Q{qIdx + 1}: {q.question}
                                </h6>
                                <button
                                  className="btn btn-sm btn-outline-secondary text-nowrap"
                                  onClick={() => copyBankQuestion(q.question, key)}
                                >
                                  {copiedBankIdx === key ? "✅ Copied" : "📋 Copy"}
                                </button>
                              </div>
                              {q.modelAnswer && (
                                <div className="mt-2">
                                  <button
                                    className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                                    onClick={() => toggleBankAnswer(catIdx, qIdx)}
                                  >
                                    {isExpanded ? "▲ Hide Answer" : "▼ Show Model Talking Points"}
                                  </button>
                                  {isExpanded && (
                                    <div className="p-3 bg-white rounded border mt-2 small text-secondary">
                                      {q.modelAnswer}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DEVICE PERMISSION & CAMERA CHECK SCREEN                           */}
        {/* ========================================================================= */}
        {viewMode === "permission_check" && (
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="card shadow-sm border-0 p-4 p-md-5 bg-white">
                <div className="text-center mb-4">
                  <span className="badge bg-primary px-3 py-1 mb-2">Device & Camera Verification</span>
                  <h3 className="fw-bold text-dark mb-1">📹 Check Your Camera & Audio Setup</h3>
                  <p className="text-muted small">
                    Position yourself well in frame and verify your microphone is active before entering the interview room.
                  </p>
                </div>

                {permissionErrorMsg && (
                  <div className="alert alert-warning border-0 shadow-sm mb-4">
                    <strong>⚠️ Note:</strong> {permissionErrorMsg}
                  </div>
                )}

                <div className="row g-4 align-items-center mb-4">
                  {/* Live Video Preview Box */}
                  <div className="col-md-7">
                    <div
                      className="position-relative bg-dark rounded-4 overflow-hidden shadow d-flex align-items-center justify-content-center"
                      style={{ aspectRatio: "4/3", minHeight: "260px" }}
                    >
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-100 h-100 object-fit-cover ${cameraActive ? "" : "d-none"}`}
                      />

                      {!cameraActive && (
                        <div className="text-center text-white p-4">
                          <div className="fs-1 mb-2">📷</div>
                          <h6 className="fw-bold mb-1">Camera Feed Disabled</h6>
                          <p className="text-white-50 small mb-3">
                            {cameraPermissionState === "denied"
                              ? "Browser permission was not granted."
                              : "Click below to grant camera access"}
                          </p>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light px-3"
                            onClick={requestMediaPermissions}
                          >
                            Grant Camera Access
                          </button>
                        </div>
                      )}

                      {/* Overlays */}
                      <div className="position-absolute top-0 start-0 m-3">
                        <span className="badge bg-dark bg-opacity-75 text-white border border-secondary px-2 py-1 small">
                          👤 Candidate Preview
                        </span>
                      </div>
                      <div className="position-absolute bottom-0 start-0 m-3 d-flex gap-2">
                        <span className={`badge ${cameraActive ? "bg-success" : "bg-secondary"}`}>
                          {cameraActive ? "📷 Camera: Active" : "📷 Camera: Off"}
                        </span>
                        <span className={`badge ${micActive ? "bg-success" : "bg-warning text-dark"}`}>
                          {micActive ? "🎤 Mic: Active" : "🔇 Mic: Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device Control Checklist */}
                  <div className="col-md-5">
                    <h5 className="fw-bold text-dark mb-3">Interview Checklist</h5>
                    <div className="d-flex flex-column gap-3 mb-4">
                      <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="d-block text-dark">Webcam Status</strong>
                          <span className="small text-muted">
                            {cameraActive ? "Connected & Ready" : "Camera not active"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${cameraActive ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={toggleCamera}
                          disabled={!mediaStreamRef.current}
                        >
                          {cameraActive ? "Turn Off" : "Turn On"}
                        </button>
                      </div>

                      <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="d-block text-dark">Microphone Status</strong>
                          <span className="small text-muted">
                            {micActive ? "Audio Ready" : "Microphone Muted"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`btn btn-sm ${micActive ? "btn-outline-danger" : "btn-outline-success"}`}
                          onClick={toggleMic}
                          disabled={!mediaStreamRef.current}
                        >
                          {micActive ? "Mute" : "Unmute"}
                        </button>
                      </div>

                      <div className="p-3 bg-light rounded-3 border">
                        <strong className="d-block text-dark">Speech-to-Text</strong>
                        <span className="small text-muted">
                          {speechSupported
                            ? "✅ Browser voice transcription supported"
                            : "⚠️ Voice transcription unavailable (Use manual typing fallback)"}
                        </span>
                      </div>
                    </div>

                    <div className="alert alert-info border-0 py-2 small mb-0">
                      💡 <strong>Tip:</strong> Speak clearly into your mic. You can also edit or type your answers manually at any point.
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      stopMediaStream();
                      setViewMode("setup");
                    }}
                  >
                    ← Back to Setup
                  </button>

                  <button
                    type="button"
                    className="btn btn-success btn-lg px-5 fw-bold shadow"
                    onClick={handleStartInterview}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Connecting to AI Interview Panel...
                      </>
                    ) : (
                      "🚀 Start Interview Room →"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FULL-SCREEN REAL AI MOCK INTERVIEW ROOM                           */}
        {/* ========================================================================= */}
        {viewMode === "interview" && questions.length > 0 && (
          <div
            className="position-fixed top-0 start-0 w-100 vh-100 d-flex flex-column"
            style={{
              backgroundColor: "#070b14",
              backgroundImage:
                "radial-gradient(ellipse 80% 70% at 50% -10%, rgba(37, 99, 235, 0.18), rgba(7, 11, 20, 0.98))",
              color: "#f8fafc",
              zIndex: 1050,
              overflow: "hidden",
            }}
          >
            {/* Embedded Keyframe Animations */}
            <style>{`
              @keyframes hrPulseSpeaking {
                0% {
                  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 35px rgba(59, 130, 246, 0.4);
                  transform: scale(1);
                }
                50% {
                  box-shadow: 0 0 0 20px rgba(59, 130, 246, 0), 0 0 55px rgba(59, 130, 246, 0.9);
                  transform: scale(1.05);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 0 35px rgba(59, 130, 246, 0.4);
                  transform: scale(1);
                }
              }
              @keyframes techPulseSpeaking {
                0% {
                  box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7), 0 0 35px rgba(168, 85, 247, 0.4);
                  transform: scale(1);
                }
                50% {
                  box-shadow: 0 0 0 20px rgba(168, 85, 247, 0), 0 0 55px rgba(168, 85, 247, 0.9);
                  transform: scale(1.05);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(168, 85, 247, 0), 0 0 35px rgba(168, 85, 247, 0.4);
                  transform: scale(1);
                }
              }
              @keyframes avatarListening {
                0%, 100% {
                  box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
                  transform: scale(1);
                }
                50% {
                  box-shadow: 0 0 30px rgba(16, 185, 129, 0.75);
                  transform: scale(1.02);
                }
              }
              @keyframes audioWaveAnim {
                0%, 100% { height: 6px; opacity: 0.35; }
                50% { height: 26px; opacity: 1; }
              }
              .hr-avatar-speaking {
                animation: hrPulseSpeaking 2s infinite ease-in-out;
                border: 4px solid #3b82f6 !important;
              }
              .tech-avatar-speaking {
                animation: techPulseSpeaking 2s infinite ease-in-out;
                border: 4px solid #a855f7 !important;
              }
              .avatar-listening {
                animation: avatarListening 2.4s infinite ease-in-out;
                border: 4px solid #10b981 !important;
              }
              .interviewer-card {
                transition: all 0.35s ease;
              }
              .interviewer-card.active-panel {
                opacity: 1;
                transform: translateY(0);
              }
              .interviewer-card.inactive-panel {
                opacity: 0.52;
                filter: saturate(0.65) brightness(0.85);
                transform: scale(0.96);
              }
              .audio-bar {
                width: 4px;
                background: linear-gradient(180deg, #38bdf8, #a855f7);
                border-radius: 4px;
                display: inline-block;
                margin: 0 2px;
              }
            `}</style>

            {/* Live Error Notification Toast */}
            {error && (
              <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-3 shadow-lg" style={{ minWidth: "320px", maxWidth: "90%" }}>
                <div className="alert alert-danger alert-dismissible fade show mb-0 py-2 border-0 shadow" role="alert">
                  <strong>⚠️ {error}</strong>
                  <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close"></button>
                </div>
              </div>
            )}

            {/* 1. TOP INTERVIEW HUD BAR */}
            <header
              className="px-3 px-md-4 py-2 d-flex justify-content-between align-items-center flex-shrink-0"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.95)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
                minHeight: "60px",
              }}
            >
              {/* Left: Branding & Role */}
              <div className="d-flex align-items-center gap-2 gap-md-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-black fs-5 text-white tracking-wide" style={{ letterSpacing: "-0.5px" }}>
                    Career<span className="text-primary">Matrix</span>
                  </span>
                  <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 small px-2 py-1">
                    ● Dual AI Interview Panel
                  </span>
                </div>

                <div className="d-none d-lg-block text-secondary small border-start border-secondary border-opacity-50 ps-3">
                  🎯 <strong className="text-light">{role}</strong>
                </div>
              </div>

              {/* Middle: Difficulty Level, Career Field & Dynamic Question Counter */}
              <div className="d-flex align-items-center gap-2 gap-md-3">
                {getLevelBadge(questions[currentQIndex]?.level)}
                <span className="badge bg-dark text-light border border-secondary border-opacity-50 px-2 py-1 small">
                  Industry Field: {careerField || "General Engineering"}
                </span>
                <span className="badge bg-primary px-3 py-1 fs-6 shadow-sm">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Right: Timer & End Interview Action */}
              <div className="d-flex align-items-center gap-2 gap-md-3">
                <div
                  className="px-3 py-1 rounded-pill fw-mono fw-bold small text-light d-flex align-items-center gap-1"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <span>⏱️</span>
                  <span>{formatTime(secondsElapsed)}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3 fw-semibold shadow-sm"
                  onClick={() => setShowEndModal(true)}
                >
                  ⏹️ End Interview
                </button>
              </div>
            </header>

            {/* 2. MAIN CENTER STAGE — DUAL AI INTERVIEWER PANEL & CORNER CANDIDATE CAM */}
            <main className="flex-grow-1 position-relative d-flex flex-column align-items-center justify-content-center px-3 py-2">
              {/* Floating Corner Candidate Video Tile (Top-Right of Arena) */}
              <div
                className="position-absolute shadow-lg rounded-4 overflow-hidden"
                style={{
                  top: "16px",
                  right: "24px",
                  width: "210px",
                  aspectRatio: "16/10",
                  backgroundColor: "#0d1322",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  zIndex: 15,
                }}
              >
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-100 h-100 object-fit-cover ${cameraActive ? "" : "d-none"}`}
                />

                {!cameraActive && (
                  <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center p-2 text-center text-white-50">
                    <div className="fs-3 mb-1">👤</div>
                    <span style={{ fontSize: "11px" }}>Camera Off</span>
                  </div>
                )}

                {/* Candidate Video Overlay Header & Controls */}
                <div className="position-absolute top-0 start-0 m-1">
                  <span
                    className="badge bg-dark bg-opacity-75 text-white border border-secondary px-1 py-0"
                    style={{ fontSize: "10px" }}
                  >
                    👤 Candidate (You)
                  </span>
                </div>

                <div className="position-absolute bottom-0 start-0 w-100 p-1 d-flex justify-content-between align-items-center bg-dark bg-opacity-75">
                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className={`btn btn-xs py-0 px-1 ${cameraActive ? "btn-dark" : "btn-danger"} text-white border-0`}
                      style={{ fontSize: "10px" }}
                      onClick={toggleCamera}
                    >
                      {cameraActive ? "Cam On" : "Cam Off"}
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs py-0 px-1 ${micActive ? "btn-dark" : "btn-danger"} text-white border-0`}
                      style={{ fontSize: "10px" }}
                      onClick={toggleMic}
                    >
                      {micActive ? "Mic On" : "Muted"}
                    </button>
                  </div>

                  {isListening && (
                    <span className="badge bg-danger p-1 animate-pulse" style={{ fontSize: "9px" }}>
                      ● REC
                    </span>
                  )}
                </div>
              </div>

              {/* ============================================================ */}
              {/* DUAL AI INTERVIEWER PANEL: MALE HR + FEMALE TECHNICAL       */}
              {/* ============================================================ */}
              <div className="w-100 d-flex flex-column align-items-center" style={{ maxWidth: "860px", marginBottom: "95px" }}>
                {/* Panel Header & Live Interaction Status */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-dark text-white-50 border border-secondary border-opacity-50 px-3 py-1">
                    👥 AI Interview Panel
                  </span>
                  {loading ? (
                    <span className="badge bg-warning text-dark px-3 py-1 shadow-sm">
                      ⏳ Evaluating response...
                    </span>
                  ) : isPreparing ? (
                    <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-50 px-3 py-1 shadow-sm">
                      ● Panel Preparing Interview...
                    </span>
                  ) : isTransitioning ? (
                    <span className="badge bg-warning text-dark px-3 py-1 shadow-sm">
                      ⏳ Evaluating response & preparing next question...
                    </span>
                  ) : isRegeneratingQ ? (
                    <span className="badge bg-info text-dark px-3 py-1 shadow-sm">
                      🔄 Regenerating question...
                    </span>
                  ) : isSpeakingQuestion ? (
                    <span
                      className={`badge ${isHrActive ? "bg-primary" : ""} px-3 py-1 shadow-sm`}
                      style={isTechActive ? { backgroundColor: "#9333ea", color: "#fff" } : {}}
                    >
                      🗣️ {activeInterviewer.name} is Speaking
                    </span>
                  ) : isListening ? (
                    <span className="badge bg-success px-3 py-1 shadow-sm animate-pulse">
                      🎧 Panel is Listening to Your Answer
                    </span>
                  ) : (
                    <span className="badge bg-dark text-success border border-success px-3 py-1 shadow-sm">
                      🟢 Live Panel Active
                    </span>
                  )}
                </div>

                {/* Side-by-Side Dual Interviewers Grid */}
                <div className="row g-3 g-md-4 w-100 justify-content-center align-items-stretch">
                  {/* 1. MALE AI INTERVIEWER — HR (Marcus Vance) */}
                  <div className="col-12 col-md-5">
                    <div
                      className={`interviewer-card h-100 p-3 p-md-4 rounded-4 text-center d-flex flex-column align-items-center justify-content-between shadow-lg ${
                        isHrActive ? "active-panel" : "inactive-panel"
                      }`}
                      style={{
                        backgroundColor: isHrActive ? "rgba(15, 23, 42, 0.88)" : "rgba(11, 17, 32, 0.55)",
                        border: isHrActive
                          ? "2px solid rgba(59, 130, 246, 0.85)"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        boxShadow: isHrActive
                          ? "0 0 35px rgba(59, 130, 246, 0.25), 0 10px 30px rgba(0, 0, 0, 0.6)"
                          : "0 4px 20px rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      {/* Top Tag & Active State Chip */}
                      <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                        <span
                          className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 px-2 py-0"
                          style={{ fontSize: "10px" }}
                        >
                          HR & Behavioral
                        </span>
                        {isHrActive ? (
                          <span
                            className={`badge ${isSpeakingQuestion ? "bg-primary" : isListening ? "bg-success" : "bg-primary"} px-2 py-0`}
                            style={{ fontSize: "10px" }}
                          >
                            {isSpeakingQuestion ? "🗣️ Asking" : isListening ? "🎧 Listening" : "● Active"}
                          </span>
                        ) : (
                          <span className="badge bg-dark text-white-50 border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                            👁️ Observing
                          </span>
                        )}
                      </div>

                      {/* Large Male Avatar Circle with Dynamic Pulsing */}
                      <div
                        className={`rounded-circle overflow-hidden d-flex align-items-center justify-content-center my-2 shadow-lg ${
                          isHrActive && isSpeakingQuestion
                            ? "hr-avatar-speaking"
                            : isHrActive && isListening
                            ? "avatar-listening"
                            : ""
                        }`}
                        style={{
                          width: "115px",
                          height: "115px",
                          backgroundColor: "#172554",
                          border: isHrActive ? "3px solid #3b82f6" : "2px solid rgba(255, 255, 255, 0.15)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <MaleHRAvatar active={isHrActive} speaking={isSpeakingQuestion && isHrActive} />
                      </div>

                      {/* Interviewer Info */}
                      <div className="mt-1">
                        <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: "-0.3px" }}>
                          Marcus Vance
                        </h5>
                        <div className="small text-info fw-semibold mb-1">
                          AI HR Interviewer
                        </div>
                        <p className="text-white-50 small mb-2" style={{ fontSize: "11px", lineHeight: "1.3" }}>
                          HR & Behavioral Lead • STAR Assessment • Culture & Teamwork
                        </p>
                      </div>

                      {/* Focus Tags */}
                      <div className="d-flex flex-wrap gap-1 justify-content-center">
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Introduction
                        </span>
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Behavioral / STAR
                        </span>
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Situational
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. FEMALE AI INTERVIEWER — TECHNICAL (Dr. Elena Rostova) */}
                  <div className="col-12 col-md-5">
                    <div
                      className={`interviewer-card h-100 p-3 p-md-4 rounded-4 text-center d-flex flex-column align-items-center justify-content-between shadow-lg ${
                        isTechActive ? "active-panel" : "inactive-panel"
                      }`}
                      style={{
                        backgroundColor: isTechActive ? "rgba(15, 23, 42, 0.88)" : "rgba(11, 17, 32, 0.55)",
                        border: isTechActive
                          ? "2px solid rgba(168, 85, 247, 0.85)"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        boxShadow: isTechActive
                          ? "0 0 35px rgba(168, 85, 247, 0.25), 0 10px 30px rgba(0, 0, 0, 0.6)"
                          : "0 4px 20px rgba(0, 0, 0, 0.4)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      {/* Top Tag & Active State Chip */}
                      <div className="w-100 d-flex justify-content-between align-items-center mb-2">
                        <span
                          className="badge px-2 py-0"
                          style={{
                            fontSize: "10px",
                            backgroundColor: "rgba(168, 85, 247, 0.2)",
                            color: "#d8b4fe",
                            border: "1px solid rgba(216, 180, 254, 0.4)",
                          }}
                        >
                          Technical & Domain
                        </span>
                        {isTechActive ? (
                          <span
                            className={`badge ${isSpeakingQuestion ? "" : isListening ? "bg-success" : ""} px-2 py-0`}
                            style={!isListening ? { backgroundColor: "#9333ea", color: "#fff", fontSize: "10px" } : { fontSize: "10px" }}
                          >
                            {isSpeakingQuestion ? "🗣️ Asking" : isListening ? "🎧 Listening" : "● Active"}
                          </span>
                        ) : (
                          <span className="badge bg-dark text-white-50 border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                            👁️ Observing
                          </span>
                        )}
                      </div>

                      {/* Large Female Avatar Circle with Dynamic Pulsing */}
                      <div
                        className={`rounded-circle overflow-hidden d-flex align-items-center justify-content-center my-2 shadow-lg ${
                          isTechActive && isSpeakingQuestion
                            ? "tech-avatar-speaking"
                            : isTechActive && isListening
                            ? "avatar-listening"
                            : ""
                        }`}
                        style={{
                          width: "115px",
                          height: "115px",
                          backgroundColor: "#2e1065",
                          border: isTechActive ? "3px solid #a855f7" : "2px solid rgba(255, 255, 255, 0.15)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <FemaleTechAvatar active={isTechActive} speaking={isSpeakingQuestion && isTechActive} />
                      </div>

                      {/* Interviewer Info */}
                      <div className="mt-1">
                        <h5 className="fw-bold text-white mb-0" style={{ letterSpacing: "-0.3px" }}>
                          Dr. Elena Rostova
                        </h5>
                        <div className="small fw-semibold mb-1" style={{ color: "#d8b4fe" }}>
                          AI Technical Interviewer
                        </div>
                        <p className="text-white-50 small mb-2" style={{ fontSize: "11px", lineHeight: "1.3" }}>
                          Domain & Technical Lead • Architecture • Applied Engineering
                        </p>
                      </div>

                      {/* Focus Tags */}
                      <div className="d-flex flex-wrap gap-1 justify-content-center">
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Domain Core
                        </span>
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Architecture
                        </span>
                        <span className="badge bg-dark text-light border border-secondary border-opacity-25 px-2 py-0" style={{ fontSize: "10px" }}>
                          Problem Solving
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Audio Wave Visualizer */}
                <div
                  className="d-flex align-items-center justify-content-center mt-3"
                  style={{ height: "24px", minWidth: "140px" }}
                >
                  {isSpeakingQuestion || isListening ? (
                    <>
                      <div className="audio-bar" style={{ animation: "audioWaveAnim 1.1s infinite 0.1s" }} />
                      <div className="audio-bar" style={{ animation: "audioWaveAnim 0.9s infinite 0.3s" }} />
                      <div className="audio-bar" style={{ animation: "audioWaveAnim 1.3s infinite 0.0s" }} />
                      <div className="audio-bar" style={{ animation: "audioWaveAnim 0.8s infinite 0.4s" }} />
                      <div className="audio-bar" style={{ animation: "audioWaveAnim 1.2s infinite 0.2s" }} />
                    </>
                  ) : isPreparing ? (
                    <span className="text-secondary small fst-italic" style={{ fontSize: "12px" }}>
                      Preparing interview session... Take a moment to prepare
                    </span>
                  ) : (
                    <span className="text-secondary small fst-italic" style={{ fontSize: "12px" }}>
                      Microphone active • Collaborative AI panel is ready for your answer
                    </span>
                  )}
                </div>
              </div>

              {/* 2B. LIVE FLOATING SUBTITLES & CURRENT QUESTION DISPLAY */}
              <div
                className="position-absolute bottom-0 start-50 translate-middle-x mb-3 px-4 py-3 rounded-4 shadow-lg text-center"
                style={{
                  maxWidth: "820px",
                  width: "92%",
                  backgroundColor: "rgba(11, 17, 32, 0.95)",
                  backdropFilter: "blur(16px)",
                  border: isSpeakingQuestion
                    ? isHrActive
                      ? "1px solid rgba(59, 130, 246, 0.65)"
                      : "1px solid rgba(168, 85, 247, 0.65)"
                    : "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: isSpeakingQuestion
                    ? isHrActive
                      ? "0 12px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(59, 130, 246, 0.35)"
                      : "0 12px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(168, 85, 247, 0.35)"
                    : "0 12px 36px rgba(0, 0, 0, 0.75)",
                  zIndex: 20,
                  pointerEvents: "none",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  {isPreparing ? (
                    <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-50 px-3 py-1" style={{ fontSize: "11px" }}>
                      ⏳ Interview Initializing
                    </span>
                  ) : isHrActive ? (
                    <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 px-3 py-1" style={{ fontSize: "11px" }}>
                      👨‍💼 Marcus Vance (AI HR Interviewer) {isSpeakingQuestion ? "Speaking..." : "Asked:"}
                    </span>
                  ) : (
                    <span
                      className="badge px-3 py-1"
                      style={{
                        fontSize: "11px",
                        backgroundColor: "rgba(168, 85, 247, 0.25)",
                        color: "#d8b4fe",
                        border: "1px solid rgba(216, 180, 254, 0.5)",
                      }}
                    >
                      👩‍💼 Dr. Elena Rostova (AI Technical Interviewer) {isSpeakingQuestion ? "Speaking..." : "Asked:"}
                    </span>
                  )}
                </div>
                <p className="text-white fw-semibold mb-0 fs-5 lh-base" style={{ letterSpacing: "-0.2px" }}>
                  {isPreparing
                    ? "Take a moment to prepare. Your interview will begin shortly."
                    : `"${questions[currentQIndex]?.question}"`}
                </p>
              </div>
            </main>

            {/* 3. COMPACT BOTTOM VOICE DOCK (100% Voice-Based, No Typing Box, No Manual Submit) */}
            <footer
              className="p-3 px-md-4 flex-shrink-0"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.98)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="container-fluid p-0" style={{ maxWidth: "960px" }}>
                {/* Dock Controls Row */}
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark text-success border border-success px-2 py-1 small">
                      MICROPHONE ON
                    </span>

                    <span className="text-secondary small d-none d-sm-inline">
                      {isPreparing
                        ? "Interview panel is preparing... Please take a moment to get ready."
                        : isSpeakingQuestion
                        ? `${activeInterviewer.name} (${activeInterviewer.roleLabel}) is speaking... Listening will resume automatically`
                        : isTransitioning
                        ? "AI Panel is evaluating your response and preparing next question..."
                        : isListening
                        ? (currentAnswer ? "Voice detected — finalizing answer on silence..." : `Listening to your voice for ${activeInterviewer.name}...`)
                        : "Microphone active"}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Repeat Question Button */}
                    <button
                      type="button"
                      className={`btn btn-sm ${isSpeakingQuestion ? (isHrActive ? "btn-primary" : "btn-secondary") : "btn-outline-primary"} text-white border-primary`}
                      onClick={() =>
                        speakQuestion(
                          questions[currentQIndex]?.question,
                          activeInterviewer,
                          "Sure, let me repeat that for you: " + questions[currentQIndex]?.question
                        )
                      }
                      disabled={isPreparing || isSpeakingQuestion}
                      title="Listen to question again"
                    >
                      🔊 {isSpeakingQuestion ? "Speaking..." : "Repeat Question"}
                    </button>

                    {/* Regenerate Question Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary text-light border-secondary"
                      onClick={handleRegenerateCurrentQuestion}
                      disabled={isPreparing || isRegeneratingQ}
                      title="Regenerate a new, different question for this interview stage"
                    >
                      {isRegeneratingQ ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          Regenerating...
                        </>
                      ) : (
                        "🔄 Regenerate Question"
                      )}
                    </button>

                    {/* Quick Done Speaking Chip (Optional instant advance) */}
                    {currentAnswer && !isTransitioning && !isSpeakingQuestion && !isPreparing && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success text-success border-success"
                        onClick={handleAutoSubmitAnswer}
                        title="Done speaking, advance immediately"
                      >
                        ✓ Done Speaking
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner if API fails */}
                {error && (
                  <div className="alert alert-danger py-1 px-3 mb-2 small text-center shadow-sm">
                    ⚠️ {error}
                  </div>
                )}

                {/* Candidate Live Speech Caption Display (Read-Only Voice Transcript) */}
                <div
                  className="p-3 rounded-3 text-center d-flex flex-column align-items-center justify-content-center shadow-inner"
                  style={{
                    backgroundColor: "#0d1322",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    minHeight: "70px",
                  }}
                >
                  {currentAnswer ? (
                    <div className="w-100">
                      <p className="text-light fw-medium mb-1 fs-6 lh-sm" style={{ letterSpacing: "-0.2px" }}>
                        "{currentAnswer}"
                      </p>
                      <span className="text-secondary small">
                        {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words captured • Finalizing automatically on silence
                      </span>
                    </div>
                  ) : (
                    <div className="text-secondary small fst-italic">
                      {isPreparing
                        ? "Take a deep breath and get comfortable. The interview will start shortly..."
                        : isSpeakingQuestion
                        ? "Listen carefully to the question..."
                        : isTransitioning
                        ? "Evaluating your answer and preparing next question..."
                        : "Microphone active. Speak your answer naturally into your microphone..."}
                    </div>
                  )}
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: EVALUATION & RESULTS SCREEN                                       */}
        {/* ========================================================================= */}
        {viewMode === "result" && evaluation && (
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow border-0 p-4 p-md-5 bg-white rounded-4">
                {/* Result Header Banner */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-4 mb-4 gap-3">
                  <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">AI Interview Performance Report</span>
                    <h3 className="fw-bold text-dark mb-1">{role} Mock Interview Result</h3>
                    <p className="text-muted small mb-0">
                      Evaluated on <strong>{careerField || "Domain Engineering"}</strong> standards, technical completeness, and communication.
                    </p>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="text-center p-3 bg-light rounded-4 border shadow-sm" style={{ minWidth: "220px" }}>
                    <div className="small text-muted fw-bold text-uppercase mb-1">Overall Interview Score</div>
                    <div className="display-5 fw-bold text-primary mb-0">
                      {evaluation.overallScore}%
                    </div>
                    <span className={`${getTierBadgeClass(evaluation.overallScore)} small mt-1`}>
                      {evaluation.performanceTier}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Cards Grid (5 Core Criteria) */}
                <div className="mb-5">
                  <h5 className="fw-bold text-dark mb-3">📊 Competency & Criteria Breakdown</h5>
                  <div className="row g-3">
                    {/* 1. Answer Relevance */}
                    <div className="col-md-4 col-sm-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong className="small text-dark">🎯 Answer Relevance</strong>
                          <span className="fw-bold text-success">
                            {evaluation.categories?.answerRelevance ?? evaluation.categories?.relevanceScore ?? 0}%
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${evaluation.categories?.answerRelevance ?? evaluation.categories?.relevanceScore ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Directness & addressing questions</span>
                      </div>
                    </div>

                    {/* 2. Correctness */}
                    <div className="col-md-4 col-sm-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong className="small text-dark">🔬 Correctness</strong>
                          <span className="fw-bold text-primary">
                            {evaluation.categories?.correctness ?? evaluation.categories?.correctnessScore ?? 0}%
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${evaluation.categories?.correctness ?? evaluation.categories?.correctnessScore ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Factual & engineering accuracy</span>
                      </div>
                    </div>

                    {/* 3. Completeness */}
                    <div className="col-md-4 col-sm-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong className="small text-dark">📋 Completeness</strong>
                          <span className="fw-bold" style={{ color: "#6f42c1" }}>
                            {evaluation.categories?.completeness ?? evaluation.categories?.completenessScore ?? 0}%
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${evaluation.categories?.completeness ?? evaluation.categories?.completenessScore ?? 0}%`,
                              backgroundColor: "#6f42c1",
                            }}
                          ></div>
                        </div>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Depth, details & explanation</span>
                      </div>
                    </div>

                    {/* 4. Communication */}
                    <div className="col-md-6 col-sm-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong className="small text-dark">🗣️ Communication</strong>
                          <span className="fw-bold text-info">
                            {evaluation.categories?.communication ?? evaluation.categories?.communicationScore ?? 0}%
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-info"
                            style={{ width: `${evaluation.categories?.communication ?? evaluation.categories?.communicationScore ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Clarity, structure & professional delivery</span>
                      </div>
                    </div>

                    {/* 5. Technical / Domain Knowledge */}
                    <div className="col-md-6 col-sm-6">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <div className="d-flex justify-content-between mb-1">
                          <strong className="small text-dark">🧠 Technical / Domain Knowledge</strong>
                          <span className="fw-bold text-warning text-dark">
                            {evaluation.categories?.technicalKnowledge ?? evaluation.categories?.technicalScore ?? 0}%
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-warning"
                            style={{ width: `${evaluation.categories?.technicalKnowledge ?? evaluation.categories?.technicalScore ?? 0}%` }}
                          ></div>
                        </div>
                        <span className="text-muted" style={{ fontSize: "11px" }}>Discipline methodologies & concepts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Executive Performance Summary */}
                {evaluation.summary && (
                  <div className={`alert ${evaluation.overallScore >= 60 ? "alert-info" : "alert-warning"} border-0 shadow-sm mb-4`}>
                    <h6 className="fw-bold mb-1">📝 AI Panel Evaluation Summary</h6>
                    <p className="mb-0 small text-dark">{evaluation.summary}</p>
                  </div>
                )}

                {/* Strengths and Areas for Improvement */}
                <div className="row g-4 mb-5">
                  <div className="col-md-6">
                    <div className="p-4 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-4 h-100">
                      <h5 className="fw-bold text-success mb-3">✅ Key Strengths Observed</h5>
                      <ul className="mb-0 ps-3 small text-dark">
                        {evaluation.strengths?.map((str, sIdx) => (
                          <li key={sIdx} className="mb-2">
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-4 h-100">
                      <h5 className="fw-bold text-dark mb-3">⚠️ Areas for Growth</h5>
                      <ul className="mb-0 ps-3 small text-dark">
                        {evaluation.areasForImprovement?.map((area, aIdx) => (
                          <li key={aIdx} className="mb-2">
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recommended Preparation Topics */}
                {evaluation.recommendedTopics && evaluation.recommendedTopics.length > 0 && (
                  <div className="mb-5">
                    <h5 className="fw-bold text-dark mb-3">📖 Recommended Topics to Study Before Live Interviews</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {evaluation.recommendedTopics.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 fs-7 fw-semibold"
                        >
                          ✦ {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Question-by-Question Transcript Accordion */}
                {evaluation.detailedFeedback && evaluation.detailedFeedback.length > 0 && (
                  <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-dark mb-0">📋 Question-by-Question Evaluation & Ideal Answers</h5>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          const isFullyExpanded =
                            Object.keys(expandedEvalDetails).length === evaluation.detailedFeedback.length &&
                            Object.values(expandedEvalDetails).every(Boolean);
                          if (isFullyExpanded) {
                            setExpandedEvalDetails({});
                          } else {
                            const next = {};
                            evaluation.detailedFeedback.forEach((_, idx) => {
                              next[idx] = true;
                            });
                            setExpandedEvalDetails(next);
                          }
                        }}
                      >
                        {Object.keys(expandedEvalDetails).length === evaluation.detailedFeedback.length &&
                        Object.values(expandedEvalDetails).every(Boolean)
                          ? "Collapse All"
                          : "Expand All"}
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {evaluation.detailedFeedback.map((item, dIdx) => {
                        const isExpanded = !!expandedEvalDetails[dIdx];
                        return (
                          <div key={dIdx} className="card shadow-none border rounded-3 p-3 bg-light">
                            <div
                              className="d-flex justify-content-between align-items-center cursor-pointer"
                              onClick={() =>
                                setExpandedEvalDetails((prev) => ({
                                  ...prev,
                                  [dIdx]: !prev[dIdx],
                                }))
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary small">Q{item.questionNumber || dIdx + 1}</span>
                                <span className="badge bg-light text-dark border small">{item.level || "Standard"}</span>
                                <strong className="text-dark small">{item.question}</strong>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <span className={`${getQuestionScoreBadgeClass(item.score || 0)} small`}>
                                  Score: {item.score || 0}%
                                </span>
                                <span className="small text-muted">{isExpanded ? "▲" : "▼"}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-top small">
                                {/* 1. Candidate's Answer & Score */}
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-muted">Your Answer:</strong>
                                    <span className="badge bg-white text-dark border">
                                      Evaluation Score: <span className="fw-bold">{item.score || 0}%</span>
                                    </span>
                                  </div>
                                  <p className="text-dark mb-0 bg-white p-2 rounded border">
                                    {item.userAnswer || "No response provided"}
                                  </p>
                                </div>

                                {/* 2. AI Feedback */}
                                <div className="mb-3">
                                  <strong className="text-primary d-block mb-1">💬 AI Feedback:</strong>
                                  <p className="text-secondary mb-0 bg-white p-2 rounded border">
                                    {item.feedback}
                                  </p>
                                </div>

                                {/* 3. Ideal Answer */}
                                {item.idealAnswer && (
                                  <div>
                                    <strong className="text-success d-block mb-1">
                                      💡 Ideal Reference Answer:
                                    </strong>
                                    <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 text-dark">
                                      <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>
                                        {item.idealAnswer}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/dashboard")}
                  >
                    🏠 Back to Dashboard
                  </button>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => window.print()}
                    >
                      🖨️ Print Report
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary px-4 fw-bold shadow-sm"
                      onClick={handleRetryInterview}
                    >
                      🔄 Retake Mock Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal to End Interview Early */}
      {showEndModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1100 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-3 bg-white">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">⏹️ End Interview Early?</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEndModal(false)}
                ></button>
              </div>
              <div className="modal-body text-secondary small py-3">
                Are you sure you want to end the interview? The AI will evaluate your answers submitted up to Question {currentQIndex + 1}.
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowEndModal(false)}
                >
                  Continue Interview
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-bold"
                  onClick={() => {
                    const finalAnswers = {
                      ...userAnswers,
                      [currentQIndex]: currentAnswer.trim(),
                    };
                    handleCompleteInterview(finalAnswers);
                  }}
                  disabled={loading}
                >
                  {loading ? "Evaluating..." : "End & Get Evaluation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode !== "interview" && <Footer />}
    </div>
  );
}

export default InterviewQuestions;