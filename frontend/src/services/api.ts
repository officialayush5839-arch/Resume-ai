import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  JobCreatePayload,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const CandidateService = {
  getCandidates: <T = any>(): Promise<AxiosResponse<T>> => 
    api.get<T>('/candidates'),
    
  getCandidateById: <T = any>(id: string | number): Promise<AxiosResponse<T>> => 
    api.get<T>(`/candidates/${id}`),
    
  deleteCandidate: <T = { status: string }>(id: string | number): Promise<AxiosResponse<T>> => 
    api.delete<T>(`/candidates/${id}`),
};

export const JobService = {
  getJobs: <T = any>(): Promise<AxiosResponse<T>> => 
    api.get<T>('/jobs'),
    
  getJobById: <T = any>(id: string | number): Promise<AxiosResponse<T>> => 
    api.get<T>(`/jobs/${id}`),
    
  createJob: <T = any>(data: JobCreatePayload): Promise<AxiosResponse<T>> => 
    api.post<T>('/jobs', data),
    
  deleteJob: <T = { status: string }>(id: string | number): Promise<AxiosResponse<T>> => 
    api.delete<T>(`/jobs/${id}`),
    
  getRankedCandidates: <T = any>(jobId: string | number): Promise<AxiosResponse<T>> => 
    api.get<T>(`/jobs/${jobId}/candidates`),
};

export const ResumeService = {
  uploadResume: <T = { candidate_id: number }>(file: File): Promise<AxiosResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<T>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getResumeById: <T = any>(resumeId: string | number): Promise<AxiosResponse<T>> => 
    api.get<T>(`/resumes/${resumeId}`),
};

export const DashboardService = {
  getStats: <T = any>(): Promise<AxiosResponse<T>> => 
    api.get<T>('/dashboard/stats'),
};

export const HealthService = {
  checkHealth: <T = { status: string }>(): Promise<AxiosResponse<T>> => 
    api.get<T>('/health'),
};

export default api;
