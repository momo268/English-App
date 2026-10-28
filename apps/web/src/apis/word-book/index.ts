import { serverApi,type Response } from "..";
import type { WordQuery,WordList } from "@en/common/word";
import type { UpdateUserWordBookPayload, UserWordBookDetail, UserWordBookList, UserWordBookSummary } from "@en/common/word-book";

export const getWordBookList = (params: WordQuery): Promise<Response<WordList>> => {
    return serverApi.get('/work-book', { params }) as Promise<Response<WordList>>
}

export const getMyWordBooks = () =>
    serverApi.get('/work-book/mine') as Promise<Response<UserWordBookList>>

export const getMyWordBook = (id: string) =>
    serverApi.get(`/work-book/mine/${id}`) as Promise<Response<UserWordBookDetail>>

export const updateMyWordBook = (id: string, data: UpdateUserWordBookPayload) =>
    serverApi.patch(`/work-book/mine/${id}`, data) as Promise<Response<UserWordBookSummary>>

export const removeMyWordBook = (id: string) =>
    serverApi.delete(`/work-book/mine/${id}`) as Promise<Response<{ id: string }>>