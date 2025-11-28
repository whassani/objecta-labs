'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Ticket, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  organization?: { name: string };
  user?: { email: string };
  assignedAdmin?: { fullName: string };
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  criticalTickets: number;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });

      const [ticketsData, statsData]: [any, any] = await Promise.all([
        api.get(`/v1/admin/tickets?${params}`),
        api.get('/v1/admin/tickets/stats'),
      ]);

      setTickets(ticketsData.tickets || []);
      setStats(statsData || null);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const userId = localStorage.getItem('userId'); // Admin user ID
      await api.post(`/v1/admin/tickets/${ticketId}/assign`, { adminUserId: userId });
      loadData();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await api.post(`/v1/admin/tickets/${ticketId}/resolve`, {
        resolution: 'Resolved by admin',
      });
      loadData();
      setDetailsDialogOpen(false);
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await api.patch(`/v1/admin/tickets/${ticketId}`, { status });
      loadData();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical' || priority === 'high') return AlertCircle;
    return MessageSquare;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-gray-600 mt-2">Manage customer support requests</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalTickets}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tickets found
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const PriorityIcon = getPriorityIcon(ticket.priority);
                return (
                  <div
                    key={ticket.id}
                    className={`p-4 border-l-4 rounded-lg hover:bg-gray-50 cursor-pointer ${
                      ticket.priority === 'critical' ? 'border-red-500 bg-red-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <PriorityIcon className={`h-5 w-5 mt-0.5 ${
                          ticket.priority === 'critical' ? 'text-red-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {ticket.organization && (
                              <span>📦 {ticket.organization.name}</span>
                            )}
                            {ticket.user && (
                              <span>👤 {ticket.user.email}</span>
                            )}
                            <span>🕒 {new Date(ticket.createdAt).toLocaleString()}</span>
                            {ticket.assignedAdmin && (
                              <span>👨‍💼 Assigned to: {ticket.assignedAdmin.fullName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!ticket.assignedAdmin && ticket.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignToMe(ticket.id);
                            }}
                          >
                            Assign to Me
                          </Button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(ticket.id);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <div className="flex gap-2 mb-3">
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mb-2">{selectedTicket.subject}</h3>
                <p className="text-gray-600">{selectedTicket.description}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Organization:</span>
                  <span className="text-sm">{selectedTicket.organization?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User:</span>
                  <span className="text-sm">{selectedTicket.user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                {selectedTicket.assignedAdmin && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Assigned to:</span>
                    <span className="text-sm">{selectedTicket.assignedAdmin.fullName}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block">Update Status</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(status) => handleUpdateStatus(selectedTicket.id, status)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedTicket && selectedTicket.status !== 'resolved' && (
              <Button onClick={() => handleResolve(selectedTicket.id)}>
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
