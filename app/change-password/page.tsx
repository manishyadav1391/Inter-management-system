"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { changeFirstLoginPasswordAction } from "@/app/actions/changeFirstLoginPassword";
import { resetPasswordWithTokenAction } from "@/app/actions/forgotPassword";

export default function ChangePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isForgotMode = token.length > 0;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!newPassword || !confirmPassword || (!isForgotMode && !currentPassword)) {
      setError("All fields are required.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "New password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isForgotMode) {
        await resetPasswordWithTokenAction({ token, newPassword });
      } else {
        await changeFirstLoginPasswordAction({
          currentPassword,
          newPassword,
        });
      }

      setSuccess(true);

      if (isForgotMode) {
        router.push("/login");
        return;
      }

      // Re-login is required so JWT session token picks up updated flag.
      await signOut({ callbackUrl: "/login" });
    } catch (err: any) {
      setError(err.message ?? "Failed to update password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Change Password</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isForgotMode
            ? "Set your new password to complete password reset."
            : "This is your first login. Please set a new password to continue."}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
            Password updated successfully. Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isForgotMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {isForgotMode && (
            <Link href="/login" className="text-center text-sm text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}