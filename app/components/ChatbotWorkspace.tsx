"use client";

import Chart from "chart.js/auto";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ResultRow = Record<string, unknown>;

type AskResponse = {
  question: string;
  sql: string;
  results: ResultRow[];
  columns: string[];
};

type ChatEntry = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sql?: string;
  columns?: string[];
  results?: ResultRow[];
  error?: boolean;
};

const SUGGESTED_QUESTIONS = [
  "Show all active interns with department and institute.",
  "How many interns are in each department?",
  "List interns whose internship ends in the next 30 days.",
  "Show pending interns grouped by institute.",
];

export default function ChatbotWorkspace() {
  const apiBase =
    process.env.NEXT_PUBLIC_CHATBOT_API_BASE ?? "http://localhost:8000/api/v0";

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Ask me anything about interns, departments, institutes, and statuses. I will generate SQL and show the matching results.",
    },
  ]);

  const canSend = useMemo(() => question.trim().length > 0 && !loading, [question, loading]);

  async function askChatbot(userQuestion: string) {
    const trimmed = userQuestion.trim();
    if (!trimmed) return;

    const userMessage: ChatEntry = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || "Chatbot request failed");
      }

      const data = (await res.json()) as AskResponse;

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Here is what I found.",
          sql: data.sql,
          columns: data.columns,
          results: data.results,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: `I could not complete the request: ${message}`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await askChatbot(question);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">AI Chatbot</h1>
        <p className="mt-1 text-sm text-gray-500">
          Natural-language access to internship data from your dashboard.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => askChatbot(item)}
              disabled={loading}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {messages.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-lg border p-4 ${
                entry.role === "user"
                  ? "ml-auto max-w-[85%] border-blue-200 bg-blue-50"
                  : entry.error
                    ? "max-w-[95%] border-red-200 bg-red-50"
                    : "max-w-[95%] border-gray-200 bg-gray-50"
              }`}
            >
              <p className="text-sm text-gray-800">{entry.text}</p>

              {entry.sql && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Generated SQL
                  </p>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-green-200">
                    {entry.sql}
                  </pre>
                </div>
              )}

              {entry.columns && entry.results && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Results ({entry.results.length})
                  </p>

                  {entry.results.length === 0 ? (
                    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-500">
                      No rows matched this query.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                      <table className="min-w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-600">
                          <tr>
                            {entry.columns.map((col) => (
                              <th key={col} className="px-3 py-2 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {entry.results.slice(0, 20).map((row, idx) => (
                            <tr key={idx}>
                              {entry.columns?.map((col) => (
                                <td key={`${idx}-${col}`} className="px-3 py-2 align-top">
                                  {String(row[col] ?? "-")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <QueryChart columns={entry.columns} rows={entry.results} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="max-w-[95%] rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Thinking and preparing your SQL answer...
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about interns, departments, statuses, or institutes..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QueryChart({ columns, rows }: { columns: string[]; rows: ResultRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const numericCols = useMemo(() => {
    return columns.filter((col) => {
      return (
        rows.length > 0 &&
        !Number.isNaN(Number.parseFloat(String(rows[0][col]))) &&
        Number.isFinite(Number(rows[0][col]))
      );
    });
  }, [columns, rows]);

  const labelCol = useMemo(() => {
    return columns.find((col) => !numericCols.includes(col)) || columns[0];
  }, [columns, numericCols]);

  const canRenderChart = numericCols.length > 0 && rows.length >= 2;

  useEffect(() => {
    if (!canRenderChart || !canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const datasets = numericCols.map((col, idx) => ({
      label: col.replace(/_/g, " "),
      data: rows.map((r) => r[col] as number | string),
      backgroundColor: idx === 0 ? "rgba(99, 102, 241, 0.5)" : "rgba(139, 92, 246, 0.5)",
      borderColor: idx === 0 ? "#6366f1" : "#8b5cf6",
      borderWidth: 2,
      borderRadius: 8,
    }));

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: rows.map((r) => String(r[labelCol] ?? "-")),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#64748b",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(148,163,184,0.2)" },
            ticks: { color: "#64748b" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#64748b" },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [canRenderChart, labelCol, numericCols, rows]);

  if (!canRenderChart) return null;

  return (
    <div className="mt-4 rounded-md border border-gray-200 bg-white p-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Visualization
      </p>
      <div className="h-80 w-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
