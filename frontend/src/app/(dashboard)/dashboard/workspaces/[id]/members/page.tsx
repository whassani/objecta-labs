'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
}

export default function WorkspaceMembersPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const workspaceId = params.id as string

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getOne(workspaceId).then(res => res.data),
  })

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspacesApi.getMembers(workspaceId).then(res => res.data),
  })

  const { data: invitations } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () => workspacesApi.getInvitations(workspaceId).then(res => res.data),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => 
      workspacesApi.inviteMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      workspacesApi.updateMemberRole(workspaceId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => workspacesApi.removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => workspacesApi.cancelInvitation(workspaceId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    },
  })

  const handleInvite = () => {
    if (!inviteEmail) return
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const handleRemoveMember = (memberId: string, memberEmail: string) => {
    if (confirm(`Remove ${memberEmail} from this workspace?`)) {
      removeMutation.mutate(memberId)
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/workspaces/${workspaceId}`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-2">
              Manage who has access to {workspace?.name}
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Members List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Current Members ({members?.length || 0})
        </h2>

        {loadingMembers ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-2">
            {members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-semibold">
                      {member.firstName?.[0] || member.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.email}
                    </p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    onChange={(e) => updateRoleMutation.mutate({
                      memberId: member.id,
                      role: e.target.value,
                    })}
                    disabled={member.role === 'owner'}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="owner" disabled>Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {member.role !== 'owner' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.email)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No members yet</p>
        )}
      </Card>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Pending Invitations ({invitations.length})
          </h2>

          <div className="space-y-2">
            {invitations.map((invitation: any) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-yellow-50"
              >
                <div className="flex items-center gap-4">
                  <EnvelopeIcon className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-600">
                      Invited {new Date(invitation.createdAt).toLocaleDateString()} • 
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={ROLE_COLORS[invitation.role as keyof typeof ROLE_COLORS]}>
                    {invitation.role}
                  </Badge>
                  <Badge variant="secondary">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Member</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="admin">Admin - Can manage members and settings</option>
                  <option value="member">Member - Can create and edit content</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  An invitation email will be sent with a link to join this workspace.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteRole('member')
                }}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
