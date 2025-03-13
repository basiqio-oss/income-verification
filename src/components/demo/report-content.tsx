"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  BarChart2,
  PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Share,
  Download,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/hooks/use-toast"

// TypeScript interfaces
interface ReportFilter {
  name: string
  value: string | string[]
}

interface Metric {
  id: string
  title: string
  description: string
  sections: string[]
  result?: {
    value: string
    format?: string
  }
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: string
}

interface Subgroup {
  id: string
  name: string
  transactions: Transaction[]
  analysis: any
}

interface Group {
  id: string
  title: string
  sections: string[]
  analysis: {
    summary: {
      transactionCount: number
      overallPercentage: {
        credit: number
        debit: number
      }
    }
    range: {
      startDate: string
      endDate: string
      duration: number
    }
    amount: {
      total: string
      min: string
      max: string
      average: {
        transaction: string
        month: string
        medianTransaction: string
        medianMonth: string
        ongoingMonth: string
      }
      stableMonths: number
      secureMonths: number
    }
    frequency: {
      type: string
      amount: string
      display: string
      next: {
        date: string
        amount: string
      }
      subgroup: string
    }
  }
  subgroup: Subgroup[]
}

interface ReportData {
  type: string
  id: string
  title: string
  reportType: string
  createdDate: string
  createdBy: string
  filters: ReportFilter[]
  data: {
    metrics: Metric[]
    groups: Group[]
  }
}

// Helper functions
const isGroupMeaningful = (group: Group) => {
  const { analysis } = group
  return (
    analysis.summary.transactionCount > 0 ||
    Number.parseFloat(analysis.amount.total) > 0 ||
    Number.parseFloat(analysis.amount.average.transaction) > 0 ||
    Number.parseFloat(analysis.amount.average.month) > 0 ||
    analysis.amount.stableMonths > 0
  )
}

const isMetricMeaningful = (metric: Metric) => {
  const value = metric.result?.value
  if (typeof value === "string") {
    const numericValue = Number.parseFloat(value)
    return value !== "0.00" && !(numericValue === 0 && !isNaN(numericValue))
  } else if (typeof value === "number") {
    return value !== 0
  }
  return false
}

// Format currency
const formatCurrency = (value: string) => {
  const numValue = Number.parseFloat(value)
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(numValue)
}

// Format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString // Return the original string if date is invalid
    }

    return new Intl.DateTimeFormat("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString // Return the original string if there's an error
  }
}

// Get trend indicator
const getTrendIndicator = (value: string) => {
  const numValue = Number.parseFloat(value)
  if (numValue > 0) {
    return { icon: <ArrowUpRight className="h-4 w-4 text-emerald-500" />, color: "text-emerald-500" }
  } else if (numValue < 0) {
    return { icon: <ArrowDownRight className="h-4 w-4 text-rose-500" />, color: "text-rose-500" }
  }
  return { icon: null, color: "text-gray-500" }
}

