import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Rental Booking Dashboard",
  description: "Monitor daily car rental bookings and upcoming reminders"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
