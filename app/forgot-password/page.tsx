"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/forgotPassword";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordResetAction({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your email and we will send you a password reset link.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4">
            If this email exists in our system, a reset link has been sent.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="name@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <Link href="/login" className="text-center text-sm text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </form>
      </div>
    </div>
  );
}