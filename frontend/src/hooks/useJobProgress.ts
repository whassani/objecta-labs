import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Job {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled' | 'delayed';
  data?: any;
  result?: any;
  error?: any;
  progress?: {
    current: number;
    total: number;
    percentage: number;
    message: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

export function useJobProgress(jobId: string | null, userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    // Connect to WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(`${socketUrl}/jobs`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: userId ? { userId } : {},
    });

    newSocket.on('connect', () => {
      console.log('Connected to jobs WebSocket');
      setIsConnected(true);
      
      // Subscribe to specific job
      newSocket.emit('subscribe-job', jobId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from jobs WebSocket');
      setIsConnected(false);
    });

    newSocket.on('job-update', (data: Job) => {
      if (data.id === jobId) {
        console.log('Job update:', data);
        setJob(data);
      }
    });

    newSocket.on('job-completed', (data: Job) => {
      if (data.id === jobId) {
        console.log('Job completed:', data);
        setJob(data);
      }
    });

    newSocket.on('job-failed', (data: Job) => {
      if (data.id === jobId) {
        console.error('Job failed:', data);
        setJob(data);
      }
    });

    setSocket(newSocket);

    return () => {
      if (jobId) {
        newSocket.emit('unsubscribe-job', jobId);
      }
      newSocket.close();
    };
  }, [jobId, userId]);

  const reset = useCallback(() => {
    setJob(null);
  }, []);

  return {
    job,
    isConnected,
    isCompleted: job?.status === 'completed',
    isFailed: job?.status === 'failed',
    isActive: job?.status === 'active',
    isPending: job?.status === 'pending',
    progress: job?.progress,
    result: job?.result,
    error: job?.error,
    reset,
  };
}

export function useAllJobs(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(`${socketUrl}/jobs`, {
      transports: ['websocket'],
      reconnection: true,
      query: userId ? { userId } : {},
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('job-created', (job: Job) => {
      setJobs(prev => [job, ...prev]);
    });

    newSocket.on('job-update', (job: Job) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    });

    newSocket.on('job-completed', (job: Job) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    });

    newSocket.on('job-failed', (job: Job) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return {
    jobs,
    isConnected,
    activeJobs: jobs.filter(j => j.status === 'active'),
    pendingJobs: jobs.filter(j => j.status === 'pending'),
    completedJobs: jobs.filter(j => j.status === 'completed'),
    failedJobs: jobs.filter(j => j.status === 'failed'),
  };
}
