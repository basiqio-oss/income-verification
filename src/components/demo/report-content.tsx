"use client";

import { useEffect, useState } from "react";
import Accordion from "../Accordion"; // Adjust the import path as necessary

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

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
}

interface Subgroup {
  id: string;
  name: string;
  transactions: Transaction[];
  analysis: any; // Replace with actual type if available
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
  subgroup: Subgroup[];
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

const isGroupMeaningful = (group: Group) => {
  const { analysis } = group;
  
  return analysis.summary.transactionCount > 0 || 
         parseFloat(analysis.amount.total) > 0 || 
         parseFloat(analysis.amount.average.transaction) > 0 ||
         parseFloat(analysis.amount.average.month) > 0 || 
         analysis.amount.stableMonths > 0;
};

const isMetricMeaningful = (metric: Metric) => {
  const value = metric.result?.value;

  if (typeof value === "string") {
    const numericValue = parseFloat(value);
    return value !== "0.00" && !(numericValue === 0 && !isNaN(numericValue));
  } else if (typeof value === "number") {
    return value !== 0;
  }

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

  const filteredMetrics = reportData.metrics
    .filter((metric) => allowedMetrics.includes(metric.id))
    .filter(isMetricMeaningful);

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

                {/* Accordion for Subgroups */}
                {group.subgroup.map(subgroup => (
                  <Accordion
                    key={subgroup.id}
                    title={subgroup.name}
                    content={
                      <>
                        <h5 className="font-semibold">Transactions</h5>
                        {subgroup.transactions.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {subgroup.transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.date}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.description}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>No transactions available</p>
                        )}
                      </>
                    }
                  />
                ))}

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
                  <p><strong>Start Date:</strong> {group.analysis.range.startDate}</p>
                  <p><strong>End Date:</strong> {group.analysis.range.endDate}</p>
                  {group.analysis.range.duration > 0 && (
                    <p><strong>Duration:</strong> {group.analysis.range.duration} days</p>
                  )}
                </div>

                {/* Amount */}
                <div className="mt-2">
                  <h5 className="font-semibold">Amount</h5>
                  {parseFloat(group.analysis.amount.total) !== 0 && (
                    <p><strong>Total Amount:</strong> {group.analysis.amount.total}</p>
                  )}
                  {parseFloat(group.analysis.amount.min) !== 0 && (
                    <p><strong>Min Amount:</strong> {group.analysis.amount.min}</p>
                  )}
                  {parseFloat(group.analysis.amount.max) !== 0 && (
                    <p><strong>Max Amount:</strong> {group.analysis.amount.max}</p>
                  )}
                  {parseFloat(group.analysis.amount.average.transaction) !== 0 && (
                    <p><strong>Average Transaction Amount:</strong> {group.analysis.amount.average.transaction}</p>
                  )}
                </div>

                {/* Frequency */}
                <div className="mt-2">
                  <h5 className="font-semibold">Frequency</h5>
                  <p><strong>Type:</strong> {group.analysis.frequency.type}</p>
                  <p><strong>Amount:</strong> {group.analysis.frequency.amount}</p>
                  <p><strong>Next Date:</strong> {group.analysis.frequency.next.date}</p>
                  <p><strong>Next Amount:</strong> {group.analysis.frequency.next.amount}</p>
                </div>
              </li>
            ))
          ) : (
            <p>No groups available</p>
          )}
        </ul>
      </div>
    </div>
  );
}
