"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaSpinner } from "react-icons/fa"
import { Card, CardContent } from "@/components/ui/card"
import Cookies from "js-cookie"
import {
  COOKIES_TOKEN,
  COOKIES_JOB_ID,
  COOKIES_USER_EMAIL,
  COOKIES_VERIFICATION_TYPE,
} from "@/components/Constants/constants"

// Helper function to format date as YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const IncomeVerification = () => {
  // Get today's date and one year ago from today
  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const [title, setTitle] = useState<string>("Affordability Report")
  const [fromDate, setFromDate] = useState<string>(formatDateForInput(oneYearAgo))
  const [toDate, setToDate] = useState<string>(formatDateForInput(today))
  const [accounts, setAccounts] = useState<string[]>([]) // Array for selected account IDs
  const [users, setUsers] = useState<string[]>([]) // Array for selected user IDs
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [userList, setUserList] = useState<any[]>([])
  const [accountList, setAccountList] = useState<any[]>([]) // Store accounts for selected users
  const [accountError, setAccountError] = useState<string>("") // Error message for accounts
  const [visibleUsers, setVisibleUsers] = useState<number>(10) // Number of users to show initially
  const [, setJobId] = useState<string | null>(null) // Store job ID for polling
  const [pollAttempts, setPollAttempts] = useState<number>(0) // Counter for polling attempts
  const [reportSubType, setReportSubType] = useState<string>(Cookies.get(COOKIES_VERIFICATION_TYPE) || "income") // Use cookie value or default to 'income'

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
          console.log("Current job status:", jobStatus) // Add logging for debugging

          if (jobStatus === "success") {
            const reportUrl = statusResponse.data.links.source

            try {
              const reportResponse = await axios.get(reportUrl, {
                headers: {
                  authorization: `Bearer ${token}`,
                  accept: "application/json",
                },
              })

              localStorage.setItem("reportData", JSON.stringify(reportResponse.data))
              setIsPolling(false)
              setIsLoading(false)
              router.push("/report")
            } catch (reportErr) {
              console.error("Error fetching report:", reportErr)
              setError("Failed to fetch report data")
              setIsPolling(false)
              setIsLoading(false)
            }
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

  // Add this useEffect to clean up polling when component unmounts
  useEffect(() => {
    const pollTimer: NodeJS.Timeout | null = null

    return () => {
      // Clear any pending polling timers when component unmounts
      if (pollTimer) {
        clearTimeout(pollTimer)
      }
    }
  }, [])

  return (
    <div>
      <Card className="w-full max-w-3xl shadow-lg">
        <CardContent className="pt-4 px-6 pb-6">
          <h3 className="text-xl font-semibold">Report Details</h3>
          <div className="mt-6">
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
              <p className="text-sm text-gray-500 mt-1">{title.length}/50</p> {/* Display character count */}
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
          </div>
          <div className="mt-6">
            <Label htmlFor="reportSubType">Report Sub Type</Label>
            <Input id="reportSubType" value={reportSubType} disabled className="mt-1 w-full opacity-80" />
            <p className="text-sm text-muted-foreground mt-1">
              {Cookies.get(COOKIES_VERIFICATION_TYPE)
                ? "Using verification type from previous selection"
                : "Using default verification type (income)"}
            </p>
          </div>

          <div className="mt-6">
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
          </div>

          <div className="mt-6">
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
          </div>

          <Button onClick={handleVerifyIncome} disabled={isLoading || isPolling} className="w-full mt-4">
            {isLoading || isPolling ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2">
                  <FaSpinner />
                </div>
                Verifying...
              </div>
            ) : (
              `Verify ${capitalizeFirstLetter(reportSubType)}`
            )}
          </Button>

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export default IncomeVerification

