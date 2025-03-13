"use client"

import { useEffect, useState, useRef } from "react"
import axios from "axios"
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion"
import {
  User,
  Phone,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  MapPin,
  Calendar,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Wallet,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  BarChart3,
  BanknoteIcon,
} from "lucide-react"
import { COOKIES_TOKEN, COOKIES_USER_ID } from "@/components/Constants/constants"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"

// Animation variants
const containerVariants: Variants = {
  hidden: { y: 20 },
  visible: {
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
}

const cardVariants: Variants = {
  hidden: { y: 20, scale: 0.95 },
  visible: {
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

const fadeInVariants: Variants = {
  hidden: { y: 10 },
  visible: {
    y: 0,
    transition: { duration: 0.5 },
  },
}

const UsersList = () => {
  const [user, setUser] = useState<any>(null)
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const [institutionName, setInstitutionName] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([])
  const [accountHovered, setAccountHovered] = useState<string | null>(null)

  // Refs for scroll animations
  const overviewRef = useRef(null)
  const connectionsRef = useRef(null)
  const accountsRef = useRef(null)
  const profileRef = useRef(null)

  const isOverviewInView = useInView(overviewRef, { once: true, amount: 0.3 })
  const isConnectionsInView = useInView(connectionsRef, { once: true, amount: 0.3 })
  const isAccountsInView = useInView(accountsRef, { once: true, amount: 0.3 })
  const isProfileInView = useInView(profileRef, { once: true, amount: 0.3 })

  const toggleAccountExpand = (accountId: string) => {
    if (expandedAccounts.includes(accountId)) {
      setExpandedAccounts(expandedAccounts.filter((id) => id !== accountId))
    } else {
      setExpandedAccounts([...expandedAccounts, accountId])
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    // Force animation to visible state after component mounts
    const timer = setTimeout(() => {
      document.querySelectorAll(".motion-container").forEach((el) => {
        el.classList.add("force-visible")
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    setError("")

    // Retrieve token and user ID from cookies using constants
    const token = Cookies.get(COOKIES_TOKEN)
    const userId = Cookies.get(COOKIES_USER_ID)

    if (!token) {
      setError("Token not found")
      setLoading(false)
      return
    }

    if (!userId) {
      setError("User ID not found")
      setLoading(false)
      return
    }

    try {
      const userResponse = await axios.get(`https://au-api.basiq.io/users/${userId}`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
      })

      if (userResponse.data) {
        setUser(userResponse.data)

        // Fetch connection details if connections are available
        if (userResponse.data.connections && userResponse.data.connections.data.length > 0) {
          const connectionId = userResponse.data.connections.data[0].id
          const connectionResponse = await axios.get(
            `https://au-api.basiq.io/users/${userId}/connections/${connectionId}`,
            {
              headers: {
                accept: "application/json",
                authorization: `Bearer ${token}`,
              },
            },
          )

          if (connectionResponse.data) {
            setConnectionDetails(connectionResponse.data)

            // Fetch institution details
            const institutionId = connectionResponse.data.institution.id
            const institutionResponse = await axios.get(`https://au-api.basiq.io/institutions/${institutionId}`, {
              headers: {
                accept: "application/json",
                authorization: `Bearer ${token}`,
              },
            })

            if (institutionResponse.data) {
              setInstitutionName(institutionResponse.data.name)
            } else {
              setError("Institution details not found")
            }
          } else {
            setError("Connection details not found")
          }
        }
      } else {
        setError("User not found")
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUserData().finally(() => {
      setTimeout(() => setRefreshing(false), 1000) // Add a slight delay for animation
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit card":
        return <CreditCard className="h-5 w-5" />
      case "savings":
        return <BanknoteIcon className="h-5 w-5" />
      case "transaction":
        return <DollarSign className="h-5 w-5" />
      case "loan":
        return <Landmark className="h-5 w-5" />
      case "investment":
        return <BarChart3 className="h-5 w-5" />
      default:
        return <BanknoteIcon className="h-5 w-5" />
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit card":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "savings":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "transaction":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "loan":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "investment":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300"
    }
  }

  const getAccountTypeGradient = (type: string) => {
    switch (type.toLowerCase()) {
      case "credit card":
        return "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30"
      case "savings":
        return "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30"
      case "transaction":
        return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30"
      case "loan":
        return "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/30"
      case "investment":
        return "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30"
      default:
        return "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/30"
    }
  }

  const getBalanceIndicator = (account: any) => {
    // Determine if balance is positive or negative
    const isPositive = account.balance >= 0
    return (
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span className={isPositive ? "text-green-600" : "text-red-600"}>{isPositive ? "Positive" : "Negative"}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary">
          <Loader2 className="h-12 w-12 animate-spin" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-muted-foreground"
        >
          Loading user details...
        </motion.p>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
      >
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </motion.div>
    )
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
      >
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No User Found</h3>
        <p className="text-muted-foreground text-center">No user details are available.</p>
      </motion.div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8 motion-container"
      >
        {/* Header with user summary */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(user.name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.mobile && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.mobile}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.verificationStatus ? "default" : "destructive"} className="px-3 py-1">
              {user.verificationStatus ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Verified
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" /> Not Verified
                </>
              )}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className={refreshing ? "animate-spin" : ""}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Tabs for different sections */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="w-full max-w-[1200px] mx-auto">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 w-full">
                <motion.div
                  ref={overviewRef}
                  initial="hidden"
                  animate={isOverviewInView ? "visible" : "hidden"}
                  variants={cardVariants}
                  className="w-full"
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> User Information
                      </CardTitle>
                      <CardDescription>Basic details about the user</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={fadeInVariants} className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">User ID</h4>
                            <p className="font-mono text-sm bg-muted p-2 rounded">{user.id}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary" />
                              <p>{user.email}</p>
                            </div>
                          </div>
                          {user.mobile && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Mobile</h4>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <p>{user.mobile}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>

                        <motion.div variants={fadeInVariants} className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
                            <p>
                              {user.firstName || "N/A"} {user.middleName ? user.middleName + " " : ""}
                              {user.lastName || ""}
                            </p>
                          </div>
                          {user.businessName && (
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Business</h4>
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <p>{user.businessName}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Verification</h4>
                            <div className="flex items-center gap-2">
                              {user.verificationStatus ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <p className="text-green-600">Verified</p>
                                  {user.verificationDate && (
                                    <span className="text-xs text-muted-foreground">
                                      on {new Date(user.verificationDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <p className="text-red-600">Not Verified</p>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {connectionDetails && (
                  <motion.div
                    initial="hidden"
                    animate={isOverviewInView ? "visible" : "hidden"}
                    variants={cardVariants}
                    transition={{ delay: 0.2 }}
                    className="w-full"
                  >
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" /> Institution
                        </CardTitle>
                        <CardDescription>Connected financial institution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <BanknoteIcon className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{institutionName || "Financial Institution"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Connected since {new Date(connectionDetails.createdDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                            <Badge className={getStatusColor(connectionDetails.status)}>
                              {connectionDetails.status}
                            </Badge>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Used</h4>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <p>{new Date(connectionDetails.lastUsed).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Security</h4>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <p>MFA {connectionDetails.mfaEnabled ? "Enabled" : "Disabled"}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {connectionDetails && connectionDetails.accounts && connectionDetails.accounts.data.length > 0 && (
                  <motion.div
                    initial="hidden"
                    animate={isOverviewInView ? "visible" : "hidden"}
                    variants={cardVariants}
                    transition={{ delay: 0.4 }}
                    className="w-full"
                  >
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5" /> Account Summary
                        </CardTitle>
                        <CardDescription>Overview of your financial accounts</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {connectionDetails.accounts.data.slice(0, 2).map((account: any) => (
                            <motion.div
                              key={account.id}
                              whileHover={{ scale: 1.02 }}
                              className={`rounded-lg p-4 transition-all hover:shadow-md ${getAccountTypeGradient(account.class.product)}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  {getAccountTypeIcon(account.class.product)}
                                  <h3 className="font-medium">{account.name}</h3>
                                </div>
                                <Badge className={getAccountTypeColor(account.class.product)}>
                                  {account.class.product}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-4">
                                {account.accountNo.replace(/(\d{4})/g, "$1 ").trim()}
                              </p>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-muted-foreground">Balance</p>
                                  <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Available</p>
                                  <p className="text-xl font-bold">{formatCurrency(account.availableFunds)}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {connectionDetails.accounts.data.length > 2 && (
                          <div className="mt-4 text-center">
                            <Button variant="ghost" onClick={() => setActiveTab("accounts")}>
                              View All {connectionDetails.accounts.data.length} Accounts
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="space-y-6 w-full">
                <motion.div
                  ref={connectionsRef}
                  initial="hidden"
                  animate={isConnectionsInView ? "visible" : "hidden"}
                  variants={containerVariants}
                  className="w-full"
                >
                  <Card className="min-h-[600px] w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" /> Connections
                      </CardTitle>
                      <CardDescription>
                        You have {user?.connections?.count || 0} connection{user?.connections?.count !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence>
                        {user.connections && user.connections.data.length > 0 ? (
                          <motion.div variants={containerVariants} className="space-y-6">
                            {user.connections.data.map((connection: any) => (
                              <motion.div
                                key={connection.id}
                                variants={itemVariants}
                                className="border rounded-lg p-6 min-h-[250px] bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      <BanknoteIcon className="h-5 w-5 text-primary" />
                                      {institutionName || "Financial Institution"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Connection ID: {connection.id}</p>
                                  </div>

                                  {connectionDetails && connectionDetails.id === connection.id && (
                                    <Badge className={getStatusColor(connectionDetails.status)}>
                                      {connectionDetails.status}
                                    </Badge>
                                  )}
                                </div>

                                {connectionDetails && connectionDetails.id === connection.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4 mt-4"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4 text-primary" />
                                          <p>{new Date(connectionDetails.createdDate).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Used</h4>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <p>{new Date(connectionDetails.lastUsed).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Method</h4>
                                        <div className="flex items-center gap-2">
                                          <Shield className="h-4 w-4 text-primary" />
                                          <p>{connectionDetails.method}</p>
                                          {connectionDetails.mfaEnabled && (
                                            <Badge variant="outline" className="ml-2">
                                              MFA Enabled
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {connectionDetails.expiryDate && (
                                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                                        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                                          <Clock className="h-4 w-4" />
                                          <p>
                                            Expires on {new Date(connectionDetails.expiryDate).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div variants={fadeInVariants} className="text-center py-12">
                            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Connections Found</h3>
                            <p className="text-muted-foreground">
                              This user doesn&apos;t have any bank connections yet.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-6 w-full">
                <motion.div
                  ref={accountsRef}
                  initial="hidden"
                  animate={isAccountsInView ? "visible" : "hidden"}
                  variants={containerVariants}
                  className="w-full"
                >
                  <Card className="min-h-[600px] w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" /> Financial Accounts
                      </CardTitle>
                      <CardDescription>
                        {connectionDetails && connectionDetails.accounts
                          ? `${connectionDetails.accounts.data.length} account${connectionDetails.accounts.data.length !== 1 ? "s" : ""} found`
                          : "No accounts found"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence>
                        {connectionDetails &&
                        connectionDetails.accounts &&
                        connectionDetails.accounts.data.length > 0 ? (
                          <motion.div variants={containerVariants} className="space-y-4">
                            {connectionDetails.accounts.data.map((account: any) => (
                              <motion.div
                                key={account.id}
                                variants={itemVariants}
                                layout
                                className="border rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all"
                                onMouseEnter={() => setAccountHovered(account.id)}
                                onMouseLeave={() => setAccountHovered(null)}
                                animate={accountHovered === account.id ? "pulse" : ""}
                              >
                                <div
                                  className={`p-4 cursor-pointer transition-colors ${
                                    expandedAccounts.includes(account.id)
                                      ? `${getAccountTypeGradient(account.class.product)} border-b`
                                      : "hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleAccountExpand(account.id)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`h-10 w-10 rounded-full flex items-center justify-center ${getAccountTypeColor(account.class.product)}`}
                                      >
                                        {getAccountTypeIcon(account.class.product)}
                                      </div>
                                      <div>
                                        <h3 className="font-medium">{account.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                          {account.accountNo.replace(/(\d{4})/g, "$1 ").trim()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Balance</p>
                                        <p className="font-bold">{formatCurrency(account.balance)}</p>
                                      </div>
                                      {expandedAccounts.includes(account.id) ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedAccounts.includes(account.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <div className="p-4 bg-white dark:bg-slate-950 border-t border-muted">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                          <div className="bg-muted rounded-lg p-3">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                                            <Badge className={getAccountTypeColor(account.class.product)}>
                                              {account.class.product}
                                            </Badge>
                                          </div>
                                          <div className="bg-muted rounded-lg p-3">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Currency</h4>
                                            <p>{account.currency}</p>
                                          </div>
                                          <div className="bg-muted rounded-lg p-3">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                                            <Badge className={getStatusColor(account.status)}>{account.status}</Badge>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <div
                                            className={`p-4 rounded-lg ${getAccountTypeGradient(account.class.product)}`}
                                          >
                                            <h4 className="text-sm font-medium mb-2">Available Funds</h4>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-lg font-bold">
                                                {formatCurrency(account.availableFunds)}
                                              </span>
                                              <span className="text-sm text-muted-foreground">
                                                {Math.round((account.availableFunds / account.balance) * 100)}% of
                                                balance
                                              </span>
                                            </div>
                                            <Progress
                                              value={(account.availableFunds / account.balance) * 100}
                                              className="h-2"
                                            />
                                            <div className="flex justify-between items-center mt-2">
                                              <span className="text-xs text-muted-foreground">Balance Status</span>
                                              {getBalanceIndicator(account)}
                                            </div>
                                          </div>

                                          <div className="bg-muted p-3 rounded-lg">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                              Last Updated
                                            </h4>
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4 text-primary" />
                                              <p>{new Date(account.lastUpdated).toLocaleString()}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div variants={fadeInVariants} className="text-center py-12">
                            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Accounts Found</h3>
                            <p className="text-muted-foreground">No financial accounts are available for this user.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t pt-6">
                      <Button variant="outline" className="w-full max-w-xs" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh Account Data
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 w-full">
                <motion.div
                  ref={profileRef}
                  initial="hidden"
                  animate={isProfileInView ? "visible" : "hidden"}
                  variants={containerVariants}
                  className="w-full"
                >
                  <Card className="min-h-[600px] w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> User Profile
                      </CardTitle>
                      <CardDescription>Detailed profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {connectionDetails && connectionDetails.profile ? (
                        <motion.div variants={containerVariants} className="space-y-6">
                          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h4>
                                  <p className="font-medium">{connectionDetails.profile.fullName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">First Name</h4>
                                    <p>{connectionDetails.profile.firstName}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Name</h4>
                                    <p>{connectionDetails.profile.lastName}</p>
                                  </div>
                                </div>
                                {connectionDetails.profile.middleName && (
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Middle Name</h4>
                                    <p>{connectionDetails.profile.middleName}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email Addresses</h4>
                                  {connectionDetails.profile.emailAddresses.length > 0 ? (
                                    <ul className="space-y-2">
                                      {connectionDetails.profile.emailAddresses.map((email: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-primary" />
                                          <span>{email}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-muted-foreground">No email addresses available</p>
                                  )}
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone Numbers</h4>
                                  {connectionDetails.profile.phoneNumbers.length > 0 ? (
                                    <ul className="space-y-2">
                                      {connectionDetails.profile.phoneNumbers.map((phone: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-primary" />
                                          <span>{phone}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-muted-foreground">No phone numbers available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <h3 className="text-lg font-medium mb-4">Physical Addresses</h3>
                            {connectionDetails.profile.physicalAddresses.length > 0 ? (
                              <Accordion type="single" collapsible className="w-full">
                                {connectionDetails.profile.physicalAddresses.map((address: any, index: number) => (
                                  <AccordionItem key={index} value={`address-${index}`}>
                                    <AccordionTrigger className="hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>{address.formattedAddress || `Address ${index + 1}`}</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-white dark:bg-slate-950 p-2 rounded-b-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                                        <div>
                                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Address Line 1
                                          </h4>
                                          <p>{address.addressLine1}</p>
                                        </div>
                                        {address.addressLine2 && (
                                          <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                              Address Line 2
                                            </h4>
                                            <p>{address.addressLine2}</p>
                                          </div>
                                        )}
                                        {address.addressLine3 && (
                                          <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                              Address Line 3
                                            </h4>
                                            <p>{address.addressLine3}</p>
                                          </div>
                                        )}
                                        <div>
                                          <h4 className="text-sm font-medium text-muted-foreground mb-1">City</h4>
                                          <p>{address.city}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-muted-foreground mb-1">State</h4>
                                          <p>{address.state}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Postcode</h4>
                                          <p>{address.postcode}</p>
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Country</h4>
                                          <p>
                                            {address.country} ({address.countryCode})
                                          </p>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <p className="text-muted-foreground">No physical addresses available</p>
                            )}
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div variants={fadeInVariants} className="text-center py-12">
                          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Profile Information</h3>
                          <p className="text-muted-foreground">Profile details are not available for this user.</p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default UsersList

