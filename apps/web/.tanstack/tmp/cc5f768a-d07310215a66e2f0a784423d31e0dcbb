import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-6 text-4xl font-bold text-gray-900">SiteMap</h1>

      <Section title="What is SiteMap?">
        <p>
          SiteMap is a mobile app designed for facility teams who need to document, reference, and manage
          equipment locations and responsibilities across large industrial spaces. Whether you're mapping a
          factory floor, warehouse, or plant facility, SiteMap lets you upload a reference photo, create
          custom location markers with icons, and maintain detailed records—all offline.
        </p>
      </Section>

      <Section title="The Problem">
        <p className="mb-4">
          Factory shutdowns, facility audits, and infrastructure inspections require teams to document where
          equipment is located and who's responsible for it. Teams traditionally relied on:
        </p>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>Paper checklists and hand-drawn diagrams</li>
          <li>Printed floor plans with handwritten notes</li>
          <li>Fragmented spreadsheets and email threads</li>
          <li>No visibility when connectivity is poor or nonexistent</li>
        </ul>
        <p>
          SiteMap replaces this scattered approach with a single source of truth that works offline and syncs
          when connectivity returns.
        </p>
      </Section>

      <Section title="Core Features">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Map Upload</CardTitle>
              <CardDescription>Reference layer for your project</CardDescription>
            </CardHeader>
            <CardContent>
              Upload a photo of your facility floor plan, overhead diagram, or blueprint. This becomes your
              reference layer for the entire project.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Icon Keys</CardTitle>
              <CardDescription>Define icons per equipment type</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Define custom icons and metadata for different equipment types:</p>
              <ul className="mb-2 list-disc space-y-1 pl-6">
                <li>Server cabinets</li>
                <li>Network infrastructure</li>
                <li>HVAC systems</li>
                <li>Electrical panels</li>
                <li>Any other asset you need to track</li>
              </ul>
              <p>Each icon can have a name, color, and associated metadata.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Marking</CardTitle>
              <CardDescription>Pin equipment on your map</CardDescription>
            </CardHeader>
            <CardContent>
              Tap on your uploaded map to place markers at exact locations. Each marker is associated with one of
              your custom icons, making it easy to see at a glance what equipment is where.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Records</CardTitle>
              <CardDescription>Rich metadata per marker</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Select any marker to add:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Descriptions and notes</li>
                <li>Photos of the equipment</li>
                <li>Responsibility assignments</li>
                <li>Inspection dates</li>
                <li>Any other contextual information</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offline-First Storage</CardTitle>
              <CardDescription>Works without connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              All data is stored locally on your device using SQLite. Work in areas with no
              connectivity—everything syncs automatically when you reconnect.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cloud Sync (PowerSync)</CardTitle>
              <CardDescription>Sync when connected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">When connectivity is available, your facility data syncs to an external database for:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Team collaboration</li>
                <li>Cross-facility analysis</li>
                <li>Long-term documentation</li>
                <li>Audit trails</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Use Cases">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Factory Infrastructure Audits</CardTitle>
            </CardHeader>
            <CardContent>
              Document server cabinet locations, cable runs, and network infrastructure during facility shutdowns or renovations.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Facility Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              Mark HVAC units, electrical panels, fire suppression systems, and other equipment for regular inspection and maintenance cycles.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Operations</CardTitle>
            </CardHeader>
            <CardContent>
              Track equipment locations, storage zones, and responsibility assignments across large warehouse spaces.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Safety & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              Maintain up-to-date diagrams showing emergency equipment, fire safety infrastructure, and evacuation routes.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Architecture">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">React Native + Re.Pack</Badge>
          <Badge variant="outline">Rock.js</Badge>
          <Badge variant="outline">PostgreSQL</Badge>
          <Badge variant="outline">PowerSync</Badge>
          <Badge variant="outline">react-native-skia</Badge>
          <Badge variant="outline">React Context</Badge>
        </div>
        <ul className="mt-4 list-none space-y-2">
          <li><strong>Mobile:</strong> React Native + Re.Pack (iOS/Android)</li>
          <li><strong>Server:</strong> Rock.js</li>
          <li><strong>Database:</strong> PostgreSQL</li>
          <li><strong>Sync:</strong> PowerSync (offline-first with cloud bridge)</li>
          <li><strong>Canvas/Interaction:</strong> react-native-skia (pan/zoom/markers)</li>
          <li><strong>State Management:</strong> React Context or similar</li>
        </ul>
      </Section>

      <Section title="Roadmap">
        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <Badge>Phase 1 (MVP)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>Core map, icons, markers, offline storage, PowerSync sync</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <Badge variant="secondary">Phase 2</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>Document attachment (PDFs, manuals, schematics per equipment)</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <Badge variant="secondary">Phase 3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>Multi-facility project support, team collaboration features, audit reporting</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Privacy & Data">
        <p>
          All data is stored locally on your device first. Sync to external services is optional and
          configurable. You maintain full control over what data leaves your device and when.
        </p>
      </Section>

      <Section title="Getting Started">
        <ol className="list-decimal space-y-1 pl-6">
          <li>Create a new project</li>
          <li>Upload a floor plan photo</li>
          <li>Define custom icons for your equipment types</li>
          <li>Start marking locations on your map</li>
          <li>Add details and photos to each marker</li>
          <li>Configure PowerSync to sync data when ready</li>
        </ol>
      </Section>

      <Section title="Credits">
        <p className="mb-4">This app was built with the help of the following tools:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <a href="https://ui.shadcn.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              shadcn/ui
            </a>
            {' '}&mdash; component library and MCP server for AI-assisted UI development
          </li>
          <li>
            <a href="https://www.powersync.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              PowerSync
            </a>
            {' '}&mdash; offline-first sync engine and AI agent skills for guided development
          </li>
          <li>
            <a href="https://re-pack.dev" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Re.Pack
            </a>
            {' '}&mdash; Webpack/Rspack-based toolkit for React Native
          </li>
          <li>
            <a href="https://rock.js.org" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Rock.js
            </a>
            {' '}&mdash; server framework
          </li>
        </ul>
      </Section>

      <Separator className="my-8" />
      <p className="text-sm text-muted-foreground">
        Built for teams who work in the field, in areas with unreliable connectivity, and need to maintain
        accurate facility documentation without cloud dependency.
      </p>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold text-gray-800">{title}</h2>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}
