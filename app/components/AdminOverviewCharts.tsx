"use client";

import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";

export default function AdminOverviewCharts({
  statusLabels,
  statusCounts,
  departmentLabels,
  departmentCounts,
}: {
  statusLabels: string[];
  statusCounts: number[];
  departmentLabels: string[];
  departmentCounts: number[];
}) {
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const barRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartRef = useRef<Chart | null>(null);
  const barChartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!doughnutRef.current || !barRef.current) return;

    if (doughnutChartRef.current) {
      doughnutChartRef.current.destroy();
      doughnutChartRef.current = null;
    }
    if (barChartRef.current) {
      barChartRef.current.destroy();
      barChartRef.current = null;
    }

    const doughnutCtx = doughnutRef.current.getContext("2d");
    const barCtx = barRef.current.getContext("2d");
    if (!doughnutCtx || !barCtx) return;

    doughnutChartRef.current = new Chart(doughnutCtx, {
      type: "doughnut",
      data: {
        labels: statusLabels,
        datasets: [
          {
            label: "Interns",
            data: statusCounts,
            backgroundColor: [
              "rgba(34,197,94,0.75)",
              "rgba(59,130,246,0.75)",
              "rgba(251,191,36,0.75)",
              "rgba(244,63,94,0.75)",
            ],
            borderColor: ["#22c55e", "#3b82f6", "#f59e0b", "#f43f5e"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#4b5563",
              boxWidth: 12,
              boxHeight: 12,
            },
          },
        },
      },
    });

    barChartRef.current = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: departmentLabels,
        datasets: [
          {
            label: "Intern Count",
            data: departmentCounts,
            backgroundColor: "rgba(99,102,241,0.7)",
            borderColor: "#4f46e5",
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#4b5563",
              maxRotation: 25,
              minRotation: 0,
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#4b5563", precision: 0 },
            grid: { color: "rgba(148,163,184,0.2)" },
          },
        },
      },
    });

    return () => {
      if (doughnutChartRef.current) doughnutChartRef.current.destroy();
      if (barChartRef.current) barChartRef.current.destroy();
    };
  }, [statusLabels, statusCounts, departmentLabels, departmentCounts]);

  return (
    <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-2">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Interns by Status</h2>
        <div className="h-72">
          <canvas ref={doughnutRef} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Interns by Department</h2>
        <div className="h-72">
          <canvas ref={barRef} />
        </div>
      </div>
    </div>
  );
}
