"use client";

import { useEffect, useState } from "react";
import Accordion from "../Accordion";
import BarChart from "@/components/BarChart";

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
  "ME001", "ME002", "ME003", "ME004", "ME022", "ME033", "ME035", "ME036", "ME037",
  "ME040", "ME042", "ME043", "ME045",
];

const allowedGroups = [
  "INC-001", "INC-002", "INC-003", "INC-004", "INC-005", "INC-006", "INC-007",
  "INC-008", "INC-009", "INC-010", "INC-012", "INC-013", "INC-014", "INC-015",
  "INC-016", "INC-018", "INC-019", "INC-020", "INC-021"
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

  // Prepare data for charts
  const metricChartData = {
    labels: filteredMetrics.map((metric) => metric.title),
    values: filteredMetrics.map((metric) => parseFloat(metric.result?.value || '0')),
  };

  const groupChartData = {
    labels: filteredGroups.map((group) => group.title),
    values: filteredGroups.map((group) => parseFloat(group.analysis.amount.total)),
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h2 className="text-3xl font-bold mb-6">Report Details</h2>
  
      {/* Filters Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Filters</h3>
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <ul className="space-y-6">
            {filters.map((filter, index) => (
              <li key={index} className="flex flex-col space-y-2">
                <span className="font-medium text-gray-800 dark:text-gray-200 text-lg">{filter.name}:</span>
                <div className="text-gray-600 dark:text-gray-400 text-base">
                  {Array.isArray(filter.value) ? (
                    filter.value.map((item, i) => (
                      <div key={i} className="mb-1 break-words">{item}</div>
                    ))
                  ) : (
                    <div className="break-words">{filter.value}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
  
      {/* Metrics Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Metrics</h3>
        <ul className="space-y-6">
          {filteredMetrics.map((metric) => (
            <li key={metric.id} className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
              <h4 className="text-xl font-semibold mb-2">{metric.id} - {metric.title}</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-2">{metric.description}</p>
              {metric.result && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Result:</strong> {metric.result.value}{" "}
                  {metric.result.format === "money" ? "AUD" : ""}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Sections:</strong> {metric.sections.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
  
      {/* Groups Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Groups</h3>
        <div className="chart-container mb-6">
          {groupChartData.labels.length > 0 && (
            <BarChart labels={groupChartData.labels} values={groupChartData.values} width={600} height={400} />
          )}
        </div>
        <ul className="space-y-6">
          {filteredGroups.map((group) => (
            <li key={group.id} className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
              <h4 className="text-xl font-semibold mb-2">{group.id} - {group.title}</h4>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Sections:</strong> {group.sections.join(", ")}
              </p>
  
              {/* Group Analysis Section */}
              <div className="mt-6">
                <h5 className="text-2xl font-semibold mb-4">Group Analysis</h5>
                
                {/* Range Section */}
                <div className="mb-4">
                  <h6 className="text-lg font-semibold mb-2">Range</h6>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Start Date:</strong> {group.analysis.range.startDate}</li>
                    <li><strong>End Date:</strong> {group.analysis.range.endDate}</li>
                    <li><strong>Duration:</strong> {group.analysis.range.duration} days</li>
                  </ul>
                </div>
                
                {/* Amount Section */}
                <div className="mb-4">
                  <h6 className="text-lg font-semibold mb-2">Amount</h6>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Total:</strong> {group.analysis.amount.total}</li>
                    <li><strong>Min:</strong> {group.analysis.amount.min}</li>
                    <li><strong>Max:</strong> {group.analysis.amount.max}</li>
                    <li><strong>Average Transaction:</strong> {group.analysis.amount.average.transaction}</li>
                    <li><strong>Average Per Month:</strong> {group.analysis.amount.average.month}</li>
                    <li><strong>Median Transaction:</strong> {group.analysis.amount.average.medianTransaction}</li>
                    <li><strong>Median Month:</strong> {group.analysis.amount.average.medianMonth}</li>
                    <li><strong>Ongoing Month:</strong> {group.analysis.amount.average.ongoingMonth}</li>
                    <li><strong>Stable Months:</strong> {group.analysis.amount.stableMonths}</li>
                    <li><strong>Secure Months:</strong> {group.analysis.amount.secureMonths}</li>
                  </ul>
                </div>
  
                {/* Frequency Section */}
                <div>
                  <h6 className="text-lg font-semibold mb-2">Frequency</h6>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li><strong>Type:</strong> {group.analysis.frequency.type}</li>
                    <li><strong>Amount:</strong> {group.analysis.frequency.amount}</li>
                    <li><strong>Display:</strong> {group.analysis.frequency.display}</li>
                    <li><strong>Next Date:</strong> {group.analysis.frequency.next.date}</li>
                    <li><strong>Next Amount:</strong> {group.analysis.frequency.next.amount}</li>
                  </ul>
                </div>
              </div>
  
              {/* Subgroups Section */}
              <div className="mt-6">
                <h5 className="text-2xl font-semibold mb-4">Subgroups</h5>
                {group.subgroup.map(subgroup => (
                  <div key={subgroup.id} className="mb-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
                    <Accordion
                      title={subgroup.name}
                      content={
                        <div>
                          <h5 className="text-xl font-semibold mb-4">Transactions</h5>
                          {subgroup.transactions.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {subgroup.transactions.map(transaction => (
                                  <tr key={transaction.id}>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{transaction.date}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{transaction.description}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{transaction.amount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400 mt-2">No transactions available.</p>
                          )}
  
                          {/* Analysis Section */}
                          <div className="mt-6">
                            <h5 className="text-xl font-semibold mb-4">Analysis</h5>
                            
                            {/* Summary Section */}
                            <div className="mb-4">
                              <h6 className="text-lg font-semibold mb-2">Summary</h6>
                              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                                <li><strong>Transaction Count:</strong> {subgroup.analysis.summary.transactionCount}</li>
                                <li><strong>Overall Percentage Credit:</strong> {subgroup.analysis.summary.overallPercentage.credit}%</li>
                                <li><strong>Overall Percentage Debit:</strong> {subgroup.analysis.summary.overallPercentage.debit}%</li>
                              </ul>
                            </div>
                            
                            {/* Range Section */}
                            <div className="mb-4">
                              <h6 className="text-lg font-semibold mb-2">Range</h6>
                              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                                <li><strong>Start Date:</strong> {subgroup.analysis.range.startDate}</li>
                                <li><strong>End Date:</strong> {subgroup.analysis.range.endDate}</li>
                                <li><strong>Duration:</strong> {subgroup.analysis.range.duration} days</li>
                              </ul>
                            </div>
                            
                            {/* Amount Section */}
                            <div className="mb-4">
                              <h6 className="text-lg font-semibold mb-2">Amount</h6>
                              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                                <li><strong>Total:</strong> {subgroup.analysis.amount.total}</li>
                                <li><strong>Min:</strong> {subgroup.analysis.amount.min}</li>
                                <li><strong>Max:</strong> {subgroup.analysis.amount.max}</li>
                                <li><strong>Average Transaction:</strong> {subgroup.analysis.amount.average.transaction}</li>
                                <li><strong>Average Per Month:</strong> {subgroup.analysis.amount.average.month}</li>
                                <li><strong>Median Transaction:</strong> {subgroup.analysis.amount.average.medianTransaction}</li>
                                <li><strong>Median Month:</strong> {subgroup.analysis.amount.average.medianMonth}</li>
                                <li><strong>Ongoing Month:</strong> {subgroup.analysis.amount.average.ongoingMonth}</li>
                                <li><strong>Stable Months:</strong> {subgroup.analysis.amount.stableMonths}</li>
                                <li><strong>Secure Months:</strong> {subgroup.analysis.amount.secureMonths}</li>
                              </ul>
                            </div>
                            
                            {/* Frequency Section */}
                            <div>
                              <h6 className="text-lg font-semibold mb-2">Frequency</h6>
                              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                                <li><strong>Type:</strong> {subgroup.analysis.frequency.type}</li>
                                <li><strong>Amount:</strong> {subgroup.analysis.frequency.amount}</li>
                                <li><strong>Display:</strong> {subgroup.analysis.frequency.display}</li>
                                <li><strong>Next Date:</strong> {subgroup.analysis.frequency.next.date}</li>
                                <li><strong>Next Amount:</strong> {subgroup.analysis.frequency.next.amount}</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};  