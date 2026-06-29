import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-dashboard-serif',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${lora.variable} min-h-screen bg-[#121212] text-neutral-300`}>
      {children}
    </div>
  );
}
