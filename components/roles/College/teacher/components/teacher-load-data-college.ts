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
        subjectTitle: "Chemistry for Engineers (Lec)",
        subjectCode: "CHEM131",
        schedule: "MWF 8:00-9:00",
        room: "Room 127",
        section: "H2",
        students: 42,
    },
    {
        id: 2,
        subjectTitle: "Chemistry for Engineers (Lab)",
        subjectCode: "CHEM181",
        schedule: "TTh 10:00-11:30",
        room: "Room 227",
        section: "H2",
        students: 42,
    },
    {
        id: 3,
        subjectTitle: "Mathematics in the Modern World",
        subjectCode: "MATH031",
        schedule: "MWF 9:00-10:00",
        room: "Room 603",
        section: "M2",
        students: 28,
    },
    {
        id: 4,
        subjectTitle: "Science, Technology, and Society",
        subjectCode: "STS031",
        schedule: "TTh 1:00-2:30",
        room: "Room 204",
        section: "M4",
        students: 32,
    },
    {
        id: 5,
        subjectTitle: "Physics for Engineers (Lec)",
        subjectCode: "PHYS132",
        schedule: "MWF 2:00-3:00",
        room: "Room 705",
        section: "H1",
        students: 29,
    },
    {
        id: 6,
        subjectTitle: "Physics for Engineers (Lab)",
        subjectCode: "PHYS182",
        schedule: "TTh 3:00-4:30",
        room: "Room 106",
        section: "H1",
        students: 29,
    },
];