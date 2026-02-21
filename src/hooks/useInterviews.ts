import { useState, useEffect, useCallback } from 'react';
import {
  type Interview,
  type InterviewStatus,
  addInterview as dbAddInterview,
  updateInterview as dbUpdateInterview,
  deleteInterview as dbDeleteInterview,
  getAllInterviews,
  getInterviewsByCompany,
  getInterviewsByStatus,
  getUpcomingInterviews,
  searchInterviews,
} from '../db/indexeddb';

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInterviews();
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByCompany = useCallback(async (company: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewsByCompany(company);
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByStatus = useCallback(async (status: InterviewStatus) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviewsByStatus(status);
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUpcoming = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUpcomingInterviews();
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadInterviews();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchInterviews(query);
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [loadInterviews]);

  const addInterviewData = useCallback(
    async (interview: Omit<Interview, 'id'>) => {
      try {
        const id = await dbAddInterview(interview);
        await loadInterviews();
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add interview';
        setError(message);
        throw err;
      }
    },
    [loadInterviews]
  );

  const updateInterviewData = useCallback(
    async (interview: Interview) => {
      try {
        await dbUpdateInterview(interview);
        await loadInterviews();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update interview';
        setError(message);
        throw err;
      }
    },
    [loadInterviews]
  );

  const deleteInterviewData = useCallback(
    async (id: string) => {
      try {
        await dbDeleteInterview(id);
        await loadInterviews();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete interview';
        setError(message);
        throw err;
      }
    },
    [loadInterviews]
  );

  const updateStatus = useCallback(
    async (id: string, status: InterviewStatus) => {
      const interview = interviews.find((i) => i.id === id);
      if (!interview) throw new Error('Interview not found');
      await updateInterviewData({ ...interview, status, updatedAt: Date.now() });
    },
    [interviews, updateInterviewData]
  );

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  return {
    interviews,
    loading,
    error,
    loadInterviews,
    loadByCompany,
    loadByStatus,
    loadUpcoming,
    search,
    addInterview: addInterviewData,
    updateInterview: updateInterviewData,
    deleteInterview: deleteInterviewData,
    updateStatus,
  };
}
