"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaSpinner } from "react-icons/fa"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Cookies from "js-cookie"
import {
  COOKIES_TOKEN,
  COOKIES_JOB_ID,
  COOKIES_USER_EMAIL,
  COOKIES_VERIFICATION_TYPE,
} from "@/components/Constants/constants"
import { HelpCircle, Info, ArrowRight, ArrowLeft, X } from "lucide-react"

// Helper function to format date as YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Tutorial steps
const tutorialSteps = [
  {
    target: "report-details",
    title: "Report Details",
    content:
      "Start by giving your report a title and selecting the date range. The default date range is set to the past year.",
    placement: "bottom",
  },
  {
    target: "report-subtype",
    title: "Report Type",
    content: "This shows whether you're verifying income or expenses, based on your previous selection.",
    placement: "bottom",
  },
  {
    target: "select-users",
    title: "Select Users",
    content: "Choose the users whose financial data you want to include in the report. You can select multiple users.",
    placement: "top",
  },
  {
    target: "select-accounts",
    title: "Select Accounts",
    content: "After selecting users, choose which of their accounts to include in the verification process.",
    placement: "top",
  },
  {
    target: "verify-button",
    title: "Submit Verification",
    content: "Once you've completed all the fields, click this button to submit your verification request.",
    placement: "top",
  },
]

