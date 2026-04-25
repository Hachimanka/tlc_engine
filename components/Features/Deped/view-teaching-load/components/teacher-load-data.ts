export type TeacherLoadRow = {
	id: number;
	subjectTitle: string;
	subjectCode: string;
	schedule: string;
	room: string;
	section: string;
	students: number;
};

export const teacherLoadRows: TeacherLoadRow[] = [
	{
		id: 1,
		subjectTitle: "Filipino 1",
		subjectCode: "FIL1",
		schedule: "MWF 8:00-9:00",
		room: "Room 101",
		section: "Section A",
		students: 30,
	},
	{
		id: 2,
		subjectTitle: "English 1",
		subjectCode: "ENG1",
		schedule: "TTh 10:00-11:30",
		room: "Room 102",
		section: "Section B",
		students: 25,
	},
	{
		id: 3,
		subjectTitle: "Math 1",
		subjectCode: "MATH1",
		schedule: "MWF 9:00-10:00",
		room: "Room 103",
		section: "Section C",
		students: 28,
	},
	{
		id: 4,
		subjectTitle: "Science 1",
		subjectCode: "SCI1",
		schedule: "TTh 1:00-2:30",
		room: "Room 104",
		section: "Section D",
		students: 32,
	},
	{
		id: 5,
		subjectTitle: "AP 1",
		subjectCode: "AP1",
		schedule: "MWF 2:00-3:00",
		room: "Room 105",
		section: "Section E",
		students: 29,
	},
	{
		id: 6,
		subjectTitle: "Values Ed 1",
		subjectCode: "VE1",
		schedule: "TTh 3:00-4:30",
		room: "Room 106",
		section: "Section F",
		students: 26,
	},
];