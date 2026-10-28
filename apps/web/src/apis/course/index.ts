import { serverApi, type Response } from '..';
import type { Course, CourseList, UpdateUserCoursePayload } from '@en/common/course';

export const getCourseList = () => serverApi.get('/course/list') as Promise<Response<CourseList>>;

export const getMyCourse = () => serverApi.get('/course/my') as Promise<Response<CourseList>>;

export const updateMyCourse = (id: string, data: UpdateUserCoursePayload) =>
  serverApi.patch(`/course/my/${id}`, data) as Promise<Response<Course>>;

export const removeMyCourse = (id: string) =>
  serverApi.delete(`/course/my/${id}`) as Promise<Response<{ id: string }>>;