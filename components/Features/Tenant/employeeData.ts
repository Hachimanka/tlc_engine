export type TenantEmployee = {
  id: string;
  email: string;
  name: string;
  department: string;
  employmentType: "Full time" | "Part time";
};

export const tenantEmployees: TenantEmployee[] = [
  {
    id: "TLC-1001",
    email: "juan.delacruz@cit.edu",
    name: "Juan Dela Cruz",
    department: "Computer Engineering",
    employmentType: "Full time",
  },
  {
    id: "TLC-1002",
    email: "maria.santos@cit.edu",
    name: "Maria Santos",
    department: "Computer Engineering",
    employmentType: "Full time",
  },
  {
    id: "TLC-1003",
    email: "jose.reyes@cit.edu",
    name: "Jose Reyes",
    department: "Information Technology",
    employmentType: "Part time",
  },
  {
    id: "TLC-1004",
    email: "andrea.santos@cit.edu",
    name: "Andrea Santos",
    department: "Civil Engineering",
    employmentType: "Full time",
  },
  {
    id: "TLC-1005",
    email: "sofia.ramos@cit.edu",
    name: "Sofia Ramos",
    department: "Electrical Engineering",
    employmentType: "Full time",
  },
];
