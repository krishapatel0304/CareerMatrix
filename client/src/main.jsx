import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { ResumeProvider } from "./context/ResumeContext";
import { JobProvider } from "./context/JobContext";
import UserProvider from "./context/UserContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <ResumeProvider>
    <JobProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </JobProvider>
  </ResumeProvider>
</StrictMode>
)
