"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  COOKIES_JOB,
  COOKIES_TOKEN,
  COOKIES_USER_EMAIL,
  COOKIES_JOB_ID,
  COOKIES_VERIFICATION_TYPE,
} from "@/components/Constants/constants"
import IncomeVerification from "@/components/income-verification"
import { CheckCircle, ArrowRight, Clock, AlertTriangle, CheckIcon, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function PlaceholderContent() {
  const [, setUserEmail] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<any>(null)
  const [, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [, setProgressBarColor] = useState<string>("green")
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

            const failedStep = steps.find((step: any) => step.status === "failed")
            if (failedStep) {
              setStatusText("Failed")
              setTitleText(failedStep.result?.title || "Job Failed")
              setProgressBarColor("red")
              setProgress(100)
              // Clear intervals when a step fails
              if (intervalRef.current) clearInterval(intervalRef.current)
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
              return
            }

            if (steps.length > 0) {
              const lastStep = steps[steps.length - 1]
              if (lastStep.status === "success") {
                setStatusText("Success")
                setTitleText("Job Completed")

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

            const allCompleted = steps.every((step: { status: string }) => step.status === "success" || step.status === "failed")
            if (allCompleted) {
              if (intervalRef.current) clearInterval(intervalRef.current)
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
            }
          })
          .catch((err) => {
            console.error("API request error:", err)
            if (err.response?.data?.error === "Internal server error") {
              setStatusText("Failed")
              setTitleText("Please retry to connect a bank account")
              setProgressBarColor("red")
              setProgress(100)
              if (intervalRef.current) clearInterval(intervalRef.current)
            } else if (err.response?.data?.message === "Please connect a bank account") {
              setStatusText("Action Required")
              setTitleText("Please connect a bank account to proceed.")
              setProgress(100)
              setProgressBarColor("gray")
              if (intervalRef.current) clearInterval(intervalRef.current)
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
        setProgress((prev) => {
          return Math.min(prev + 1, 100)
        })
      }, 500)

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

  // Helper function to get status icon and color
  const getStatusInfo = () => {
    switch (statusText) {
      case "Success":
        return {
          icon: CheckIcon,
          color: "bg-emerald-500",
          textColor: "text-emerald-500",
          bgColor: "bg-emerald-50",
        }
      case "Failed":
        return {
          icon: AlertTriangle,
          color: "bg-red-500",
          textColor: "text-red-500",
          bgColor: "bg-red-50",
        }
      case "Action Required":
        return {
          icon: ArrowUpRight,
          color: "bg-amber-500",
          textColor: "text-amber-500",
          bgColor: "bg-amber-50",
        }
      default:
        return {
          icon: Clock,
          color: "bg-blue-500",
          textColor: "text-blue-500",
          bgColor: "bg-blue-50",
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="mt-6">
      <AnimatePresence mode="wait">
        {showConnectMessage ? (
          <motion.div
            key="connect-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="w-full max-w-md shadow-sm">
              <CardContent className="pt-6 px-6 pb-6">
                <div className="flex flex-col items-start text-left">
                  <div className="mb-4 p-3 rounded-full bg-gray-100">
                    <ArrowUpRight className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Action Required</h3>
                  <p className="text-gray-600 mb-6">
                    To proceed with the {verificationType} verification, you need to connect a bank account.
                  </p>
                  <Link
                    href="/"
                    className="mt-2 inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Connect Bank Account
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : showSuccessMessage ? (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <Card className="w-full max-w-md shadow-sm border-green-100">
              <CardContent className="pt-6 px-6 pb-6">
                <div className="flex flex-col items-start text-left">
                  <div className="mb-4 p-3 rounded-full bg-emerald-50">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Connection Successful!</h3>
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
            className="w-full mb-6"
          >
            <Card className="w-full max-w-md shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full ${statusInfo.bgColor} mr-3`}>
                    <statusInfo.icon className={`h-5 w-5 ${statusInfo.textColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{statusText}</h3>
                    {titleText && <p className="text-sm text-gray-500">{titleText}</p>}
                  </div>
                  <div className="ml-auto text-2xl font-semibold">{progress}%</div>
                </div>

                {/* Progress bar container */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  {/* Animated progress bar */}
                  <motion.div
                    className={statusInfo.color}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 50,
                      damping: 10,
                    }}
                  />
                </div>

                {/* Progress steps */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {jobDetails?.steps.map((step: any, index: number) => {
                    const isCompleted = step.status === "success"
                    const isFailed = step.status === "failed"
                    const isActive = step.status === "pending" && !isFailed

                    return (
                      <div key={step.title} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                            ${
                              isFailed
                                ? "bg-red-500 text-white"
                                : isCompleted
                                  ? statusInfo.color + " text-white"
                                  : isActive
                                    ? "bg-white border-2 " + statusInfo.textColor
                                    : "bg-gray-100 text-gray-400"
                            }`}
                        >
                          {isFailed ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : isCompleted ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                          {step.title
                            .split("-")
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </div>
                        <div className="h-1 w-full bg-gray-100 mt-1">
                          {(isCompleted || isActive || isFailed) && (
                            <motion.div
                              className={isFailed ? "bg-red-500" : statusInfo.color}
                              initial={{ width: 0 }}
                              animate={{ width: isCompleted || isFailed ? "100%" : "50%" }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Flash effect for active processing */}
                {statusText === "In Progress" && (
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{ opacity: [0, 0.1, 0] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 mt-4 p-3 bg-red-50 rounded-md max-w-md"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}

