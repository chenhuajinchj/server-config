import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Available for collaboration
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Hi, I&apos;m{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              XiaoChen
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Developer and creator exploring the intersection of AI and human cognition.
            Building tools, sharing insights, and documenting the journey toward digital freedom.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/projects">
              <Button size="lg">
                View Projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/chenhuajin" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
