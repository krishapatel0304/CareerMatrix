import { createContext, useState, useEffect, useCallback } from "react";
import { getResume, saveResume as saveResumeApi } from "../services/resumeService";

export const ResumeContext = createContext();

const initialResumeData = {
  personal: {
    name: "",
    email: "",
    phone: "",
    city: "",
    linkedin: "",
    github: "",
  },
  professional: {
    careerField: "",
    customField: "",
    targetRole: "",
    objective: "",
    education: "",
    skills: "",
    projects: "",
    experience: "",
    certifications: "",
    languages: "",
  },
};

export function ResumeProvider({ children }) {
  const [resumeData, setResumeData] = useState(initialResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState("Professional");
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [initialResumeLoaded, setInitialResumeLoaded] = useState(false);
  const [hasCompletedResume, setHasCompletedResume] = useState(false);

  const loadSavedResume = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setInitialResumeLoaded(true);
      return;
    }

    try {
      setLoading(true);
      const data = await getResume();
      if (data?.resume) {
        if (data.resume.personal || data.resume.professional) {
          setResumeData({
            personal: { ...initialResumeData.personal, ...(data.resume.personal || {}) },
            professional: { ...initialResumeData.professional, ...(data.resume.professional || {}) },
          });
        }
        if (data.resume.template) {
          setSelectedTemplate(data.resume.template);
        }
        if (data.resume.generatedContent) {
          setGeneratedContent(data.resume.generatedContent);
        }

        const isComplete = Boolean(
          data.resume.id &&
          (
            data.resume.personal?.name ||
            data.resume.professional?.skills ||
            data.resume.professional?.education ||
            data.resume.generatedContent
          )
        );
        setHasCompletedResume(isComplete);
      } else {
        setHasCompletedResume(false);
      }
    } catch (err) {
      console.warn("Could not load saved resume:", err.message);
      setHasCompletedResume(false);
    } finally {
      setLoading(false);
      setInitialResumeLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSavedResume();
  }, [loadSavedResume]);

  const saveResumeToDb = async (overrideData = null) => {
    const dataToSave = overrideData || {
      template: selectedTemplate,
      personal: resumeData.personal,
      professional: resumeData.professional,
      generatedContent,
    };

    try {
      const response = await saveResumeApi(dataToSave);
      setSavedSuccess(true);
      setHasCompletedResume(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      return response;
    } catch (err) {
      console.error("Failed to save resume:", err);
      throw err;
    }
  };

  const updatePersonal = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value,
      },
    }));
  };

  const updateProfessional = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        [field]: value,
      },
    }));
  };

  const resetResume = () => {
    setResumeData(initialResumeData);
    setGeneratedContent(null);
    setSelectedTemplate("Professional");
    setHasCompletedResume(false);
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        updatePersonal,
        updateProfessional,
        selectedTemplate,
        setSelectedTemplate,
        generatedContent,
        setGeneratedContent,
        loadSavedResume,
        saveResumeToDb,
        resetResume,
        loading,
        savedSuccess,
        initialResumeLoaded,
        hasCompletedResume,
        setHasCompletedResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export default ResumeProvider;