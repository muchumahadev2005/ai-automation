import React, { useEffect, useMemo, useState } from "react";
import adminService from "../../services/adminService";
import type { StudentMasterRecord } from "../../types/admin.types";
import Loader from "../../components/common/Loader";

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentMasterRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudentMasterRecord | null>(null);

  const loadStudents = async (searchText?: string) => {
    const data = await adminService.getStudents(searchText);
    setStudents(data);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await loadStudents();
      } catch (err: any) {
        setError(err?.message || "Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };

    initialLoad();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await loadStudents(search.trim());
      } catch (err: any) {
        setError(err?.message || "Search failed");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await adminService.uploadStudentsCsv(file);
      await loadStudents(search.trim());
      setMessage(
        `CSV synced. Processed: ${result.totalProcessed}, inserted: ${result.insertedCount}, updated: ${result.updatedCount}`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to upload CSV");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Delete this student record?")) {
      return;
    }

    try {
      await adminService.deleteStudent(studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
      setMessage("Student deleted successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to delete student");
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editing) {
      return;
    }

    try {
      const updated = await adminService.updateStudent(editing.id, {
        registrationNumber: editing.registration_number,
        name: editing.name,
        branch: editing.branch,
        department: editing.department,
      });

      setStudents((prev) =>
        prev.map((student) => (student.id === updated.id ? updated : student)),
      );
      setEditing(null);
      setMessage("Student updated successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to update student");
    }
  };

  const resultText = useMemo(() => {
    if (!search.trim()) {
      return `${students.length} students`;
    }

    return `${students.length} results for "${search.trim()}"`;
  }, [students.length, search]);

  if (isLoading) {
    return <Loader fullScreen text="Loading students..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Student Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">{resultText}</p>
        </div>
        <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-60">
          {isUploading ? "Uploading..." : "Upload CSV"}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            disabled={isUploading}
            onChange={handleCsvUpload}
          />
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by registration number or name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Registration No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {student.registration_number}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.name}</td>
                  <td className="px-4 py-3 text-gray-700">{student.branch}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {student.department}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(student)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">
            No students found
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Student
            </h2>
            <form className="space-y-3" onSubmit={handleUpdate}>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={editing.registration_number}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    registration_number: e.target.value,
                  })
                }
                placeholder="Registration number"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="Name"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={editing.branch}
                onChange={(e) =>
                  setEditing({ ...editing, branch: e.target.value })
                }
                placeholder="Branch"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                value={editing.department}
                onChange={(e) =>
                  setEditing({ ...editing, department: e.target.value })
                }
                placeholder="Department"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
