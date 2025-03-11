"use client"; // Indicates this component is a client component in Next.js

// Import necessary hooks and components
import { useEffect, useState } from "react";
import Accordion from "../Accordion"; // Custom Accordion component for collapsible content
import BarChart from "@/components/BarChart"; // Custom BarChart component for displaying bar charts

// TypeScript interfaces defining the structure of data used in the report
interface Filter {
  name: string; // Name of the filter
  value: string | string[]; // Value(s) of the filter
}

interface Metric {
  id: string; // Unique identifier for the metric
  title: string; // Title of the metric
  description: string; // Description of the metric
  sections: string[]; // Sections associated with the metric
  result?: {
    value: string; // Result value of the metric
    format?: string; // Format of the result (e.g., currency)
  };
}

interface Transaction {
  id: string; // Unique identifier for the transaction
  date: string; // Date of the transaction
  description: string; // Description of the transaction
  amount: string; // Amount of the transaction
}

interface Subgroup {
  id: string; // Unique identifier for the subgroup
  name: string; // Name of the subgroup
  transactions: Transaction[]; // List of transactions in the subgroup
  analysis: any; // Placeholder for subgroup analysis data
}

interface Group {
  id: string; // Unique identifier for the group
  title: string; // Title of the group
  sections: string[]; // Sections associated with the group
  analysis: { // Analysis results for the group
    summary: {
      transactionCount: number; // Total number of transactions
      overallPercentage: {
        credit: number; // Overall percentage of credit transactions
        debit: number; // Overall percentage of debit transactions
      };
    };
    range: {
      startDate: string; // Start date of the analysis
      endDate: string; // End date of the analysis
      duration: number; // Duration in days
    };
    amount: {
      total: string; // Total amount in the group
      min: string; // Minimum transaction amount
      max: string; // Maximum transaction amount
      average: { // Average calculations
        transaction: string; // Average transaction amount
        month: string; // Average amount per month
        medianTransaction: string; // Median transaction amount
        medianMonth: string; // Median amount per month
        ongoingMonth: string; // Current month's amount
      };
      stableMonths: number; // Number of stable months
      secureMonths: number; // Number of secure months
    };
    frequency: {
      type: string; // Frequency type (e.g., weekly, monthly)
      amount: string; // Frequency amount
      display: string; // Display representation of frequency
      next: {
        date: string; // Date of the next occurrence
        amount: string; // Amount for the next occurrence
      };
      subgroup: string; // Associated subgroup
    };
  };
  subgroup: Subgroup[]; // List of subgroups within the group
}

interface ReportData {
  type: string; // Type of the report
  id: string; // Unique identifier for the report
  title: string; // Title of the report
  reportType: string; // Type of report (e.g., summary, detailed)
  createdDate: string; // Date when the report was created
  createdBy: string; // User who created the report
  filters: Filter[]; // List of filters applied to the report
  data: {
    metrics: Metric[]; // List of metrics in the report
    groups: Group[]; // List of groups in the report
  };
}

// Allowed metrics and groups to filter the report data
const allowedMetrics = [
  "ME001", "ME002", "ME003", "ME004", "ME022", "ME033", "ME035", "ME036", "ME037",
  "ME040", "ME042", "ME043", "ME045",
];

const allowedGroups = [
  "INC-001", "INC-002", "INC-003", "INC-004", "INC-005", "INC-006", "INC-007",
  "INC-008", "INC-009", "INC-010", "INC-012", "INC-013", "INC-014", "INC-015",
  "INC-016", "INC-018", "INC-019", "INC-020", "INC-021"
];

// Function to determine if a group is meaningful based on its analysis
const isGroupMeaningful = (group: Group) => {
  const { analysis } = group;

  return analysis.summary.transactionCount > 0 || // At least one transaction
         parseFloat(analysis.amount.total) > 0 || // Total amount is greater than 0
         parseFloat(analysis.amount.average.transaction) > 0 || // Average transaction is greater than 0
         parseFloat(analysis.amount.average.month) > 0 || // Average per month is greater than 0
         analysis.amount.stableMonths > 0; // At least one stable month
};

// Function to determine if a metric is meaningful based on its result
const isMetricMeaningful = (metric: Metric) => {
  const value = metric.result?.value;

  if (typeof value === "string") {
    const numericValue = parseFloat(value);
    return value !== "0.00" && !(numericValue === 0 && !isNaN(numericValue)); // Exclude zero values
  } else if (typeof value === "number") {
    return value !== 0; // Exclude zero values
  }

  return false; // Non-numeric values are not meaningful
};

// Main component for displaying the report page
export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null); // State to hold report data

  useEffect(() => {
    const reportData = localStorage.getItem("reportData"); // Retrieve report data from localStorage
    if (reportData) {
      try {
        setData(JSON.parse(reportData)); // Parse and set the report data
      } catch (e) {
        console.error("Failed to parse report data:", e); // Handle parsing error
      }
    }
  }, []);

  if (!data) {
    return <div className="p-4">Loading report...</div>; // Loading state
  }

  const { filters, data: reportData } = data; // Destructure filters and report data from state

  // Filter metrics and groups based on allowed lists and meaningful criteria
  const filteredMetrics = reportData.metrics
    .filter((metric) => allowedMetrics.includes(metric.id))
    .filter(isMetricMeaningful);

  const filteredGroups = reportData.groups
    .filter(group => allowedGroups.includes(group.id))
    .filter(isGroupMeaningful);

  // Prepare data for charts

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
                      <div key={i} className="mb-1 break-words">{item}</div> // Display each filter value
                    ))
                  ) : (
                    <div className="break-words">{filter.value}</div> // Display single filter value
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
                  {metric.result.format === "money" ? "AUD" : ""} {/* Display currency if applicable */}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Sections:</strong> {metric.sections.join(", ")} {/* Display associated sections */}
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
            <BarChart labels={groupChartData.labels} values={groupChartData.values} width={600} height={400} /> // Display bar chart
          )}
        </div>
        <ul className="space-y-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <li key={group.id} className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
                <h4 className="text-xl font-semibold mb-2">{group.id} - {group.title}</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Sections:</strong> {group.sections.join(", ")} {/* Display associated sections */}
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
                              <p className="text-gray-500 dark:text-gray-400 mt-2">No transactions available.</p> // Message when no transactions are found
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
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2">No groups found.</p> // Message when no groups are available
          )}
        </ul>
      </div>

    </div>
  );
}; 
