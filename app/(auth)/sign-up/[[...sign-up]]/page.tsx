import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';
import { Film, Sparkles } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-netflix-black via-netflix-dark to-netflix-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Branding */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <Image
                src="/logo.png"
                alt="ILikeMovies"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary animate-pulse" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                ILikeMovies
              </h1>
            </div>
          </div>
          <p className="text-gray-400 text-lg">Join thousands of movie lovers. Create your account and start discovering!</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="animate-scale-in">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-netflix-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-8",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white/5 hover:bg-white/10 text-white border-white/10 transition-all duration-200 mb-3",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400",
                formFieldInput: "bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary",
                formFieldLabel: "text-gray-300",
                formButtonPrimary: "bg-primary hover:bg-primary-dark text-white font-semibold transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40",
                footerActionLink: "text-primary hover:text-primary-dark transition-colors",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                formFieldSuccessText: "text-green-400",
                formFieldErrorText: "text-red-400",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-primary hover:text-primary-dark",
              },
              layout: {
                socialButtonsPlacement: "top",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Film className="w-4 h-4" />
            <span>Your Personal Movie Library</span>
          </div>
        </div>
      </div>
    </div>
  );
}
