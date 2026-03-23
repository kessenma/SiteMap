import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { NavBar } from '#/components/NavBar'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 pt-20 pb-16">
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
              <p className="mb-2">
                Tap on your uploaded map to place markers at exact locations. Each marker is associated with one of
                your custom icons, making it easy to see at a glance what equipment is where.
              </p>
              <p>
                Markers follow a status workflow &mdash; <strong>active</strong>, <strong>flagged</strong>,
                or <strong>resolved</strong> &mdash; so teams can track inspection progress across the facility.
              </p>
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
              <p className="mb-2">
                All data is stored locally on your device using SQLite (encrypted with SQLCipher on mobile).
                Work in areas with no connectivity &mdash; everything syncs automatically when you reconnect.
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Background file upload queue with automatic retry</li>
                <li>Local media cache for offline photo viewing</li>
                <li>Encrypted local database on mobile devices</li>
              </ul>
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

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Real-time alerts via APNs &amp; FCM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Custom self-hosted push notification server built with Go and Gorush:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>iOS notifications via Apple Push Notification service</li>
                <li>Android notifications via Firebase Cloud Messaging</li>
                <li>Automatic device registration on login</li>
                <li>Batch notifications to multiple users</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Collaboration">
        <p className="mb-4">
          SiteMap includes a full collaboration layer built directly into the map viewer. Teams can
          discuss issues, track progress, and coordinate work without leaving the map.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Comment Threads</CardTitle>
              <CardDescription>Spatial discussions on maps</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Pin comments to exact locations on a map. Each comment supports a full thread with nested
                replies, so discussions stay attached to the relevant spot on the floor plan.
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Comments placed at x/y coordinates on the map</li>
                <li>Nested reply threads per comment</li>
                <li>Photo attachments on comments and replies</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reactions & Resolution</CardTitle>
              <CardDescription>Track acknowledgment and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                React to comments with emoji and mark issues as resolved when they're addressed:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Emoji reactions (thumbs up/down, heart, fire, eyes)</li>
                <li>Resolve and reopen comments with tracking</li>
                <li>See who resolved each issue and when</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Annotations & Checklists">
        <p className="mb-4">
          Beyond markers, SiteMap supports freehand path drawing and location-based checklists
          for structured inspection workflows.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Path Drawing</CardTitle>
              <CardDescription>Annotate maps with freehand paths</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Draw paths directly on your map to mark cable runs, routes, zones, or any spatial annotation:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Freehand drawing with smooth path rendering</li>
                <li>Custom colors and stroke widths</li>
                <li>Labels per path for quick identification</li>
                <li>Edit or delete paths after creation</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Location Checklists</CardTitle>
              <CardDescription>Structured inspection tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Create named checklists on maps with items pinned to specific locations:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Items pinned to x/y coordinates on the map</li>
                <li>Status tracking: pending, in progress, completed</li>
                <li>Photo attachments per checklist item</li>
                <li>Filter items by completion status</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Service Requests">
        <p className="mb-4">
          Operators on the plant floor can create IT service requests directly from the map,
          pinpointing exactly where the issue is and attaching photo evidence.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Issue Reporting</CardTitle>
              <CardDescription>Location-based service requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Create service requests with a pin on the map showing the exact location of the problem:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>9 predefined categories (network, hardware, software, etc.)</li>
                <li>Custom category entry for edge cases</li>
                <li>Description and multiple photo attachments</li>
                <li>Camera capture or photo library</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status Workflow</CardTitle>
              <CardDescription>Track issues to resolution</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Each service request follows a lifecycle from report to resolution:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>Open</strong> &mdash; newly reported issue</li>
                <li><strong>In Progress</strong> &mdash; technician is working on it</li>
                <li><strong>Resolved</strong> &mdash; fix applied</li>
                <li><strong>Closed</strong> &mdash; verified and complete</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="User Roles">
        <p className="mb-4">
          SiteMap uses role-based access to match how plant teams actually work. Each role has capabilities
          tailored to their day-to-day responsibilities.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Technician</CardTitle>
              <CardDescription>IT infrastructure &amp; support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Technicians manage IT infrastructure across the plant. They use SiteMap to document and maintain
                equipment locations, run audits, and respond to operator requests.
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm">
                <li>Map and manage IT infrastructure (servers, network gear, panels)</li>
                <li>Perform facility audits and inspections</li>
                <li>Handle password resets and IT help requests</li>
                <li>Create projects, upload floor plans, and define icon keys</li>
                <li>Respond to issues logged by operators</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operator</CardTitle>
              <CardDescription>Machine operators &amp; floor staff</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Operators are the people on the plant floor manning the machines. They use SiteMap to communicate
                issues to IT and document problems in real time.
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm">
                <li>Log machine breakdowns and equipment issues</li>
                <li>Send photos of problems directly to IT</li>
                <li>Request password resets and IT assistance</li>
                <li>Point to their location on the map for faster response</li>
                <li>Track the status of their reported issues</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
              <CardDescription>System administration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Admins manage the SiteMap platform itself. They control who has access, assign roles, and
                oversee all projects and data across the organization.
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm">
                <li>Invite and manage users</li>
                <li>Assign and change user roles</li>
                <li>Activate or deactivate accounts</li>
                <li>Full access to all projects, maps, and data</li>
                <li>View dashboards and audit trails</li>
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

      <Section title="Dashboard & Administration">
        <p className="mb-4">
          The web dashboard provides a centralized view of all facility data, recent activity,
          and platform administration.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
              <CardDescription>Stats and recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">At-a-glance metrics and a live activity feed:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Total projects, markers, and maps</li>
                <li>Marker counts by status (active, flagged, resolved)</li>
                <li>Recent marker updates from mobile with timestamps</li>
                <li>Filterable activity feed by status</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>Platform management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Admin-only controls for managing the platform:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>User management table with role assignment</li>
                <li>Activate or deactivate user accounts</li>
                <li>PowerSync health monitoring with refresh</li>
                <li>Object storage credentials and console access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Facility & Team Management">
        <p className="mb-4">
          Organize work by facility and manage team relationships directly from the app. Users
          can be assigned to specific facilities and collaborate with teammates across roles.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Facilities</CardTitle>
              <CardDescription>Organize by location</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Create and manage physical facilities:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Name, address, and description</li>
                <li>Assign users to specific facilities</li>
                <li>Filter maps by facility</li>
                <li>Facility cards with map counts</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Teammates</CardTitle>
              <CardDescription>Team collaboration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Invite and manage your team:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Invite teammates by email</li>
                <li>Assign roles: team member or manager</li>
                <li>Update or remove teammates</li>
                <li>Available on both web and mobile</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>User settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Manage your account and preferences:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Upload and update profile avatar</li>
                <li>Edit first and last name</li>
                <li>View assigned facilities</li>
                <li>Manage teammate connections</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Push Notifications">
        <p className="mb-4">
          SiteMap includes a fully self-hosted push notification system — no third-party push services required
          beyond Apple and Google's native gateways. This serves as a reference implementation for anyone
          building custom push notifications in an open-source project.
        </p>
        <div className="mb-6 rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
          <p className="mb-1">Mobile App</p>
          <p className="mb-1 pl-2">{'\u251C\u2500'} Register device token {'\u2500\u2500\u2192'} Web API {'\u2500\u2500\u2192'} PostgreSQL (push_devices)</p>
          <p className="mb-1 pl-2">{'\u2514\u2500'} Receive notification {'\u25C0\u2500\u2500'} APNs / FCM {'\u25C0\u2500\u2500'} Gorush {'\u25C0\u2500\u2500'} Go Server {'\u25C0\u2500\u2500'} Web App</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Go Microservice</CardTitle>
              <CardDescription>Lightweight notification server</CardDescription>
            </CardHeader>
            <CardContent>
              A minimal Go HTTP server that queries the database for device tokens and forwards
              notifications through Gorush. Supports single-user and batch sends with a simple REST API.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gorush Gateway</CardTitle>
              <CardDescription>APNs &amp; FCM push proxy</CardDescription>
            </CardHeader>
            <CardContent>
              Open-source push gateway that handles the protocol details for Apple Push Notification
              service (token-based .p8 auth) and Firebase Cloud Messaging. Runs as a Docker sidecar.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Device Registration</CardTitle>
              <CardDescription>Automatic token management</CardDescription>
            </CardHeader>
            <CardContent>
              The mobile app automatically registers its push token on login and deactivates it on logout.
              Tokens are stored in PostgreSQL with platform, environment, and device metadata.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Docker Compose</CardTitle>
              <CardDescription>One command to run</CardDescription>
            </CardHeader>
            <CardContent>
              The entire notification stack (Go server + Gorush) is defined in a single Docker Compose file.
              Just add your APNs key and run <code className="rounded bg-muted px-1 text-xs">docker compose up</code>.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Object Storage (RustFS)">
        <p className="mb-4">
          SiteMap uses a self-hosted S3-compatible object storage server (RustFS) for all file uploads &mdash;
          no third-party cloud storage required. All map images, marker photos, comment attachments, and
          checklist item photos are stored here.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>RustFS Server</CardTitle>
              <CardDescription>S3-compatible file storage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">A Rust-based object storage server with full S3 API compatibility:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Auto-creates the default media bucket on startup</li>
                <li>Access key and secret key authentication</li>
                <li>Built-in web console for browsing stored files</li>
                <li>Runs as a Docker container with persistent volumes</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>File Handling</CardTitle>
              <CardDescription>Upload, proxy, and cache</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Files flow through a consistent pipeline across both apps:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Web uploads via server functions with signed URLs</li>
                <li>Mobile saves files locally first, then queues for upload</li>
                <li>Authenticated file proxy for serving stored files</li>
                <li>Local media cache on mobile for offline access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Authentication & Security">
        <p className="mb-4">
          SiteMap uses a self-hosted authentication system — no third-party auth providers required.
          The system supports email/password login, TOTP two-factor authentication, and WebAuthn
          passkeys (Face ID, Touch ID, Windows Hello) for passwordless sign-in.
        </p>
        <div className="mb-6 rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
          <p className="mb-1">Auth Flow</p>
          <p className="mb-1 pl-2">{'\u251C\u2500'} Email + Password {'\u2500\u2500\u2192'} better-auth {'\u2500\u2500\u2192'} Session (cookie)</p>
          <p className="mb-1 pl-2">{'\u251C\u2500'} Passkey (WebAuthn) {'\u2500\u2500\u2192'} SimpleWebAuthn {'\u2500\u2500\u2192'} JWT {'\u2500\u2500\u2192'} Session</p>
          <p className="pl-2">{'\u2514\u2500'} 2FA (TOTP) {'\u2500\u2500\u2192'} Authenticator App {'\u2500\u2500\u2192'} Verify code {'\u2500\u2500\u2192'} Session</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>better-auth</CardTitle>
              <CardDescription>Self-hosted auth framework</CardDescription>
            </CardHeader>
            <CardContent>
              Handles email/password sign-in/sign-up, session management, and TOTP two-factor
              authentication. Runs entirely on your own server with a PostgreSQL backend via
              Drizzle ORM.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>WebAuthn Passkeys</CardTitle>
              <CardDescription>Passwordless authentication</CardDescription>
            </CardHeader>
            <CardContent>
              Custom implementation using SimpleWebAuthn. Supports Face ID, Touch ID, and
              Windows Hello on both web and mobile. Uses signed JWT challenge tokens for
              cross-platform compatibility.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>Admin, Operator, Technician</CardDescription>
            </CardHeader>
            <CardContent>
              Three user roles selected during signup. Admins manage users and settings, Operators
              handle field operations, and Technicians view and update maps and markers.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Multi-Step Signup</CardTitle>
              <CardDescription>Guided account creation</CardDescription>
            </CardHeader>
            <CardContent>
              Three-step signup flow: role selection, credentials entry, and 2FA setup. Passkeys
              are promoted as the primary 2FA method when the device supports them, with TOTP
              authenticator apps always available as an alternative.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="iOS Deployment (Fastlane)">
        <p className="mb-4">
          SiteMap includes a fully transparent iOS deployment pipeline built with Fastlane. All build scripts,
          configuration, and automation logic are committed to the repo so contributors can see exactly how
          builds are created and shipped to TestFlight.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Auto Version Bumping</CardTitle>
              <CardDescription>Hands-free version management</CardDescription>
            </CardHeader>
            <CardContent>
              A Node.js script automatically increments the marketing version and build number in both
              a central <code className="rounded bg-muted px-1 text-xs">ios-version.json</code> file and
              the Xcode project before every TestFlight upload. Supports patch, minor, and major bumps.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Build Logging</CardTitle>
              <CardDescription>Full logs on every deploy</CardDescription>
            </CardHeader>
            <CardContent>
              Every deployment captures the complete xcodebuild and Fastlane output into a timestamped
              log file. If a build fails, the full log is immediately available
              under <code className="rounded bg-muted px-1 text-xs">build-logs/</code> for debugging.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Auto Log Cleanup</CardTitle>
              <CardDescription>Keeps only the last 10 builds</CardDescription>
            </CardHeader>
            <CardContent>
              Before each deploy, old build logs are automatically pruned to keep only the 10 most
              recent. Empty date directories are removed and freed disk space is reported.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>One-Command Deploy</CardTitle>
              <CardDescription>Build, sign, and upload</CardDescription>
            </CardHeader>
            <CardContent>
              Run <code className="rounded bg-muted px-1 text-xs">pnpm run deploy:ios:beta</code> to
              bump the version, archive with xcodebuild, export a signed IPA, and upload to TestFlight
              in a single step. All configuration is driven by environment variables.
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Architecture">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">React Native + Re.Pack</Badge>
          <Badge variant="outline">TanStack Start</Badge>
          <Badge variant="outline">TanStack DB</Badge>
          <Badge variant="outline">PostgreSQL</Badge>
          <Badge variant="outline">PowerSync</Badge>
          <Badge variant="outline">RustFS</Badge>
          <Badge variant="outline">Gorush</Badge>
          <Badge variant="outline">Go</Badge>
          <Badge variant="outline">Docker</Badge>
          <Badge variant="outline">better-auth</Badge>
          <Badge variant="outline">SimpleWebAuthn</Badge>
          <Badge variant="outline">react-native-skia</Badge>
          <Badge variant="outline">SQLCipher</Badge>
        </div>
        <ul className="mt-4 list-none space-y-2">
          <li><strong>Mobile:</strong> React Native + Re.Pack (iOS/Android)</li>
          <li><strong>Web:</strong> React 19 + TanStack Start + TanStack DB + Drizzle ORM</li>
          <li><strong>Database:</strong> PostgreSQL (server) + SQLite/SQLCipher (mobile)</li>
          <li><strong>Sync:</strong> PowerSync (offline-first with cloud bridge)</li>
          <li><strong>File Storage:</strong> RustFS (self-hosted S3-compatible)</li>
          <li><strong>Push Notifications:</strong> Go microservice + Gorush (APNs/FCM gateway)</li>
          <li><strong>Canvas/Interaction:</strong> react-native-skia (pan/zoom/markers)</li>
          <li><strong>Infrastructure:</strong> Docker Compose for all services</li>
        </ul>
      </Section>

      <Section title="Database">
        <p className="mb-4">
          SiteMap uses PostgreSQL as its primary database, with a local SQLite replica on mobile devices
          for offline-first operation. A shared Zod schema package ensures type safety and consistency
          across all apps.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Shared Schema</CardTitle>
              <CardDescription>Single source of truth</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                All entity definitions live in a shared package using Zod schemas. Both apps import from here
                to stay in sync:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Zod schemas for runtime validation</li>
                <li>TypeScript types inferred from schemas</li>
                <li>Table and column name constants</li>
                <li>Shared enums (roles, statuses, shapes)</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dual ORM Layer</CardTitle>
              <CardDescription>PostgreSQL + SQLite</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Each app maintains its own ORM schema that references the shared constants:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>Web:</strong> Drizzle ORM with PostgreSQL (UUIDs, timestamps, foreign keys)</li>
                <li><strong>Mobile:</strong> PowerSync with op-sqlite (text/integer/real columns)</li>
                <li>Both use the same table names and column names from the shared package</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Core Tables</CardTitle>
              <CardDescription>18 data tables + auth tables</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-6">
                <li><strong>users</strong> &mdash; accounts with roles (admin, operator, technician)</li>
                <li><strong>facilities</strong> &mdash; physical locations (plants, buildings)</li>
                <li><strong>projects</strong> &mdash; site groupings with maps</li>
                <li><strong>maps</strong> &mdash; uploaded floor plans (PDF/image) with dimensions</li>
                <li><strong>map_keys</strong> &mdash; legend items with icons and colors</li>
                <li><strong>map_markers</strong> &mdash; pinned locations on maps</li>
                <li><strong>marker_photos</strong> &mdash; photos attached to markers</li>
                <li><strong>map_comments / comment_replies / comment_reactions / comment_photos</strong> &mdash; collaboration layer</li>
                <li><strong>map_paths</strong> &mdash; drawn annotations with color and width</li>
                <li><strong>map_lists / map_list_items / list_item_photos</strong> &mdash; checklists</li>
                <li><strong>service_requests / service_request_photos</strong> &mdash; IT issue tracking</li>
                <li><strong>user_facilities / teammates</strong> &mdash; team relationships</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Auth tables (sessions, accounts, verifications, passkey_credentials) are web-only and not synced to mobile.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>TanStack DB</CardTitle>
              <CardDescription>Client-side reactive collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                The web app uses TanStack DB for client-side reactive state. Server function data is loaded
                into local-only collections that enable:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Live queries with automatic re-rendering</li>
                <li>Client-side filtering and sorting</li>
                <li>Optimistic updates before server confirmation</li>
                <li>Decoupled data layer from UI components</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                This mirrors how PowerSync works on mobile &mdash; both apps use a local data layer
                that syncs with PostgreSQL, keeping the architecture consistent across platforms.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sync via PowerSync</CardTitle>
              <CardDescription>Real-time replication</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                PostgreSQL changes replicate to mobile devices through PowerSync sync streams:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>WAL-based logical replication from PostgreSQL</li>
                <li>Sync streams scoped per user or global</li>
                <li>All data tables synced automatically</li>
                <li>Cascade deletes propagate through sync</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Migrations">
        <p className="mb-4">
          Schema changes follow a structured workflow to keep PostgreSQL, Drizzle, PowerSync, and the
          shared type definitions in sync. Every migration touches multiple layers of the stack.
        </p>
        <div className="mb-6 rounded-lg border bg-muted/50 p-4 font-mono text-sm leading-relaxed">
          <p className="mb-1">Migration Flow</p>
          <p className="mb-1 pl-2">1. Update Zod schema in shared package</p>
          <p className="mb-1 pl-2">2. Update Drizzle table in web app</p>
          <p className="mb-1 pl-2">3. Generate or write SQL migration</p>
          <p className="mb-1 pl-2">4. Apply migration to PostgreSQL</p>
          <p className="mb-1 pl-2">5. Update PowerSync table in mobile app</p>
          <p className="pl-2">6. Update sync config + publication (new tables only)</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Drizzle Kit</CardTitle>
              <CardDescription>Development migrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Drizzle Kit compares your TypeScript schema against the database and generates SQL migrations
                automatically:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li><code className="rounded bg-muted px-1 text-xs">drizzle-kit generate</code> &mdash; generate migration SQL from schema diff</li>
                <li><code className="rounded bg-muted px-1 text-xs">drizzle-kit push</code> &mdash; push schema directly to dev DB</li>
                <li><code className="rounded bg-muted px-1 text-xs">drizzle-kit check</code> &mdash; compare schema against DB</li>
                <li><code className="rounded bg-muted px-1 text-xs">drizzle-kit studio</code> &mdash; visual DB browser</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Raw SQL</CardTitle>
              <CardDescription>Production migrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                For production deployments, numbered SQL migration files are stored
                in <code className="rounded bg-muted px-1 text-xs">db/migrations/</code>:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Sequential numbering (001, 002, ...)</li>
                <li>Includes ALTER TABLE, new indexes, and triggers</li>
                <li>PowerSync publication updates for new tables</li>
                <li>Applied directly via psql</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shared Schema First</CardTitle>
              <CardDescription>Types drive everything</CardDescription>
            </CardHeader>
            <CardContent>
              Every schema change starts in the shared Zod package. Add the field to the Zod schema and
              column constants first, then update each app's ORM schema. TypeScript will error in both apps
              until the ORM schemas match, preventing drift.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>PowerSync Sync</CardTitle>
              <CardDescription>Keep mobile in sync</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                After applying a migration to PostgreSQL:
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>Add new columns to the PowerSync table definition</li>
                <li>Existing columns picked up automatically via SELECT *</li>
                <li>New tables need a sync stream entry and publication update</li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
                <Badge>Phase 2</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>Collaboration (comments, reactions, threads), path drawing, checklists, service requests, facility &amp; team management</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>
                <Badge variant="secondary">Phase 3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>Document attachment (PDFs, manuals, schematics per equipment), audit reporting, advanced analytics</CardContent>
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
            <a href="https://better-auth.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              better-auth
            </a>
            {' '}&mdash; self-hosted authentication framework with 2FA support
          </li>
          <li>
            <a href="https://simplewebauthn.dev" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              SimpleWebAuthn
            </a>
            {' '}&mdash; WebAuthn/passkey implementation for passwordless authentication
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
    </div>
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
