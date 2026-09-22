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
        speakQuestion(questionsRef.current[nextIdx].question);
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

  // Text-To-Speech: Speak Question aloud & seamlessly manage mic state
  const speakQuestion = (text) => {
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

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

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
            speakQuestion(qList[0].question);
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
        speakQuestion(newQuestion);
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
          speakQuestion(questions[nextIdx].question);
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
                  Simulate a realistic online video interview with dummy AI HR across any engineering or academic field
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
                        Connecting to AI Interviewer...
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
                  box-shadow: 0 0 0 24px rgba(59, 130, 246, 0), 0 0 65px rgba(59, 130, 246, 0.9);
                  transform: scale(1.05);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 0 35px rgba(59, 130, 246, 0.4);
                  transform: scale(1);
                }
              }
              @keyframes hrPulseListening {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
                  transform: scale(1);
                }
                50% {
                  box-shadow: 0 0 35px rgba(16, 185, 129, 0.7);
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
              .hr-avatar-listening {
                animation: hrPulseListening 2.4s infinite ease-in-out;
                border: 4px solid #10b981 !important;
              }
              .audio-bar {
                width: 4px;
                background: linear-gradient(180deg, #38bdf8, #3b82f6);
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
                    ● Live Interview Room
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
                  Question {currentQIndex + 1}
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

            {/* 2. MAIN CENTER STAGE — DUMMY HR INTERVIEWER & CORNER CANDIDATE CAM */}
            <main className="flex-grow-1 position-relative d-flex align-items-center justify-content-center px-3">
              {/* Floating Corner Candidate Video Tile (Top-Right of Arena) */}
              <div
                className="position-absolute shadow-lg rounded-4 overflow-hidden"
                style={{
                  top: "20px",
                  right: "24px",
                  width: "220px",
                  aspectRatio: "16/10",
                  backgroundColor: "#0d1322",
                  border: "2px solid rgba(255, 255, 255, 0.15)",
                  zIndex: 10,
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

              {/* Central Dummy HR Interviewer Avatar & State */}
              <div className="text-center d-flex flex-column align-items-center justify-content-center py-2">
                {/* Large Avatar Circle with Dynamic Pulsing Animation */}
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-lg ${
                    isSpeakingQuestion ? "hr-avatar-speaking" : isPreparing ? "" : "hr-avatar-listening"
                  }`}
                  style={{
                    width: "140px",
                    height: "140px",
                    backgroundColor: "#1e293b",
                    fontSize: "68px",
                    transition: "all 0.4s ease",
                  }}
                >
                  👨‍💼
                </div>

                {/* Interviewer Name / Label */}
                <h4 className="fw-bold text-white mb-1" style={{ letterSpacing: "-0.3px" }}>
                  AI Interviewer / HR
                </h4>

                {/* Real-time State Label */}
                <div className="mb-3">
                  {loading ? (
                    <span className="badge bg-warning text-dark px-3 py-2 fs-6 shadow-sm">
                      ⏳ Evaluating performance...
                    </span>
                  ) : isPreparing ? (
                    <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-50 px-3 py-2 fs-6 shadow-sm">
                      ● Interview Starting Shortly...
                    </span>
                  ) : isTransitioning ? (
                    <span className="badge bg-warning text-dark px-3 py-2 fs-6 shadow-sm">
                      ⏳ Evaluating response & preparing next question...
                    </span>
                  ) : isRegeneratingQ ? (
                    <span className="badge bg-info text-dark px-3 py-2 fs-6 shadow-sm">
                      🔄 Preparing new question...
                    </span>
                  ) : isSpeakingQuestion ? (
                    <span className="badge bg-primary px-3 py-2 fs-6 shadow-sm">
                      AI INTERVIEWER — SPEAKING 🗣️
                    </span>
                  ) : isListening ? (
                    <span className="badge bg-success px-3 py-2 fs-6 shadow-sm animate-pulse">
                      MICROPHONE ON — LISTENING 🎧
                    </span>
                  ) : (
                    <span className="badge bg-dark text-success border border-success px-3 py-2 fs-6 shadow-sm">
                      MICROPHONE ON 🟢
                    </span>
                  )}
                </div>

                {/* Soundwave Audio Waveform Animation (Visible while speaking or recording) */}
                <div
                  className="d-flex align-items-center justify-content-center mb-2"
                  style={{ height: "30px", minWidth: "120px" }}
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
                    <span className="text-secondary small fst-italic">
                      Preparing interview session... Take a moment to settle in
                    </span>
                  ) : (
                    <span className="text-secondary small fst-italic">
                      Microphone active • Speak your answer clearly
                    </span>
                  )}
                </div>

                <p className="text-secondary small mb-0 px-3" style={{ maxWidth: "520px" }}>
                  Voice-First Conversational Interview. The AI automatically listens to your response and advances naturally.
                </p>
              </div>

              {/* 2B. LIVE FLOATING SUBTITLES & QUESTION DISPLAY */}
              <div
                className="position-absolute bottom-0 start-50 translate-middle-x mb-3 px-4 py-3 rounded-4 shadow-lg text-center"
                style={{
                  maxWidth: "760px",
                  width: "90%",
                  backgroundColor: "rgba(11, 17, 32, 0.94)",
                  backdropFilter: "blur(14px)",
                  border: isSpeakingQuestion ? "1px solid rgba(59, 130, 246, 0.6)" : "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: isSpeakingQuestion
                    ? "0 12px 36px rgba(0, 0, 0, 0.65), 0 0 24px rgba(59, 130, 246, 0.35)"
                    : "0 12px 36px rgba(0, 0, 0, 0.65)",
                  zIndex: 20,
                  pointerEvents: "none",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                  <span
                    className={`badge ${
                      isPreparing
                        ? "bg-primary bg-opacity-25 text-info border border-info border-opacity-50"
                        : isSpeakingQuestion
                        ? "bg-primary bg-opacity-25 text-info border border-info border-opacity-50"
                        : "bg-dark text-secondary border border-secondary border-opacity-50"
                    } px-2 py-0`}
                    style={{ fontSize: "11px" }}
                  >
                    {isPreparing
                      ? "⏳ Interview Initializing"
                      : isSpeakingQuestion
                      ? "🗣️ HR Interviewer Speaking..."
                      : "🎯 Current Interview Question"}
                  </span>
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
                        ? "Interview will begin shortly... Please take a moment to prepare."
                        : isSpeakingQuestion
                        ? "AI interviewer is speaking... Listening will resume automatically"
                        : isTransitioning
                        ? "Evaluating response and preparing next question..."
                        : isListening
                        ? (currentAnswer ? "Voice detected — finalizing answer on silence..." : "Listening to your voice...")
                        : "Microphone active"}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {/* Repeat Question Button */}
                    <button
                      type="button"
                      className={`btn btn-sm ${isSpeakingQuestion ? "btn-primary" : "btn-outline-primary"} text-white border-primary`}
                      onClick={() => speakQuestion(questions[currentQIndex]?.question)}
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