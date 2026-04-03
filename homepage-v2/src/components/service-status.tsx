"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface ServiceHealth {
  name: string
  url: string
  status: "up" | "down" | "unknown"
  responseTime?: number
}

export default function ServiceStatus() {
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setServices(data.services || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Service Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : services.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">No services configured</p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {service.status === "up" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : service.status === "down" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-zinc-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{service.name}</p>
                    <p className="text-xs text-zinc-500">{service.url}</p>
                  </div>
                </div>
                {service.responseTime !== undefined && (
                  <span className="text-xs text-zinc-500">{service.responseTime}ms</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
