export interface Course {
    id: string; // 课程id
    name: string; // 课程名称
    value: string; // 课程标识
    description: string; // 课程描述
    teacher: string; // 课程教师
    url: string; // 课程链接
    price: string; // 课程价格 改成了string
}

export type CourseList = Course[];