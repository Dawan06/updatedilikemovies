import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Movie Hub</h1>
          <p className="text-gray-400">Sign in to continue</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900/90 backdrop-blur-sm border border-gray-800",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-gray-800 hover:bg-gray-700 text-white border-gray-700",
              formButtonPrimary: "bg-primary hover:bg-primary-dark",
              formFieldInput: "bg-gray-800 border-gray-700 text-white",
              formFieldLabel: "text-gray-300",
              footerActionLink: "text-primary hover:text-primary-dark",
            },
          }}
        />
      </div>
    </div>
  );
}
