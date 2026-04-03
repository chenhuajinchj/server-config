import Hero from "@/components/hero"
import ServiceStatus from "@/components/service-status"
import StatsWidget from "@/components/stats-widget"
import FeaturedProjects from "@/components/featured-projects"

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-8 text-2xl font-bold text-white">Featured Projects</h2>
        <FeaturedProjects />
      </section>
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ServiceStatus />
          <StatsWidget />
        </div>
      </section>
    </div>
  )
}
