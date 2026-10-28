import { serverApi, type Response } from '..';
import type { ImportJob, ImportPreview, ImportTarget, StartImportResult } from '@en/common/import';

export const importTemplateUrl = (type: ImportTarget) => `/api/v1/import/templates/${type}`;

export const previewImport = (file: File, type: ImportTarget) => {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  return serverApi.post('/import/preview', form) as Promise<Response<ImportPreview>>;
};

export const startWordBookImport = (file: File, name: string, description?: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  if (description) form.append('description', description);
  return serverApi.post('/import/wordbook', form) as Promise<Response<StartImportResult>>;
};

export const startCourseImport = (file: File, name: string, description?: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('name', name);
  if (description) form.append('description', description);
  return serverApi.post('/import/course', form) as Promise<Response<StartImportResult>>;
};

export const getImportJob = (id: string) =>
  serverApi.get(`/import/jobs/${id}`) as Promise<Response<ImportJob>>;

export const importErrorsUrl = (id: string) => `/api/v1/import/jobs/${id}/errors`;
