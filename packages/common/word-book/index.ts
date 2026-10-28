import type { Word } from '../word'

export interface UserWordBookSummary {
  id: string
  name: string
  description: string | null
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface UserWordBookDetail extends UserWordBookSummary {
  words: Word[]
}

export interface UserWordBookList {
  list: UserWordBookSummary[]
  total: number
}

export interface UpdateUserWordBookPayload {
  name?: string
  description?: string
}
