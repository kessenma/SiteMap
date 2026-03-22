import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Camera, Building2, Plus, X, UserPlus, Users, Pencil } from 'lucide-react'
import {
  getProfile,
  updateProfile,
  getUserFacilities,
  addUserFacility,
  removeUserFacility,
  getTeammates,
  addTeammate,
  updateTeammateRole,
  removeTeammate,
} from '#/server/profile-queries'
import { getFacilities } from '#/server/db-queries'

export const Route = createFileRoute('/_app/profile')({
  loader: async () => {
    const [profile, userFacilities, allFacilities, teammates] = await Promise.all([
      getProfile(),
      getUserFacilities(),
      getFacilities(),
      getTeammates(),
    ])
    return { profile, userFacilities, allFacilities, teammates }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { profile, userFacilities, allFacilities, teammates } = Route.useLoaderData()
  const router = useRouter()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, facilities, and team</p>
      </div>

      <ProfileCard profile={profile} onUpdated={() => router.invalidate()} />

      <FacilitiesSection
        userFacilities={userFacilities}
        allFacilities={allFacilities}
        onChanged={() => router.invalidate()}
      />

      <TeammatesSection
        teammates={teammates}
        onChanged={() => router.invalidate()}
      />
    </div>
  )
}

// --- Profile Card ---

type ProfileData = Awaited<ReturnType<typeof getProfile>>

function ProfileCard({ profile, onUpdated }: { profile: ProfileData; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || profile.email[0].toUpperCase()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { filePath } = await res.json()

      await updateProfile({ data: { firstName: profile.firstName, lastName: profile.lastName, image: filePath } })
      onUpdated()
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ data: { firstName, lastName } })
      setEditing(false)
      onUpdated()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.imageUrl ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <button
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 space-y-3">
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setFirstName(profile.firstName); setLastName(profile.lastName) }}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-lg font-semibold">{profile.name || profile.email}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <Badge variant="secondary" className="capitalize">{profile.role}</Badge>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Facilities Section ---

type UserFacilityRow = Awaited<ReturnType<typeof getUserFacilities>>[number]
type FacilityRow = Awaited<ReturnType<typeof getFacilities>>[number]

function FacilitiesSection({
  userFacilities,
  allFacilities,
  onChanged,
}: {
  userFacilities: UserFacilityRow[]
  allFacilities: FacilityRow[]
  onChanged: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [adding, setAdding] = useState(false)

  const assignedIds = new Set(userFacilities.map((uf) => uf.facilityId))
  const availableFacilities = allFacilities.filter((f) => !assignedIds.has(f.id))

  const handleAdd = async () => {
    if (!selectedFacilityId) return
    setAdding(true)
    try {
      await addUserFacility({ data: { facilityId: selectedFacilityId } })
      setShowAdd(false)
      setSelectedFacilityId('')
      onChanged()
    } catch (err) {
      console.error('Failed to add facility:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (facilityId: string) => {
    try {
      await removeUserFacility({ data: { facilityId } })
      onChanged()
    } catch (err) {
      console.error('Failed to remove facility:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            My Facilities
          </span>
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userFacilities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No facilities assigned yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {userFacilities.map((uf) => (
              <div key={uf.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{uf.facilityName}</p>
                  {uf.facilityAddress && (
                    <p className="text-xs text-muted-foreground">{uf.facilityAddress}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(uf.facilityId)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Facility</DialogTitle>
            </DialogHeader>
            {availableFacilities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All facilities are already assigned. Create new facilities from the Maps page.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Select facility</Label>
                  <Select value={selectedFacilityId} onValueChange={(v) => setSelectedFacilityId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a facility..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFacilities.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}{f.address ? ` — ${f.address}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={!selectedFacilityId || adding} className="w-full">
                  {adding ? 'Adding...' : 'Add Facility'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// --- Teammates Section ---

type TeammateRow = Awaited<ReturnType<typeof getTeammates>>[number]

function TeammatesSection({
  teammates,
  onChanged,
}: {
  teammates: TeammateRow[]
  onChanged: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'team_member' | 'manager'>('team_member')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!email) return
    setAdding(true)
    setError('')
    try {
      await addTeammate({ data: { email, role } })
      setShowAdd(false)
      setEmail('')
      setRole('team_member')
      onChanged()
    } catch (err: any) {
      setError(err.message || 'Failed to add teammate')
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = async (teammateId: string, newRole: 'team_member' | 'manager') => {
    try {
      await updateTeammateRole({ data: { teammateId, role: newRole } })
      onChanged()
    } catch (err) {
      console.error('Failed to update role:', err)
    }
  }

  const handleRemove = async (teammateId: string) => {
    try {
      await removeTeammate({ data: { teammateId } })
      onChanged()
    } catch (err) {
      console.error('Failed to remove teammate:', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teammates
          </span>
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teammates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No teammates added yet. Invite team members or managers.
          </p>
        ) : (
          <div className="space-y-2">
            {teammates.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={t.imageUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {t.name?.[0]?.toUpperCase() || t.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{t.name || t.email}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={t.role}
                    onValueChange={(v) => v && handleRoleChange(t.teammateId, v as 'team_member' | 'manager')}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(t.teammateId)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setError('') }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Teammate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teammate-email">Email address</Label>
                <Input
                  id="teammate-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => v && setRole(v as 'team_member' | 'manager')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleAdd} disabled={!email || adding} className="w-full">
                {adding ? 'Adding...' : 'Add Teammate'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
