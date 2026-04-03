"use client"

import { useEffect, useState } from "react"
import ProjectCard, { type Project } from "@/components/project-card"
import { Loader2 } from "lucide-react"

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        const featured = (data.projects || []).filter((p: Project) => p.featured)
        setProjects(featured.slice(0, 3))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">No featured projects yet.</p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