const IncomeVerification = () => {
  // Get today's date and one year ago from today
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const [title, setTitle] = useState<string>("Affordability Report")
  const [fromDate, setFromDate] = useState<string>(formatDateForInput(oneYearAgo))
  const [toDate, setToDate] = useState<string>(formatDateForInput(today))
  const [accounts, setAccounts] = useState<string[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [userList, setUserList] = useState<any[]>([])
  const [accountList, setAccountList] = useState<any[]>([])
  const [accountError, setAccountError] = useState<string>("")
  const [visibleUsers, setVisibleUsers] = useState<number>(10)
  const [, setJobId] = useState<string | null>(null)
  const [pollAttempts, setPollAttempts] = useState<number>(0)
  const [reportSubType, setReportSubType] = useState<string>(Cookies.get(COOKIES_VERIFICATION_TYPE) || "income")

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState<boolean>(false)
  const [tutorialStep, setTutorialStep] = useState<number>(0)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState<boolean>(true)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const reportDetailsRef = useRef<HTMLDivElement>(null)
  const reportSubtypeRef = useRef<HTMLDivElement>(null)
  const selectUsersRef = useRef<HTMLDivElement>(null)
  const selectAccountsRef = useRef<HTMLDivElement>(null)
  const verifyButtonRef = useRef<HTMLButtonElement>(null)

  const router = useRouter()
  const token = Cookies.get(COOKIES_TOKEN)

  // Polling constants
  const POLLING_INTERVAL = 2000 // Polling every 2 seconds
  const MAX_ATTEMPTS = 30 // Maximum attempts before timeout

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userResponse = await axios.get(`https://au-api.basiq.io/users?limit=1`, {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${token}`,
          },
        })
        setUserList(userResponse.data.data)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to fetch users")
      }
    }

    fetchUsers()
  }, [token])

  useEffect(() => {
    // Get user email from cookie if available
    const userEmail = Cookies.get(COOKIES_USER_EMAIL)
    if (userEmail) {
      console.log("User email from cookie:", userEmail)
      // You can use the email here if needed
    }
  }, [])

  // Tutorial navigation
  const startTutorial = () => {
    setShowWelcomeDialog(false)
    setShowTutorial(true)
    setTutorialStep(0)
    setActiveTooltip(tutorialSteps[0].target)
  }

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1)
      setActiveTooltip(tutorialSteps[tutorialStep + 1].target)
    } else {
      endTutorial()
    }
  }

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1)
      setActiveTooltip(tutorialSteps[tutorialStep - 1].target)
    }
  }

  const endTutorial = () => {
    setShowTutorial(false)
    setActiveTooltip(null)
  }

  const handleCheckboxChange = async (userId: string) => {
    if (users.includes(userId)) {
      setUsers(users.filter((u) => u !== userId))
      setAccountList(accountList.filter((acc: any) => acc.userId !== userId))
    } else {
      setUsers([...users, userId])

      try {
        const response = await axios.get(`https://au-api.basiq.io/users/${userId}/accounts`, {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${token}`,
          },
        })

        const accountsData = response.data.data
        if (accountsData.length > 0) {
          setAccountList((prevList) => [...prevList, ...accountsData.map((acc: any) => ({ ...acc, userId }))])
        } else {
          setAccountError(`No accounts found for user ${userId}`)
        }
      } catch (err) {
        console.error("Error fetching accounts:", err)
        setAccountError("Failed to fetch accounts")
      }
    }
  }

  const handleAccountCheckboxChange = (accountId: string) => {
    if (accounts.includes(accountId)) {
      setAccounts(accounts.filter((acc) => acc !== accountId))
    } else {
      setAccounts([...accounts, accountId])
    }
  }

  const handleVerifyIncome = async () => {
    setIsLoading(true)
    setError("")
    setIsPolling(true)
    setPollAttempts(0)

    try {
      const response = await axios.post(
        "https://au-api.basiq.io/reports",
        {
          reportType: "CON_AFFOR_01",
          title: title || "Default Title",
          filters: [
            { name: "fromDate", value: fromDate },
            { name: "toDate", value: toDate },
            { name: "accounts", value: accounts },
            { name: "users", value: users },
            { name: "reportSubType", value: reportSubType }, // Added filter for sub type
          ],
        },
        {
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
        },
      )

      const jobId = response.data.id
      setJobId(jobId)
      Cookies.set(COOKIES_JOB_ID, jobId)
      console.log("Job ID:", jobId)

      // Start polling for job status
      const pollJobStatus = async () => {
        if (pollAttempts >= MAX_ATTEMPTS) {
          setError("Job status check timed out.")
          setIsPolling(false)
          setIsLoading(false)
          return
        }

        try {
          const statusResponse = await axios.get(`https://au-api.basiq.io/jobs/${jobId}`, {
            headers: {
              authorization: `Bearer ${token}`,
              accept: "application/json",
            },
          })

          const jobStatus = statusResponse.data.steps[0].status
          if (jobStatus === "success") {
            const reportUrl = statusResponse.data.links.source

            const reportResponse = await axios.get(reportUrl, {
              headers: {
                authorization: `Bearer ${token}`,
                accept: "application/json",
              },
            })

            localStorage.setItem("reportData", JSON.stringify(reportResponse.data))
            router.push("/report")
            setIsPolling(false)
            setIsLoading(false)
          } else if (jobStatus === "failed") {
            setError(`${capitalizeFirstLetter(reportSubType)} verification failed`)
            setIsPolling(false)
            setIsLoading(false)
          } else {
            setPollAttempts((prev) => prev + 1)
            setTimeout(pollJobStatus, POLLING_INTERVAL) // Poll again after the interval
          }
        } catch (err) {
          console.error("Error checking job status:", err)
          setError("Failed to check job status")
          setIsPolling(false)
          setIsLoading(false)
        }
      }

      pollJobStatus() // Start polling immediately
    } catch (err) {
      console.error(`Error verifying ${reportSubType}:`, err)
      setError(`Failed to verify ${reportSubType}`)
      setIsLoading(false)
      setIsPolling(false)
    }
  }

  const handleLoadMoreUsers = () => {
    setVisibleUsers(visibleUsers + 10) // Load 10 more users
  }

  // Render tooltip for a specific section
  const renderTooltip = (targetId: string, children: React.ReactNode) => {
    const currentStep = tutorialSteps.find((step) => step.target === targetId)

    if (!currentStep || !showTutorial || activeTooltip !== targetId) {
      return children
    }

    return (
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent
            side={currentStep.placement as any}
            className="p-4 max-w-xs bg-primary text-primary-foreground border-none"
          >
            <div className="space-y-2">
              <div className="font-bold">{currentStep.title}</div>
              <p>{currentStep.content}</p>
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevTutorialStep}
                  disabled={tutorialStep === 0}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div className="text-xs">
                  {tutorialStep + 1} of {tutorialSteps.length}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextTutorialStep}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  {tutorialStep === tutorialSteps.length - 1 ? "Finish" : "Next"}{" "}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div>
      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to {capitalizeFirstLetter(reportSubType)} Verification</DialogTitle>
            <DialogDescription>
              This tool helps you create a detailed {reportSubType} verification report. Would you like a quick
              tutorial?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Info className="h-16 w-16 text-blue-500" />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setShowWelcomeDialog(false)}>
              Skip Tutorial
            </Button>
            <Button onClick={startTutorial}>Start Tutorial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-3xl shadow-lg relative">
        {/* Help button */}
        {!showTutorial && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={() => setShowWelcomeDialog(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        )}

        {showTutorial && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-50"
            onClick={endTutorial}
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        <CardContent className="pt-4 px-6 pb-6">
          <h3 className="text-xl font-semibold">Report Details</h3>

          {renderTooltip(
            "report-details",
            <div className="mt-6" ref={reportDetailsRef} id="report-details">
              {/* Report Title in one line */}
              <div className="w-full">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter report title"
                  className="mt-1 w-full"
                  maxLength={50}
                />
                <p className="text-sm text-gray-500 mt-1">{title.length}/50</p>
              </div>

              {/* From Date and To Date side by side */}
              <div className="flex gap-6 mt-6">
                <div className="flex-1">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1 w-full"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1 w-full"
                  />
                </div>
              </div>
            </div>,
          )}

          {renderTooltip(
            "report-subtype",
            <div className="mt-6" ref={reportSubtypeRef} id="report-subtype">
              <Label htmlFor="reportSubType">Report Sub Type</Label>
              <Input id="reportSubType" value={reportSubType} disabled className="mt-1 w-full opacity-80" />
              <p className="text-sm text-muted-foreground mt-1">
                {Cookies.get(COOKIES_VERIFICATION_TYPE)
                  ? "Using verification type from previous selection"
                  : "Using default verification type (income)"}
              </p>
            </div>,
          )}

          {renderTooltip(
            "select-users",
            <div className="mt-6" ref={selectUsersRef} id="select-users">
              <h3 className="text-xl font-semibold">Select Users</h3>
              {userList.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {userList.slice(0, visibleUsers).map((user) => (
                    <div key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={user.id}
                        value={user.id}
                        checked={users.includes(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
                        className="mr-2"
                      />
                      <Label htmlFor={user.id}>{user.email || `User ${user.id}`}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No users found.</p>
              )}

              {visibleUsers < userList.length && (
                <Button onClick={handleLoadMoreUsers} className="mt-4">
                  Load More Users
                </Button>
              )}
            </div>,
          )}

          {renderTooltip(
            "select-accounts",
            <div className="mt-6" ref={selectAccountsRef} id="select-accounts">
              <h3 className="text-xl font-semibold">Select Accounts</h3>
              {accountList.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {accountList.map((account) => (
                    <div key={account.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={account.id}
                        value={account.id}
                        checked={accounts.includes(account.id)}
                        onChange={() => handleAccountCheckboxChange(account.id)}
                        className="mr-2"
                      />
                      <Label htmlFor={account.id}>{account.name || `Account ${account.id}`}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">{accountError || "No accounts found for selected users."}</p>
              )}
            </div>,
          )}

          {renderTooltip(
            "verify-button",
            <Button
              ref={verifyButtonRef}
              id="verify-button"
              onClick={handleVerifyIncome}
              disabled={isLoading || isPolling}
              className="w-full mt-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin mr-2">
                    <FaSpinner />
                  </div>
                  Verifying...
                </div>
              ) : (
                `Verify ${capitalizeFirstLetter(reportSubType)}`
              )}
            </Button>,
          )}

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export default IncomeVerification

