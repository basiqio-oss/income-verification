import Link from "next/link";
import { useEffect, useState } from "react";
import { ContentLayout } from "@/components/admin-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface Filter {
  name: string;
  value: string | string[];
}

interface Metric {
  id: string;
  title: string;
  description: string;
  sections: string[];
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
  };
}

export default function CategoriesPage() {
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
    return (
      <ContentLayout title="Report">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
        <div className="p-4">Loading report...</div>
      </ContentLayout>
    );
  }

  const { filters, data: reportData } = data;

  return (
    <ContentLayout title="Report">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>

      <div className="p-4">
        <h2 className="text-2xl font-bold">Report Details</h2>
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

        <div className="mt-4">
          <h3 className="text-xl font-semibold">Metrics</h3>
          <ul>
            {reportData.metrics.map((metric) => (
              <li key={metric.id} className="mb-4">
                <h4 className="text-lg font-semibold">{metric.title}</h4>
                <p>{metric.description}</p>
                <p>
                  <strong>Sections:</strong> {metric.sections.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ContentLayout>
  );
}
