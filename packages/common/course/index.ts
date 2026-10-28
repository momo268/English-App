export interface Course {
    id: string; // 课程id
    name: string; // 课程名称
    value: string; // 课程标识
    description: string; // 课程描述
    teacher: string; // 课程教师
    url: string; // 课程链接
    price: string; // 课程价格 改成了string
    isCustom?: boolean; // 是否为用户自定义课程
    wordCount?: number; // 课程单词数
    ownerId?: string | null; // 自定义课程所属用户
}

export type CourseList = Course[];

export interface UpdateUserCoursePayload {
    name?: string;
    description?: string;
}