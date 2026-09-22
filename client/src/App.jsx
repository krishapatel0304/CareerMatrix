import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import JobTracker from "./pages/jobs/JobTracker";
import AddJob from "./pages/jobs/AddJob";
import JobDetails from "./pages/jobs/JobDetails";
import ExternalJobs from "./pages/jobs/ExternalJobs";

import ResumeSelection from "./pages/resume/ResumeSelection";
import UploadResume from "./pages/resume/UploadResume";
import TemplateGallery from "./pages/resume/TemplateGallery";
import ResumeBuilder from "./pages/resume/ResumeBuilder";
import ResumeStep1 from "./pages/resume/ResumeStep1";
import ResumeStep2 from "./pages/resume/ResumeStep2";
import ResumePreview from "./pages/resume/ResumePreview";

import CareerRoadmap from "./pages/roadmap/CareerRoadmap";
import SkillGap from "./pages/roadmap/SkillGap";
import InterviewQuestions from "./pages/interview/InterviewQuestions";
import CoverLetter from "./pages/interview/CoverLetter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Closed Resume Setup Flow Routes */}
        <Route
          path="/resume-selection"
          element={
            <ProtectedRoute>
              <ResumeSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-resume"
          element={
            <ProtectedRoute>
              <UploadResume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplateGallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/template-gallery"
          element={
            <ProtectedRoute>
              <TemplateGallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-builder"
          element={
            <ProtectedRoute>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-step1"
          element={
            <ProtectedRoute>
              <ResumeStep1 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-step2"
          element={
            <ProtectedRoute>
              <ResumeStep2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-preview"
          element={
            <ProtectedRoute>
              <ResumePreview />
            </ProtectedRoute>
          }
        />

        {/* Main Application Routes (Protected & Require Completed Resume) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireResume>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireResume>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-tracker"
          element={
            <ProtectedRoute requireResume>
              <JobTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-job"
          element={
            <ProtectedRoute requireResume>
              <AddJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-details/:id"
          element={
            <ProtectedRoute requireResume>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/external-jobs"
          element={
            <ProtectedRoute requireResume>
              <ExternalJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute requireResume>
              <CoverLetter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/career-roadmap"
          element={
            <ProtectedRoute requireResume>
              <CareerRoadmap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute requireResume>
              <SkillGap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-questions"
          element={
            <ProtectedRoute requireResume>
              <InterviewQuestions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;