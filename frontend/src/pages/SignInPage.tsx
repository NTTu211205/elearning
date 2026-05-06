import { SignInForm } from "@/components/auth/signin-form"
import { GalleryVerticalEnd } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="grid min-h-svh bg-gradient-to-br from-sky-50 via-background to-blue-100 lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-white/75 p-6 backdrop-blur-sm md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            LMS Pro.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-muted lg:block">
        <img
          src="loginImg.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/15" />
      </div>
    </div>
  )
}