import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navigation/Navbar';

export default async function MainLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-netflix-black overflow-x-hidden">
      <Navbar />
      {children}
    </div>
  );
}
