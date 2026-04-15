import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import Button from "../../components/common/Button";

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    registrationNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) return;

      await authService.completeStudentProfile({
        name: formData.fullName,
        branch: user.branch ?? null,
        year: user.year ?? null,
        registerNumber: formData.registrationNumber,
      });

      completeProfile();
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Failed to complete profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Please fill in your details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your registration number"
            />
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth>
            Complete Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
