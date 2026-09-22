import { createContext, useState, useCallback } from "react";
import { getJobs as fetchJobsApi, deleteJob as deleteJobApi } from "../services/jobService";

export const JobContext = createContext();

export function JobProvider({ children }) {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJobsApi(params);
      setJobs(data.jobs || []);
      return data.jobs || [];
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError(err.message || "Failed to load job applications");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJob = async (id) => {
    try {
      await deleteJobApi(id);
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting job:", err);
      setError(err.message || "Failed to delete job");
      return false;
    }
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        setJobs,
        loadJobs,
        deleteJob,
        editingJob,
        setEditingJob,
        loading,
        error,
        setError,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}