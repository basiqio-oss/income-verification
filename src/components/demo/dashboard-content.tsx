"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { CircularProgressBar } from "@/components/CircularProgressBar"
import Cookies from "js-cookie"
import {
  COOKIES_JOB,
  COOKIES_TOKEN,
  COOKIES_USER_EMAIL,
  COOKIES_JOB_ID,
  COOKIES_VERIFICATION_TYPE,
} from "@/components/Constants/constants"
import IncomeVerification from "@/components/income-verification"
import { CheckCircle, ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [progressBarColor, setProgressBarColor] = useState<string>("green")
  const [statusText, setStatusText] = useState<string>("")
  const [titleText, setTitleText] = useState<string>("")
  const [showConnectMessage, setShowConnectMessage] = useState<boolean>(false)
  const [showVerificationForm, setShowVerificationForm] = useState<boolean>(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const email = Cookies.get(COOKIES_USER_EMAIL)
    const token = Cookies.get(COOKIES_TOKEN)

    const urlParams = new URLSearchParams(window.location.search)
    const jobId = urlParams.get("jobId")

    if (jobId) {
      Cookies.set(COOKIES_JOB, jobId)
      Cookies.set(COOKIES_JOB_ID, jobId)
    } else {
      const storedJobId = Cookies.get(COOKIES_JOB_ID)
      if (!storedJobId) {
        setShowConnectMessage(true)
        return
      }
    }

    if (token) {
      Cookies.set(COOKIES_TOKEN, token)
    }

    setUserEmail(email || null)

    if (token) {
      setLoading(true)

      const fetchJobDetails = () => {
        const currentJobId = jobId || Cookies.get(COOKIES_JOB_ID)

        if (!currentJobId) {
          setShowConnectMessage(true)
          return
        }

        axios
          .get(`/api/get-job`)
          .then((response) => {
            const jobData = response.data
            setJobDetails(jobData)

            const steps = jobData.steps || []
            const totalSteps = steps.length
            const completedSteps = steps.filter((step: any) => step.status === "success").length
            const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

            setProgress(progressPercentage)

            const anyFailure = steps.some((step: any) => step.status === "failed")
            setProgressBarColor(anyFailure ? "red" : "green")

            if (anyFailure) {
              const failedStep = steps.find((step: any) => step.status === "failed")
              setStatusText("Failed")
              setTitleText(failedStep.result?.title || "Job Failed")
              setProgress(100)
            } else if (steps.length > 0) {
              const lastStep = steps[steps.length - 1]
              if (lastStep.status === "success") {
                setStatusText("Success")
                setTitleText("Job Completed")

                // Show success message and then verification form after a delay
                if (progress === 100) {
                  setShowSuccessMessage(true)
                  setTimeout(() => {
                    setShowVerificationForm(true)
                  }, 2000)
                }
              } else {
                setStatusText("In Progress")
                setTitleText("")
              }
            } else {
              setStatusText("No Steps")
              setTitleText("")
            }

            const lastStep = steps[steps.length - 1]
            if (lastStep && (lastStep.status === "success" || lastStep.status === "failed")) {
              clearInterval(intervalRef.current!)
              clearInterval(progressIntervalRef.current!)
            }
          })
          .catch((err) => {
            console.error("API request error:", err)
            if (err.response?.data?.error === "Internal server error") {
              setStatusText("Failed")
              setTitleText("Please retry to connect a bank account")
              setProgressBarColor("red")
              setProgress(100)
              clearInterval(intervalRef.current!)
            } else if (err.response?.data?.message === "Please connect a bank account") {
              setStatusText("Action Required")
              setTitleText("Please connect a bank account to proceed.")
              setProgress(100)
              setProgressBarColor("gray")
              clearInterval(intervalRef.current!)
            } else {
              setError("Failed to fetch job details: " + (err.response?.data?.error || err.message || "Unknown error"))
            }
          })
          .finally(() => setLoading(false))
      }

      fetchJobDetails()

      intervalRef.current = setInterval(() => {
        fetchJobDetails()
      }, 2000)

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100))
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      }
    } else {
      setError("Token is missing")
    }
  }, [progress])

  const handleContinueToVerification = () => {
    setShowSuccessMessage(false)
    setShowVerificationForm(true)
  }

  const verificationType = Cookies.get(COOKIES_VERIFICATION_TYPE) || "income"

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <AnimatePresence mode="wait">
        {showConnectMessage ? (
          <motion.div
            key="connect-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center mb-6"
          >
            <CircularProgressBar
              value={0}
              color="gray"
              status="Action Required"
              title="Please connect a bank account"
            />
            <div className="mt-8 text-center">
              <p className="text-lg text-gray-700 mb-4">
                To proceed with the {verificationType} verification, you need to connect a bank account.
              </p>
              <Link
                href="/"
                className="mt-2 inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Connect Bank Account
              </Link>
            </div>
          </motion.div>
        ) : showSuccessMessage ? (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center mb-10"
          >
            <Card className="w-full max-w-md shadow-lg border-green-200">
              <CardContent className="pt-6 px-6 pb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 text-green-500">
                    <CheckCircle size={60} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Connection Successful!</h3>
                  <p className="text-gray-600 mb-6">
                    Your bank account has been successfully connected. You can now proceed with your {verificationType}{" "}
                    verification.
                  </p>
                  <Button onClick={handleContinueToVerification} className="flex items-center gap-2">
                    Continue to Verification <ArrowRight size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : showVerificationForm ? (
          <motion.div
            key="verification-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4"
          >
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
              {verificationType === "income" ? "Income" : "Expense"} Verification
            </h2>
            <IncomeVerification />
          </motion.div>
        ) : (
          <motion.div
            key="progress-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center mb-6"
          >
            <CircularProgressBar value={progress} color={progressBarColor} status={statusText} title={titleText} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 mt-4 p-3 bg-red-50 rounded-md"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}

