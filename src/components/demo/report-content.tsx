"use client";

import { useEffect, useState } from "react";

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

// const isGroupMeaningful = (group: Group) => {
//   return group.analysis.summary.transactionCount !== 0 ||
//     group.analysis.summary.overallPercentage.credit !== 0 ||
//     group.analysis.summary.overallPercentage.debit !== 0 ||
//     group.analysis.range.startDate !== "" ||
//     group.analysis.range.endDate !== "" ||
//     group.analysis.range.duration !== 0 ||
//     group.analysis.amount.total !== "0.00" ||
//     group.analysis.amount.min !== "0.00" ||
//     group.analysis.amount.max !== "0.00" ||
//     group.analysis.amount.average.transaction !== "0.00" ||
//     group.analysis.amount.average.month !== "0.00" ||
//     group.analysis.amount.average.medianTransaction !== "0.00" ||
//     group.analysis.amount.average.medianMonth !== "0.00" ||
//     group.analysis.amount.average.ongoingMonth !== "0.00" ||
//     group.analysis.amount.stableMonths !== 0 ||
//     group.analysis.amount.secureMonths !== 0 ||
//     group.analysis.frequency.type !== "" && group.analysis.frequency.type !== "NONE" ||
//     group.analysis.frequency.amount !== "" && group.analysis.frequency.amount !== "NONE" ||
//     group.analysis.frequency.display !== "" && group.analysis.frequency.display !== "NONE" ||
//     group.analysis.frequency.next.date !== "" && group.analysis.frequency.next.date !== "NONE" ||
//     group.analysis.frequency.next.amount !== "" && group.analysis.frequency.next.amount !== "NONE" ||
//     group.analysis.frequency.subgroup !== "" && group.analysis.frequency.subgroup !== "NONE";
// };
const isGroupMeaningful = (group: Group) => {
    const { analysis } = group;
    
    // Check if any significant field in the group is meaningful
    return analysis.summary.transactionCount > 0 || 
           parseFloat(analysis.amount.total) > 0 || 
           parseFloat(analysis.amount.average.transaction) > 0 ||
           parseFloat(analysis.amount.average.month) > 0 || 
           analysis.amount.stableMonths > 0;
  };
  

  const isMetricMeaningful = (metric: Metric) => {
    const value = metric.result?.value;
  
    if (typeof value === "string") {
      // Convert string to number for comparison
      const numericValue = parseFloat(value);
  
      // Check if the string value is "0.00" or numeric value is 0
      return value !== "0.00" && !(numericValue === 0 && !isNaN(numericValue));
    } else if (typeof value === "number") {
      // Directly check if the numeric value is 0
      return value !== 0;
    }
  
    // If the value is neither string nor number, exclude it
    return false;
  };
  
  
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

    // Filter only the allowed metrics and check if they are meaningful
    const filteredMetrics = reportData.metrics
    .filter((metric) => allowedMetrics.includes(metric.id))
    .filter(isMetricMeaningful);


  // Filter out groups with non-meaningful data
  const filteredGroups = reportData.groups
    .filter(group => allowedGroups.includes(group.id))
    .filter(isGroupMeaningful);

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
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <li key={group.id} className="mb-4">
                <h4 className="text-lg font-semibold">{group.id} - {group.title}</h4>
                {/* Summary */}
                <div className="mt-2">
                  <h5 className="font-semibold">Summary</h5>
                  {group.analysis.summary.transactionCount !== 0 && (
                    <p><strong>Transaction Count:</strong> {group.analysis.summary.transactionCount}</p>
                  )}
                  {group.analysis.summary.overallPercentage.credit !== 0 && (
                    <p><strong>Credit Percentage:</strong> {group.analysis.summary.overallPercentage.credit}%</p>
                  )}
                  {group.analysis.summary.overallPercentage.debit !== 0 && (
                    <p><strong>Debit Percentage:</strong> {group.analysis.summary.overallPercentage.debit}%</p>
                  )}
                </div>
                
                {/* Range */}
                <div className="mt-2">
                  <h5 className="font-semibold">Range</h5>
                  {group.analysis.range.startDate && (
                    <p><strong>Start Date:</strong> {group.analysis.range.startDate}</p>
                  )}
                  {group.analysis.range.endDate && (
                    <p><strong>End Date:</strong> {group.analysis.range.endDate}</p>
                  )}
                  {group.analysis.range.duration !== 0 && (
                    <p><strong>Duration:</strong> {group.analysis.range.duration} days</p>
                  )}
                </div>

                {/* Amount */}
                <div className="mt-2">
                  <h5 className="font-semibold">Amount</h5>
                  {group.analysis.amount.total !== "0.00" && (
                    <p><strong>Total:</strong> {group.analysis.amount.total}</p>
                  )}
                  {group.analysis.amount.min !== "0.00" && (
                    <p><strong>Min Amount:</strong> {group.analysis.amount.min}</p>
                  )}
                  {group.analysis.amount.max !== "0.00" && (
                    <p><strong>Max Amount:</strong> {group.analysis.amount.max}</p>
                  )}
                  {group.analysis.amount.average.transaction !== "0.00" && (
                    <p><strong>Average Transaction:</strong> {group.analysis.amount.average.transaction}</p>
                  )}
                  {group.analysis.amount.average.month !== "0.00" && (
                    <p><strong>Average Monthly Amount:</strong> {group.analysis.amount.average.month}</p>
                  )}
                  {group.analysis.amount.average.medianTransaction !== "0.00" && (
                    <p><strong>Median Transaction:</strong> {group.analysis.amount.average.medianTransaction}</p>
                  )}
                  {group.analysis.amount.average.medianMonth !== "0.00" && (
                    <p><strong>Median Monthly Amount:</strong> {group.analysis.amount.average.medianMonth}</p>
                  )}
                  {group.analysis.amount.average.ongoingMonth !== "0.00" && (
                    <p><strong>Ongoing Month:</strong> {group.analysis.amount.average.ongoingMonth}</p>
                  )}
                  {group.analysis.amount.stableMonths !== 0 && (
                    <p><strong>Stable Months:</strong> {group.analysis.amount.stableMonths}</p>
                  )}
                  {group.analysis.amount.secureMonths !== 0 && (
                    <p><strong>Secure Months:</strong> {group.analysis.amount.secureMonths}</p>
                  )}
                </div>

                {/* Frequency */}
                <div className="mt-2">
                  <h5 className="font-semibold">Frequency</h5>
                  {group.analysis.frequency.type && group.analysis.frequency.type !== "NONE" && (
                    <p><strong>Type:</strong> {group.analysis.frequency.type}</p>
                  )}
                  {group.analysis.frequency.amount && group.analysis.frequency.amount !== "NONE" && (
                    <p><strong>Amount:</strong> {group.analysis.frequency.amount}</p>
                  )}
                  {group.analysis.frequency.display && group.analysis.frequency.display !== "NONE" && (
                    <p><strong>Display:</strong> {group.analysis.frequency.display}</p>
                  )}
                  {group.analysis.frequency.next.date && group.analysis.frequency.next.date !== "NONE" && (
                    <p><strong>Next Date:</strong> {group.analysis.frequency.next.date}</p>
                  )}
                  {group.analysis.frequency.next.amount && group.analysis.frequency.next.amount !== "NONE" && (
                    <p><strong>Next Amount:</strong> {group.analysis.frequency.next.amount}</p>
                  )}
                  {group.analysis.frequency.subgroup && group.analysis.frequency.subgroup !== "NONE" && (
                    <p><strong>Subgroup:</strong> {group.analysis.frequency.subgroup}</p>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li>No meaningful groups available</li>
          )}
        </ul>
      </div>
    </div>
  );
}
