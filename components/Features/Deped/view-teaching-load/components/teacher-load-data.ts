export type TeacherLoadRow = {
	id: number;
	subjectTitle: string;
	subjectCode: string;
	schedule: string;
	room: string;
	section: string;
	students: number;
};

export const teacherLoadRows: TeacherLoadRow[] = [];
