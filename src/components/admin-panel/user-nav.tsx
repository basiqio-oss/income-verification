"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [initial, setInitial] = useState<string>("")
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    userDetails: false,
    signOut: false,
  })

  useEffect(() => {
    const storedEmail = localStorage.getItem("USER_EMAIL")
    if (storedEmail) {
      setEmail(storedEmail)
      // Extract the first initial of the email
      const firstInitial = storedEmail.charAt(0).toUpperCase()
      setInitial(firstInitial)
    }
  }, [])

  const handleNavigation = (path: string, loadingKey: string) => {
    setIsLoading((prev) => ({ ...prev, [loadingKey]: true }))

    // Simulate a slight delay before navigation to show loading state
    setTimeout(() => {
      router.push(path)
      // We don't reset loading state here as the page will unmount anyway
    }, 300)
  }

  const handleSignOut = () => {
    setIsLoading((prev) => ({ ...prev, signOut: true }))

    // Simulate sign out process
    setTimeout(() => {
      // Clear any user data from localStorage
      localStorage.removeItem("USER_EMAIL")
      // Any other sign out logic

      // Navigate to home page
      router.push("/")
    }, 500)
  }

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="#" alt="Avatar" />
                  <AvatarFallback className="bg-transparent">{initial || "A"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onClick={() => handleNavigation("/users", "userDetails")}
            disabled={isLoading.userDetails}
          >
            {isLoading.userDetails ? (
              <Loader2 className="w-4 h-4 mr-3 animate-spin" />
            ) : (
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
            )}
            User Details
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={handleSignOut} disabled={isLoading.signOut}>
          {isLoading.signOut ? (
            <Loader2 className="w-4 h-4 mr-3 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-3 text-muted-foreground" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

