import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { getAllUsers, getStorageConfig, updateUserRole, toggleUserActive, checkPowerSyncHealth } from '#/server/admin-queries'
import { Users, Shield, HardDrive, ExternalLink, Eye, EyeOff, Activity, RefreshCw } from 'lucide-react'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: ({ context }) => {
    if (context.session?.user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  loader: async () => {
    const [users, storage, powerSync] = await Promise.all([
      getAllUsers(),
      getStorageConfig(),
      checkPowerSyncHealth(),
    ])
    return { users, storage, powerSync }
  },
  component: AdminPanel,
})

function AdminPanel() {
  const { users: initialUsers, storage, powerSync: initialPowerSync } = Route.useLoaderData()
  const [userList, setUserList] = useState(initialUsers)
  const [showSecret, setShowSecret] = useState(false)
  const [psHealth, setPsHealth] = useState(initialPowerSync)
  const [psChecking, setPsChecking] = useState(false)

  const recheckPowerSync = async () => {
    setPsChecking(true)
    try {
      const result = await checkPowerSyncHealth()
      setPsHealth(result)
    } catch {
      setPsHealth({ url: psHealth.url, status: 0, ok: false, error: 'Check failed' })
    } finally {
      setPsChecking(false)
    }
  }

  const activeAdminCount = userList.filter((u) => u.role === 'admin' && u.isActive).length
  const isLastAdmin = (user: (typeof userList)[number]) =>
    user.role === 'admin' && user.isActive && activeAdminCount <= 1

  const handleRoleChange = async (userId: string, role: 'admin' | 'operator' | 'technician') => {
    await updateUserRole({ data: { userId, role } })
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    )
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    await toggleUserActive({ data: { userId, isActive } })
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive } : u))
    )
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default' as const
      case 'operator': return 'secondary' as const
      default: return 'outline' as const
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Admin Panel
        </h1>
        <p className="text-sm text-gray-500">Manage users, roles, and access</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            PowerSync Server
          </CardTitle>
          <CardDescription>Sync server health check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Endpoint</span>
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{psHealth.url}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <div className="flex items-center gap-2">
                {psHealth.ok ? (
                  <Badge variant="outline" className="text-green-600">
                    {psHealth.status} OK
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600">
                    {psHealth.error || `HTTP ${psHealth.status}`}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={recheckPowerSync}
                  disabled={psChecking}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${psChecking ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Liveness Probe</span>
              <a
                href={`${psHealth.url}/probes/liveness`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline text-xs"
              >
                /probes/liveness
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Object Storage
          </CardTitle>
          <CardDescription>Admin console credentials for the RustFS storage server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Console URL</span>
              <a
                href={storage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
              >
                {storage.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Access Key</span>
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">{storage.key}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Secret Key</span>
              <div className="flex items-center gap-2">
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                  {showSecret ? storage.secret : '••••••••••••••••'}
                </code>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({userList.length})
          </CardTitle>
          <CardDescription>Manage team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          {userList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 h-10 w-10 text-gray-300" />
              <h3 className="text-sm font-medium text-gray-900">No users yet</h3>
              <p className="mt-1 text-sm text-gray-500">Users will appear here after they sign up.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName ? `${user.firstName} ${user.lastName}` : '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as 'admin' | 'operator' | 'technician')
                        }
                        disabled={isLastAdmin(user)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-green-600">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                        disabled={isLastAdmin(user)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
