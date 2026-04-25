// Import your global styles here
import '../styles/global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Datespots',
  description: 'Find your next date spot',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning is required by next-themes
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
