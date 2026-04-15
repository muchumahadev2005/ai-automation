import api from "./api";
import type {
  AdminDashboardStats,
  PlatformAnalytics,
  StudentMasterRecord,
  TeacherInvitation,
} from "../types/admin.types";

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get("/admin/dashboard");
  return response.data.data;
};

const getStudents = async (search?: string): Promise<StudentMasterRecord[]> => {
  const response = await api.get("/admin/students", {
    params: search ? { search } : undefined,
  });
  return response.data.data.students || [];
};

const uploadStudentsCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/admin/students/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data as {
    totalProcessed: number;
    insertedCount: number;
    updatedCount: number;
  };
};

const updateStudent = async (
  studentId: string,
  payload: {
    registrationNumber: string;
    name: string;
    branch: string;
    department: string;
  },
): Promise<StudentMasterRecord> => {
  const response = await api.put(`/admin/students/${studentId}`, payload);
  return response.data.data.student;
};

const deleteStudent = async (studentId: string) => {
  const response = await api.delete(`/admin/students/${studentId}`);
  return response.data;
};

const inviteTeacher = async (payload: { name: string; email: string }) => {
  const response = await api.post("/admin/teachers/invite", payload);
  return response.data.data as {
    invitation: TeacherInvitation;
    inviteLink: string;
    emailDelivered: boolean;
  };
};

const getTeacherInvitations = async (): Promise<TeacherInvitation[]> => {
  const response = await api.get("/admin/teachers");
  return response.data.data.invitations || [];
};

const getTeacherInviteDetails = async (token: string) => {
  const response = await api.get("/admin/teachers/invite-details", {
    params: { token },
  });

  return response.data.data as {
    name: string;
    email: string;
    expiresAt: string;
  };
};

const completeTeacherInvite = async (payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/admin/teachers/complete-invite", payload);
  return response.data.data;
};

const getAnalytics = async (): Promise<PlatformAnalytics> => {
  const response = await api.get("/admin/analytics");
  return response.data.data;
};

export default {
  getDashboardStats,
  getStudents,
  uploadStudentsCsv,
  updateStudent,
  deleteStudent,
  inviteTeacher,
  getTeacherInvitations,
  getTeacherInviteDetails,
  completeTeacherInvite,
  getAnalytics,
};
