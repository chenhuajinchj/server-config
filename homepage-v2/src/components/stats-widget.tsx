"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Eye } from "lucide-react"

export default function StatsWidget() {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    // Record a page view
    fetch("/api/stats", { method: "POST" }).catch(() => {})

    // Fetch current stats
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setViews(data.totalViews ?? null)
      })
      .catch(() => {})
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Site Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3">
          <Eye className="h-5 w-5 text-zinc-400" />
          <div>
            <p className="text-2xl font-bold text-white">
              {views !== null ? views.toLocaleString() : "--"}
            </p>
            <p className="text-xs text-zinc-500">Total Page Views</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