// Custom Accordion component for transactions
const TransactionAccordion = ({ subgroup }: { subgroup: Subgroup }) => {
  return (
    <AccordionItem value={subgroup.id} className="border rounded-lg overflow-hidden">
      <AccordionTrigger className="px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-medium">{subgroup.name}</span>
            <Badge variant="outline" className="ml-2">
              {subgroup.transactions.length} transactions
            </Badge>
          </div>
          <span className="font-semibold">{formatCurrency(subgroup.analysis.amount.total)}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0">
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subgroup.analysis.frequency.display}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next: {formatDate(subgroup.analysis.frequency.next.date)} •{" "}
                  {formatCurrency(subgroup.analysis.frequency.next.amount)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(subgroup.analysis.amount.average.transaction)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per month: {formatCurrency(subgroup.analysis.amount.average.month)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subgroup.analysis.range.duration} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(subgroup.analysis.range.startDate)} - {formatDate(subgroup.analysis.range.endDate)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Transactions</h4>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subgroup.transactions.length > 0 ? (
                    subgroup.transactions.map((transaction) => {
                      const amount = Number.parseFloat(transaction.amount)
                      const isPositive = amount >= 0

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell
                            className={`text-right ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                          >
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                        No transactions available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// Mock component for DatePicker since it's not available in shadcn by default
const CustomDatePicker = ({
  value,
  onChange,
}: { value: Date | undefined; onChange: (date: Date | undefined) => void }) => {
  return (
    <Input
      type="date"
      value={value ? value.toISOString().split("T")[0] : ""}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined
        onChange(date)
      }}
    />
  )
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  // Filter state
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({})
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [transactionType, setTransactionType] = useState<string>("all")

  // Add these new state variables after the existing filter state variables
  const [appliedFilters, setAppliedFilters] = useState<{
    dateRange: { start?: Date; end?: Date }
    selectedGroups: string[]
    amountRange: { min: string; max: string }
    transactionType: string
  }>({
    dateRange: {},
    selectedGroups: [],
    amountRange: { min: "", max: "" },
    transactionType: "all",
  })

  useEffect(() => {
    const reportData = localStorage.getItem("reportData")
    if (reportData) {
      try {
        setData(JSON.parse(reportData))
      } catch (e) {
        console.error("Failed to parse report data:", e)
      }
    }
  }, [])

  // Handle sharing the report
  const handleShare = () => {
    if (!shareEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share this report.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Report shared",
      description: `Report has been shared with ${shareEmail}`,
    })
    setShareDialogOpen(false)
    setShareEmail("")
  }

  // Replace the handleApplyFilters function with this implementation
  const handleApplyFilters = () => {
    // Apply the current filter settings
    setAppliedFilters({
      dateRange,
      selectedGroups,
      amountRange,
      transactionType,
    })

    toast({
      title: "Filters applied",
      description: "Report data has been filtered according to your criteria.",
    })
    setFilterDialogOpen(false)
  }

  // Handle exporting the report as PDF
  const handleExportPDF = () => {
    setExportingPdf(true)

    // Simulate PDF generation process
    setTimeout(() => {
      const link = document.createElement("a")
      link.href = "#"
      link.setAttribute("download", `${data?.title || "Financial-Report"}.pdf`)

      // Simulate a click on the link to trigger the download
      document.body.appendChild(link)

      toast({
        title: "PDF Export Complete",
        description: "Your report has been exported as a PDF file.",
      })

      setExportingPdf(false)

      // Simulate download starting
      setTimeout(() => {
        link.click()
        document.body.removeChild(link)
      }, 100)
    }, 2000)
  }

  // Handle exporting the report
  const handleExport = (format: string) => {
    if (format === "PDF") {
      handleExportPDF()
      return
    }

    toast({
      title: `${format} Export Complete`,
      description: `Report has been exported as ${format}`,
    })
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading report data...</p>
        </div>
      </div>
    )
  }

  const { filters, data: reportData } = data
  // Replace the existing filteredGroups line with this filtering logic
  // Find this line: const filteredGroups = reportData.groups.filter(isGroupMeaningful)
  // And replace it with:
  const filteredGroups = reportData.groups.filter(isGroupMeaningful).filter((group) => {
    // Filter by selected groups if any are selected
    if (appliedFilters.selectedGroups.length > 0 && !appliedFilters.selectedGroups.includes(group.id)) {
      return false
    }

    // Filter by amount range
    const groupAmount = Number.parseFloat(group.analysis.amount.total)
    const minAmount = appliedFilters.amountRange.min
      ? Number.parseFloat(appliedFilters.amountRange.min)
      : Number.NEGATIVE_INFINITY
    const maxAmount = appliedFilters.amountRange.max
      ? Number.parseFloat(appliedFilters.amountRange.max)
      : Number.POSITIVE_INFINITY

    if (groupAmount < minAmount || groupAmount > maxAmount) {
      return false
    }

    // Filter by transaction type
    if (appliedFilters.transactionType !== "all") {
      const isCredit = appliedFilters.transactionType === "credit"
      const hasCorrectTransactions = group.subgroup.some((subgroup) =>
        subgroup.transactions.some((transaction) => {
          const amount = Number.parseFloat(transaction.amount)
          return isCredit ? amount >= 0 : amount < 0
        }),
      )

      if (!hasCorrectTransactions) {
        return false
      }
    }

    // Filter by date range
    if (appliedFilters.dateRange.start || appliedFilters.dateRange.end) {
      const startDate = appliedFilters.dateRange.start ? new Date(appliedFilters.dateRange.start) : new Date(0)
      const endDate = appliedFilters.dateRange.end ? new Date(appliedFilters.dateRange.end) : new Date(8640000000000000) // Max date

      const groupStartDate = new Date(group.analysis.range.startDate)
      const groupEndDate = new Date(group.analysis.range.endDate)

      // Check if date ranges overlap
      if (groupEndDate < startDate || groupStartDate > endDate) {
        return false
      }
    }

    return true
  })

  // Also update the filteredMetrics to respect the date range filter
  // Find this line: const filteredMetrics = reportData.metrics.filter(isMetricMeaningful)
  // And replace it with:
  const filteredMetrics = reportData.metrics.filter(isMetricMeaningful).filter((metric) => {
    // Only apply date filtering to metrics
    if (appliedFilters.dateRange.start || appliedFilters.dateRange.end) {
      // For metrics, we'll just check if they belong to any of the filtered groups
      // by checking if they share any sections
      return filteredGroups.some((group) => group.sections.some((section) => metric.sections.includes(section)))
    }
    return true
  })

  // Add a function to reset filters
  const resetFilters = () => {
    setDateRange({})
    setSelectedGroups([])
    setAmountRange({ min: "", max: "" })
    setTransactionType("all")
  }

  // Prepare data for charts
  const groupChartData = filteredGroups.map((group) => ({
    name: group.title,
    value: Number.parseFloat(group.analysis.amount.total),
    count: group.analysis.summary.transactionCount,
  }))

  // Prepare pie chart data for credit/debit distribution
  const creditDebitData =
    filteredGroups.length > 0
      ? [
          { name: "Credit", value: filteredGroups[0].analysis.summary.overallPercentage.credit },
          { name: "Debit", value: filteredGroups[0].analysis.summary.overallPercentage.debit },
        ]
      : []

  const COLORS = ["#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6"]

  // Calculate total amount across all groups
  const totalAmount = filteredGroups.reduce((sum, group) => sum + Number.parseFloat(group.analysis.amount.total), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{data.title}</h1>
              <p className="text-sm text-muted-foreground">
                {data.reportType} • Created on {formatDate(data.createdDate)} by {data.createdBy}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Filter Report Data</DialogTitle>
                    <DialogDescription>Customize your report view by applying filters.</DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="date-range">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="start-date" className="text-xs">
                            Start Date
                          </Label>
                          <CustomDatePicker
                            value={dateRange.start}
                            onChange={(date) => setDateRange((prev) => ({ ...prev, start: date }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="end-date" className="text-xs">
                            End Date
                          </Label>
                          <CustomDatePicker
                            value={dateRange.end}
                            onChange={(date) => setDateRange((prev) => ({ ...prev, end: date }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Group Filter */}
                    <div className="space-y-2">
                      <Label>Groups</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                        {filteredGroups.map((group) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedGroups((prev) => [...prev, group.id])
                                } else {
                                  setSelectedGroups((prev) => prev.filter((id) => id !== group.id))
                                }
                              }}
                            />
                            <Label htmlFor={`group-${group.id}`} className="text-sm">
                              {group.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amount Range Filter */}
                    <div className="space-y-2">
                      <Label>Amount Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="min-amount" className="text-xs">
                            Min Amount
                          </Label>
                          <Input
                            id="min-amount"
                            placeholder="0.00"
                            value={amountRange.min}
                            onChange={(e) => setAmountRange((prev) => ({ ...prev, min: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="max-amount" className="text-xs">
                            Max Amount
                          </Label>
                          <Input
                            id="max-amount"
                            placeholder="1000.00"
                            value={amountRange.max}
                            onChange={(e) => setAmountRange((prev) => ({ ...prev, max: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transaction Type Filter */}
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <RadioGroup value={transactionType} onValueChange={setTransactionType} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="credit" id="credit" />
                          <Label htmlFor="credit">Credit</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="debit" id="debit" />
                          <Label htmlFor="debit">Debit</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Update the DialogFooter in the filter dialog to include a Reset button */}
                  {/* Find the DialogFooter in the filter dialog and replace it with: */}
                  <DialogFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetFilters()
                        toast({
                          title: "Filters reset",
                          description: "All filters have been reset to default values.",
                        })
                      }}
                    >
                      Reset
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApplyFilters}>Apply Filters</Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleExport("PDF")}
                    disabled={exportingPdf}
                    className="flex items-center"
                  >
                    {exportingPdf ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>Export as PDF</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("Excel")}>Export as Excel</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("CSV")}>Export as CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Report</DialogTitle>
                    <DialogDescription>Enter an email address to share this report.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="email@example.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleShare}>Share</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalAmount.toString())}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across {filteredGroups.length} groups</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredGroups.reduce((sum, group) => sum + group.analysis.summary.transactionCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total transactions analyzed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Date Range</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredGroups.length > 0 ? filteredGroups[0].analysis.range.duration : 0} days
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {filteredGroups.length > 0
                      ? `${formatDate(filteredGroups[0].analysis.range.startDate)} - ${formatDate(filteredGroups[0].analysis.range.endDate)}`
                      : "No date range available"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stable Months</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredGroups.reduce((max, group) => Math.max(max, group.analysis.amount.stableMonths), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Consistent financial patterns</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" />
                    Group Distribution
                  </CardTitle>
                  <CardDescription>Financial breakdown by group</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={(value) =>
                            new Intl.NumberFormat("en-AU", {
                              style: "currency",
                              currency: "AUD",
                              notation: "compact",
                              maximumFractionDigits: 1,
                            }).format(value)
                          }
                        />
                        <Tooltip
                          formatter={(value) => [formatCurrency(value.toString()), "Amount"]}
                          labelFormatter={(label) => `Group: ${label}`}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Credit vs Debit
                  </CardTitle>
                  <CardDescription>Distribution of credits and debits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    {creditDebitData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={creditDebitData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {creditDebitData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#f43f5e"} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-muted-foreground">No credit/debit data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applied Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Applied Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.map((filter, index) => (
                    <div
                      key={index}
                      className="flex flex-col space-y-1 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-sm font-medium text-muted-foreground">{filter.name}</span>
                      <div className="font-medium">
                        {Array.isArray(filter.value) ? (
                          <div className="flex flex-wrap gap-1">
                            {filter.value.map((item, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span>{filter.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Add a new component to display active filters */}
            {/* Add this after the Applied Filters card in the Overview tab */}
            {Object.values(appliedFilters).some((filter) =>
              Array.isArray(filter)
                ? filter.length > 0
                : typeof filter === "object"
                  ? Object.values(filter).some((v) => v !== undefined && v !== "")
                  : filter !== "all",
            ) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      Active Filters
                    </CardTitle>
                    <CardDescription>The following filters are currently applied to your report data</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetFilters()
                      setAppliedFilters({
                        dateRange: {},
                        selectedGroups: [],
                        amountRange: { min: "", max: "" },
                        transactionType: "all",
                      })
                      toast({
                        title: "Filters reset",
                        description: "All filters have been cleared.",
                      })
                    }}
                  >
                    Clear All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {appliedFilters.dateRange.start && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Date From: {formatDate(appliedFilters.dateRange.start.toISOString())}
                        </Badge>
                      </div>
                    )}
                    {appliedFilters.dateRange.end && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Date To: {formatDate(appliedFilters.dateRange.end.toISOString())}
                        </Badge>
                      </div>
                    )}
                    {appliedFilters.selectedGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Groups:</span>
                        {appliedFilters.selectedGroups.map((groupId) => {
                          const group = reportData.groups.find((g) => g.id === groupId)
                          return (
                            <Badge key={groupId} variant="secondary">
                              {group?.title || groupId}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    {appliedFilters.amountRange.min && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Min Amount: {formatCurrency(appliedFilters.amountRange.min)}</Badge>
                      </div>
                    )}
                    {appliedFilters.amountRange.max && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Max Amount: {formatCurrency(appliedFilters.amountRange.max)}</Badge>
                      </div>
                    )}
                    {appliedFilters.transactionType !== "all" && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Transaction Type: {appliedFilters.transactionType === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMetrics.map((metric) => {
                const value = metric.result?.value || "0"
                const numValue = Number.parseFloat(value)
                const { icon, color } = getTrendIndicator(value)

                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{metric.title}</CardTitle>
                          {icon}
                        </div>
                        <CardDescription>{metric.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${color}`}>
                          {metric.result?.format === "money" ? formatCurrency(value) : value}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Relevance</span>
                            <span className="font-medium">
                              {Math.abs(numValue) > 1000 ? "High" : Math.abs(numValue) > 100 ? "Medium" : "Low"}
                            </span>
                          </div>
                          <Progress value={Math.min(Math.abs(numValue) / 10, 100)} className="h-2" />
                        </div>
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground">
                        <div className="flex flex-wrap gap-1">
                          {metric.sections.map((section, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}

              {filteredMetrics.length === 0 && (
                <div className="col-span-full flex items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-muted-foreground">No meaningful metrics found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-8">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>{group.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-1 mt-1">
                        {group.sections.map((section, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(group.analysis.amount.total)}</div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-muted-foreground">Transactions</p>
                          <p className="text-xl font-bold">{group.analysis.summary.transactionCount}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-muted-foreground">Credit/Debit</p>
                          <p className="text-xl font-bold">
                            {group.analysis.summary.overallPercentage.credit}% /{" "}
                            {group.analysis.summary.overallPercentage.debit}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Amount</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-muted-foreground">Min</p>
                            <p className="text-sm font-semibold truncate">
                              {formatCurrency(group.analysis.amount.min)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-muted-foreground">Avg</p>
                            <p className="text-sm font-semibold truncate">
                              {formatCurrency(group.analysis.amount.average.transaction)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-muted-foreground">Max</p>
                            <p className="text-sm font-semibold truncate">
                              {formatCurrency(group.analysis.amount.max)}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-muted-foreground">Monthly Avg</p>
                            <p className="text-sm font-semibold">
                              {formatCurrency(group.analysis.amount.average.month)}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-muted-foreground">Current Month</p>
                            <p className="text-sm font-semibold">
                              {formatCurrency(group.analysis.amount.average.ongoingMonth)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Frequency</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Pattern</p>
                          <p className="text-xl font-bold">{group.analysis.frequency.display}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Expected</p>
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{formatDate(group.analysis.frequency.next.date)}</p>
                            <p className="font-medium">{formatCurrency(group.analysis.frequency.next.amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Subgroups</h3>
                    <Accordion type="single" collapsible className="space-y-4">
                      {group.subgroup.map((subgroup) => (
                        <TransactionAccordion key={subgroup.id} subgroup={subgroup} />
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredGroups.length === 0 && (
              <div className="flex items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-muted-foreground">No meaningful groups found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

