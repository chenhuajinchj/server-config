import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Nav from "@/components/nav"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "XiaoChen - Developer & Creator",
  description: "Personal homepage of XiaoChen. Developer, creator, and digital nomad exploring AI and human cognition.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-8">
          <div className="mx-auto max-w-5xl px-4 text-center text-sm text-zinc-500 sm:px-6">
            &copy; {new Date().getFullYear()} XiaoChen. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
