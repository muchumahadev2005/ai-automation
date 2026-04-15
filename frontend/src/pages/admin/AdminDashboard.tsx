import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminService from "../../services/adminService";
import type { AdminDashboardStats } from "../../types/admin.types";
import Loader from "../../components/common/Loader";

const defaultStats: AdminDashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalExams: 0,
  totalPublishedExams: 0,
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <Loader fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Manage students, teachers, and platform-wide activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalStudents}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Teachers</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalTeachers}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Exams</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Published Exams</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalPublishedExams}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/students"
          className="rounded-xl border border-blue-200 bg-blue-50 p-5 hover:bg-blue-100 transition-colors"
        >
          <p className="font-semibold text-blue-900">Student Management</p>
          <p className="text-sm text-blue-700 mt-1">
            Upload CSV, search, update, and remove records.
          </p>
        </Link>
        <Link
          to="/admin/teachers"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 hover:bg-amber-100 transition-colors"
        >
          <p className="font-semibold text-amber-900">Teacher Management</p>
          <p className="text-sm text-amber-700 mt-1">
            Invite teachers and monitor invitation status.
          </p>
        </Link>
        <Link
          to="/admin/analytics"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 hover:bg-emerald-100 transition-colors"
        >
          <p className="font-semibold text-emerald-900">Platform Analytics</p>
          <p className="text-sm text-emerald-700 mt-1">
            View totals, score trends, and pass/fail ratio.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
