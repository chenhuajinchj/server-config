import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export interface Project {
  id: string
  title: string
  description: string
  url: string | null
  imageUrl: string | null
  tags: string
  featured: boolean
}

export default function ProjectCard({ project }: { project: Project }) {
  const tags: string[] = (() => {
    if (!project.tags) return []
    try {
      const parsed = JSON.parse(project.tags)
      return Array.isArray(parsed) ? parsed : project.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    } catch {
      return project.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    }
  })()

  return (
    <Card className="group flex flex-col overflow-hidden transition-colors hover:border-zinc-700">
      {project.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-zinc-800">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {project.title}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 transition-colors hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      {tags.length > 0 && (
        <CardFooter className="mt-auto flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
