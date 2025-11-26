import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ConversionProgress {
  jobId: string;
  status: 'analyzing' | 'converting' | 'completed' | 'failed';
  currentRow: number;
  totalRows: number;
  percentage: number;
  message: string;
  error?: string;
}

export interface ConversionCompletion {
  jobId: string;
  datasetId: string;
  message: string;
}

export interface ConversionError {
  jobId: string;
  error: string;
}

export function useConversionProgress(jobId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Connect to WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(`${socketUrl}/data-conversion`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to data conversion WebSocket');
    });

    newSocket.on('conversion-progress', (data: ConversionProgress) => {
      if (data.jobId === jobId) {
        console.log('Progress update:', data);
        setProgress(data);
        
        if (data.status === 'completed') {
          setIsCompleted(true);
        }
      }
    });

    newSocket.on('conversion-completed', (data: ConversionCompletion) => {
      if (data.jobId === jobId) {
        console.log('Conversion completed:', data);
        setIsCompleted(true);
        setDatasetId(data.datasetId);
      }
    });

    newSocket.on('conversion-error', (data: ConversionError) => {
      if (data.jobId === jobId) {
        console.error('Conversion error:', data);
        setError(data.error);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from data conversion WebSocket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [jobId]);

  const reset = useCallback(() => {
    setProgress(null);
    setIsCompleted(false);
    setDatasetId(null);
    setError(null);
  }, []);

  return {
    progress,
    isCompleted,
    datasetId,
    error,
    isConnected: socket?.connected || false,
    reset,
  };
}
