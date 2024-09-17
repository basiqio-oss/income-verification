"use client";  // Mark the component as a client component

import { useEffect, useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";

interface Filter {
  name: string;
  value: string | string[];
}

interface Metric {
  id: string;
  title: string;
  description: string;
  sections: string[];
  result?: {
    value: string;
    format?: string;
  };
}

interface Group {
  id: string;
  title: string;
  sections: string[];
  analysis: {
    summary: {
      transactionCount: number;
      overallPercentage: {
        credit: number;
        debit: number;
      };
    };
    range: {
      startDate: string;
      endDate: string;
      duration: number;
    };
    amount: {
      total: string;
      min: string;
      max: string;
      average: {
        transaction: string;
        month: string;
        medianTransaction: string;
        medianMonth: string;
        ongoingMonth: string;
      };
      stableMonths: number;
      secureMonths: number;
    };
    frequency: {
      type: string;
      amount: string;
      display: string;
      next: {
        date: string;
        amount: string;
      };
      subgroup: string;
    };
  };
}

interface ReportData {
  type: string;
  id: string;
  title: string;
  reportType: string;
  createdDate: string;
  createdBy: string;
  filters: Filter[];
  data: {
    metrics: Metric[];
    groups: Group[];
  };
}

const allowedMetrics = [
  "ME001",
  "ME002",
  "ME003",
  "ME004",
  "ME022",
  "ME033",
  "ME035",
  "ME036",
  "ME037",
  "ME040",
  "ME042",
  "ME043",
  "ME045",
];

const allowedGroups = [
    "INC-001", "INC-002", "INC-003", "INC-004", "INC-005", "INC-006", "INC-007", "INC-008",
    "INC-009", "INC-010", "INC-012", "INC-013", "INC-014", "INC-015", "INC-016", "INC-018",
    "INC-019", "INC-020", "INC-021"
  ];
  

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    const reportData = localStorage.getItem("reportData");
    if (reportData) {
      try {
        setData(JSON.parse(reportData));
      } catch (e) {
        console.error("Failed to parse report data:", e);
      }
    }
  }, []);

  if (!data) {
    return <div className="p-4">Loading report...</div>;
  }

  const { filters, data: reportData } = data;

  // Filter only the allowed metrics
  const filteredMetrics = reportData.metrics.filter((metric) =>
    allowedMetrics.includes(metric.id)
  );

  const filteredGroups = reportData.groups.filter(group => allowedGroups.includes(group.id));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Report Details</h2>

      {/* Filters Section */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Filters</h3>
        <ul>
          {filters.map((filter, index) => (
            <li key={index}>
              <strong>{filter.name}:</strong>{" "}
              {Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
            </li>
          ))}
        </ul>
      </div>

      {/* Metrics Section */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Metrics</h3>
        <ul>
          {filteredMetrics.map((metric) => (
            <li key={metric.id} className="mb-4">
              <h4 className="text-lg font-semibold">{metric.id} - {metric.title}</h4>
              <p>{metric.description}</p>
              {metric.result && (
                <p>
                  <strong>Result:</strong> {metric.result.value}{" "}
                  {metric.result.format === "money" ? "USD" : ""}
                </p>
              )}
              <p>
                <strong>Sections:</strong> {metric.sections.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Groups Section */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Groups</h3>
        <ul>
          {filteredGroups.map((group) => (
            <li key={group.id} className="mb-4">
              <h4 className="text-lg font-semibold">{group.id} - {group.title}</h4>
              <p><strong>Transaction Count:</strong> {group.analysis.summary.transactionCount}</p>
              <p><strong>Total Amount:</strong> {group.analysis.amount.total}</p>
              <p><strong>Average Transaction:</strong> {group.analysis.amount.average.transaction}</p>
              <p><strong>Average Monthly Amount:</strong> {group.analysis.amount.average.month}</p>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
