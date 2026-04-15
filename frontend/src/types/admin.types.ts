export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  totalPublishedExams: number;
}

export interface StudentMasterRecord {
  id: string;
  registration_number: string;
  name: string;
  branch: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherInvitation {
  id: string;
  name: string;
  email: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformAnalytics {
  totalRegisteredStudents: number;
  totalTeachers: number;
  totalExamsCreated: number;
  totalAttempts: number;
  averageScore: number;
  examsPerBranch: Array<{ branch: string; count: number }>;
  studentsPerDepartment: Array<{ department: string; count: number }>;
  passFailRatio: {
    pass: number;
    fail: number;
  };
}
