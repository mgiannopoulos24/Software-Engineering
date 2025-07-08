import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Info, RefreshCw, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'REGISTERED';
  hasActiveInterestZone: boolean;
  hasActiveCollisionZone: boolean;
}

interface SystemStats {
  activeVessels: number;
  stoppedVessels: number;
  interestZones: number;
  collisionZones: number;
}

const AdminPage = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [stats, setStats] = useState<SystemStats>({
    activeVessels: 0,
    stoppedVessels: 0,
    interestZones: 0,
    collisionZones: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInfoDialogOpen, setInfoDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<User['role'] | ''>('');

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUsersError('Authentication token not found.');
        return;
      }
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setUsersError('Failed to fetch users.');
        return;
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatsError('Authentication token not found.');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const endpoints: (keyof SystemStats)[] = ['activeVessels', 'stoppedVessels', 'interestZones', 'collisionZones'];

      const requests = endpoints.map(async (stat) => {
        const endpointMap = {
          activeVessels: '/api/statistics/active-ships',
          stoppedVessels: '/api/statistics/stopped-ships',
          interestZones: '/api/statistics/interest-zones',
          collisionZones: '/api/statistics/collision-zones'
        };

        const response = await fetch(endpointMap[stat], {headers});

        if (!response.ok) {
          throw new Error(`Failed to fetch ${stat}`);
        }

        return await response.json();
      });

      const results = await Promise.all(requests);

      setStats({
        activeVessels: results[0].count,
        stoppedVessels: results[1].count,
        interestZones: results[2].count,
        collisionZones: results[3].count,
      });

    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'An unknown error occurred while fetching stats.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    void fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleDeleteUser = async (userId: number) => {
    if (currentUser?.id === userId) {
      toast.error("Action Forbidden", { description: "You cannot delete your own account." });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUsersError('Authentication token not found.');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setUsersError('Failed to delete user.');
        return;
      }
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser || !selectedRole) return;

    if (currentUser?.id === selectedUser.id) {
      toast.error("Action Forbidden", { description: "You cannot change your own role." });
      setEditDialogOpen(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUsersError('Authentication token not found.');
        return;
      }
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!response.ok) {
        setUsersError('Failed to update user role.');
        return;
      }
      const updatedUser = await response.json();
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const openInfoDialog = (user: User) => {
    setSelectedUser(user);
    setInfoDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setEditDialogOpen(true);
  };

  return (
      <div className="flex min-h-screen w-full bg-background">
        <div className="container mx-auto py-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your maritime monitoring system</p>
              </div>
              <Button variant="outline" onClick={() => { void fetchUsers(); void fetchStats(); }}>
                <RefreshCw className={`mr-2 h-4 w-4 ${(usersLoading || statsLoading) ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{usersLoading ? '...' : users.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Vessels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statsLoading ? '...' : stats.activeVessels}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Stopped Vessels</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statsLoading ? '...' : stats.stoppedVessels}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Zones of Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statsLoading ? '...' : stats.interestZones}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Collision Zones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statsLoading ? '...' : stats.collisionZones}</p>
                </CardContent>
              </Card>
              {statsError && <p className="text-sm text-red-500 col-span-full">{statsError}</p>}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {usersError && <p className="text-red-500">{usersError}</p>}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead className="text-center">Role</TableHead>
                      <TableHead className="text-center">Interest Zone</TableHead>
                      <TableHead className="text-center">Collision Zone</TableHead>
                      <TableHead className="w-[150px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center">Loading users...</TableCell></TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell><div className="font-medium">{user.email}</div></TableCell>
                              <TableCell className="text-center">
                                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>{user.role}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {user.hasActiveInterestZone ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <CheckCircle2 className="mr-1 h-4 w-4" /> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                      <XCircle className="mr-1 h-4 w-4" /> Inactive
                                    </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {user.hasActiveCollisionZone ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      <CheckCircle2 className="mr-1 h-4 w-4" /> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                      <XCircle className="mr-1 h-4 w-4" /> Inactive
                                    </Badge>
                                )}
                              </TableCell>
                              <TableCell className="flex justify-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openEditDialog(user)}
                                    disabled={currentUser?.id === user.id}
                                    title={currentUser?.id === user.id ? "You cannot edit your own role." : "Edit User"}
                                >
                                  <Edit className="h-4 w-4" /><span className="sr-only">Edit User</span>
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => openInfoDialog(user)}>
                                  <Info className="h-4 w-4" /><span className="sr-only">User Info</span>
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={currentUser?.id === user.id}
                                    title={currentUser?.id === user.id ? "You cannot delete your own account." : "Delete User"}
                                >
                                  <Trash2 className="h-4 w-4" /><span className="sr-only">Delete User</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ΔΙΟΡΘΩΣΗ: Συμπληρώθηκε το περιεχόμενο των dialogs */}
          <Dialog open={isInfoDialogOpen} onOpenChange={setInfoDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>User Information</DialogTitle>
                <DialogDescription>Details for {selectedUser?.email}.</DialogDescription>
              </DialogHeader>
              {selectedUser && (
                  <div className="space-y-4 py-4 text-sm">
                    <div className="flex justify-between">
                      <strong className="text-muted-foreground">User ID:</strong>
                      <span>{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong className="text-muted-foreground">Email:</strong>
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <strong className="text-muted-foreground">Role:</strong>
                      <Badge variant={selectedUser.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <strong className="text-muted-foreground">Interest Zone Active:</strong>
                      {selectedUser.hasActiveInterestZone ? (
                          <span className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Yes
            </span>
                      ) : (
                          <span className="flex items-center text-red-600">
              <XCircle className="mr-2 h-4 w-4" /> No
            </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <strong className="text-muted-foreground">Collision Zone Active:</strong>
                      {selectedUser.hasActiveCollisionZone ? (
                          <span className="flex items-center text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" /> Yes
            </span>
                      ) : (
                          <span className="flex items-center text-red-600">
              <XCircle className="mr-2 h-4 w-4" /> No
            </span>
                      )}
                    </div>
                  </div>
              )}
              <DialogFooter>
                <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogDescription>Change the role for {selectedUser?.email}.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as User['role'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { void handleUpdateUserRole(); }}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
};

export default AdminPage;