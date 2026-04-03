"use client"

import { useEffect, useState } from "react"
import ProjectCard, { type Project } from "@/components/project-card"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function parseTags(tags: string): string[] {
    if (!tags) return []
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    } catch {
      return tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    }
  }

  const allTags = Array.from(
    new Set(projects.flatMap((p) => parseTags(p.tags)))
  ).sort()

  const filtered = selectedTag
    ? projects.filter((p) => parseTags(p.tags).includes(selectedTag))
    : projects

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-white">Projects</h1>
      <p className="mb-8 text-zinc-400">A collection of things I&apos;ve built and contributed to.</p>

      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selectedTag === null
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-zinc-700 text-zinc-400 hover:text-white"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedTag === tag
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-700 text-zinc-400 hover:text-white"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-zinc-500">No projects found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
