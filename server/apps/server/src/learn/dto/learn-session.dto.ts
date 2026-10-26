import type { LearnMode } from '@en/common/learn'

export class SubmitAnswerDto {
    wordId!: string
    courseId!: string
    mode!: LearnMode
    answer!: string
    expected!: string
    isCorrect!: boolean
    revealed!: boolean
    durationMs!: number
    index!: number
    inputCount!: number
    correctInput!: number
    wrongInput!: number
    attempts!: number
}

export class FinishSessionDto {
    courseId!: string
    wordIds!: string[]
    wrongWordIds!: string[]
}
