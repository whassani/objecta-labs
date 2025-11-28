'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, MoreVertical, Trash2, Shield, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface Activity {
  id: string;
  actorName: string;
  actionType: string;
  resourceType: string;
  resourceName: string;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membersResponse, invitationsResponse, activitiesResponse] = await Promise.all([
        api.get('/team/members'),
        api.get('/team/invitations'),
        api.get('/team/activity?limit=10'),
      ]);
      setMembers(membersResponse.data);
      setInvitations(invitationsResponse.data);
      setActivities(activitiesResponse.data);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    // Validate email
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate role
    if (!inviteRole) {
      alert('Please select a role');
      return;
    }

    try {
      console.log('Sending invitation:', { email: inviteEmail, role: inviteRole, message: inviteMessage });
      const response = await api.post('/team/invite', {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage,
      });
      console.log('Invitation sent successfully:', response.data);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteMessage('');
      await loadData();
      alert('Invitation sent successfully! ✅');
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Get detailed error message
      let errorMessage = 'Failed to send invitation';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Check if backend is running.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Check if backend is running at http://localhost:3001';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Failed to send invitation ❌\n\n${errorMessage}\n\nCheck browser console for details.`);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      await api.delete(`/team/invitations/${invitationId}`);
      await loadData();
    } catch (error) {
      console.error('Failed to revoke invitation:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await api.delete(`/team/members/${memberId}`);
      await loadData();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await api.patch(`/team/members/${memberId}/role`, { role: newRole });
      await loadData();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-gray-600 mt-2">Manage your team and permissions</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to add a new member to your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {inviteRole === 'admin' && 'Can manage all resources except billing'}
                  {inviteRole === 'member' && 'Can create and edit own resources'}
                  {inviteRole === 'viewer' && 'Read-only access'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Input
                  id="message"
                  placeholder="Welcome to the team!"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail}>
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members ({members.length})</CardTitle>
          <CardDescription>People who have access to this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{member.firstName} {member.lastName}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            <CardDescription>Invitations that haven't been accepted yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()} • 
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getRoleBadgeColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest team actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.actorName}</span>
                      {' '}{activity.actionType}{' '}
                      <span className="font-semibold">{activity.resourceType}</span>
                      {activity.resourceName && ` "${activity.resourceName}"`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
