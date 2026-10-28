export type ImportTarget = 'wordbook' | 'course'

export type ImportJobStatus = 'pending' | 'importing' | 'done' | 'failed'

export interface ImportIssue {
  row: number
  message: string
}

export interface ImportPreviewRow {
  row: number
  word: string
  phonetic: string
  translation: string
  definition: string
  pos: string
  example: string
  tags: string
  unit: string
  sortOrder: number | null
}

export interface ImportPreview {
  type: ImportTarget
  total: number
  valid: number
  duplicates: number
  errors: ImportIssue[]
  headers: string[]
  rows: ImportPreviewRow[]
}

export interface ImportJob {
  id: string
  type: ImportTarget
  status: ImportJobStatus
  fileName: string
  targetId: string | null
  total: number
  success: number
  failed: number
  message: string | null
  errors: ImportIssue[] | null
  createdAt: string
  updatedAt: string
}

export interface StartImportResult {
  jobId: string
}

export interface ImportTemplateMeta {
  type: ImportTarget
  filename: string
}
