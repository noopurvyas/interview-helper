import { useState, useEffect, useCallback } from 'react';
import {
  Question,
  AnswerVariation,
  addQuestion as dbAddQuestion,
  getQuestion as dbGetQuestion,
  updateQuestion as dbUpdateQuestion,
  deleteQuestion as dbDeleteQuestion,
  getQuestionsByType,
  getQuestionsByCompany,
  getQuestionsByTypeAndCompany,
  getFavoriteQuestions,
  getAllQuestions,
  searchQuestions,
  getUniqueCompanies,
} from '../db/indexeddb';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);

  // Load all questions
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllQuestions();
      setQuestions(data);

      const uniqueCompanies = await getUniqueCompanies();
      setCompanies(uniqueCompanies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load questions by type
  const loadByType = useCallback(
    async (type: 'behavioral' | 'technical') => {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuestionsByType(type);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load questions by company
  const loadByCompany = useCallback(async (company: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestionsByCompany(company);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load questions by type and company
  const loadByTypeAndCompany = useCallback(
    async (type: 'behavioral' | 'technical', company: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuestionsByTypeAndCompany(type, company);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load favorite questions
  const loadFavorites = useCallback(
    async (type?: 'behavioral' | 'technical') => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFavoriteQuestions(type);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Search questions
  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadQuestions();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchQuestions(query);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [loadQuestions]);

  // Add question
  const addQuestionData = useCallback(
    async (question: Omit<Question, 'id'>) => {
      try {
        const id = await dbAddQuestion(question);
        await loadQuestions();
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add question';
        setError(message);
        throw err;
      }
    },
    [loadQuestions]
  );

  // Update question
  const updateQuestionData = useCallback(
    async (question: Question) => {
      try {
        await dbUpdateQuestion(question);
        await loadQuestions();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update question';
        setError(message);
        throw err;
      }
    },
    [loadQuestions]
  );

  // Delete question
  const deleteQuestionData = useCallback(
    async (id: string) => {
      try {
        await dbDeleteQuestion(id);
        await loadQuestions();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete question';
        setError(message);
        throw err;
      }
    },
    [loadQuestions]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    async (id: string) => {
      try {
        const question = await dbGetQuestion(id);
        if (!question) throw new Error('Question not found');
        question.isFavorite = !question.isFavorite;
        await updateQuestionData(question);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle favorite';
        setError(message);
        throw err;
      }
    },
    [updateQuestionData]
  );

  // Increment practice count
  const incrementPracticeCount = useCallback(
    async (id: string) => {
      try {
        const question = await dbGetQuestion(id);
        if (!question) throw new Error('Question not found');
        question.practiceCount += 1;
        question.lastPracticed = Date.now();
        await updateQuestionData(question);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update practice count';
        setError(message);
        throw err;
      }
    },
    [updateQuestionData]
  );

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    companies,
    loading,
    error,
    loadQuestions,
    loadByType,
    loadByCompany,
    loadByTypeAndCompany,
    loadFavorites,
    search,
    addQuestion: addQuestionData,
    updateQuestion: updateQuestionData,
    deleteQuestion: deleteQuestionData,
    toggleFavorite,
    incrementPracticeCount,
  };
}
