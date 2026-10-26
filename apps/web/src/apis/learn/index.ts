import { serverApi, type Response } from '..';
import type {
    CheckInCalendar,
    CheckInRecord,
    FinishReviewPayload,
    FinishReviewResult,
    FinishSessionPayload,
    FinishSessionResult,
    LearnReviewList,
    LearnWordList,
    StudyGoalSummary,
    SubmitAnswerPayload,
    SubmitAnswerResult,
    UpdateStudyGoalsPayload,
    WrongBookList,
} from '@en/common/learn';

export const getWordList = (courseId: string) =>
    serverApi.get(`/learn/word/${courseId}`) as Promise<Response<LearnWordList>>;

export const getReviewDue = (courseId: string, limit = 20, wordId?: string) => {
    const query = new URLSearchParams({ courseId, limit: String(limit) });
    if (wordId) query.set('wordId', wordId);
    return serverApi.get(`/learn/review/due?${query.toString()}`) as Promise<Response<LearnReviewList>>;
};

export const submitAnswer = (data: SubmitAnswerPayload) =>
    serverApi.post(`/learn/answer`, data) as Promise<Response<SubmitAnswerResult>>;

export const finishSession = (data: FinishSessionPayload) =>
    serverApi.post(`/learn/session/finish`, data) as Promise<Response<FinishSessionResult>>;

export const finishReview = (data: FinishReviewPayload) =>
    serverApi.post(`/learn/review/finish`, data) as Promise<Response<FinishReviewResult>>;

export const getStudyGoals = () =>
    serverApi.get(`/learn/goals`) as Promise<Response<StudyGoalSummary>>;

export const updateStudyGoals = (data: UpdateStudyGoalsPayload) =>
    serverApi.put(`/learn/goals`, data) as Promise<Response<StudyGoalSummary>>;

export const getTodayCheckIn = () =>
    serverApi.get(`/learn/check-in/today`) as Promise<Response<{
        checkIn: CheckInRecord | null;
        streak: number;
        progress: StudyGoalSummary['progress'];
        completed: boolean;
    }>>;

export const checkIn = () =>
    serverApi.post(`/learn/check-in`) as Promise<Response<{
        checkIn: CheckInRecord | null;
        streak: number;
        progress: StudyGoalSummary['progress'];
    }>>;

export const getCheckInCalendar = (month: string) =>
    serverApi.get(`/learn/check-in/calendar?month=${encodeURIComponent(month)}`) as Promise<Response<CheckInCalendar>>;

export const getWrongBook = (page = 1, pageSize = 20) =>
    serverApi.get(`/learn/wrong-book?page=${page}&pageSize=${pageSize}`) as Promise<Response<WrongBookList>>;

export const removeWrongWord = (wordId: string) =>
    serverApi.post(`/learn/wrong-book/${encodeURIComponent(wordId)}/remove`) as Promise<Response<{ removed: boolean }>>;

export const resetReview = (recordId: string) =>
    serverApi.post(`/learn/review/${encodeURIComponent(recordId)}/reset`) as Promise<Response<{ reset: boolean }>>;
