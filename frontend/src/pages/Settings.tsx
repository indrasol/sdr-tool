import Layout from '@/components/layout/Layout';
import { useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/Auth/AuthContext';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'profile';

  // Retrieve organization name from localStorage (set by SidebarNav)
  const [orgName, setOrgName] = React.useState<string>('');
  const [role, setRole] = React.useState<string>(user?.role ?? 'Member');

  // Invite management state
  interface Invite {
    email: string;
    role: string;
    status: 'Pending' | 'Sent' | 'Accepted';
  }
  const [invites, setInvites] = React.useState<Invite[]>([]);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRoleSelect, setInviteRoleSelect] = React.useState('Member');
  React.useEffect(() => {
    const stored = localStorage.getItem('selectedOrgName');
    if (stored) setOrgName(stored);
  }, []);

  return (
    <Layout>
      <style>{`
        /* Custom styling for dropdown items to match sidebar org selector */
        .dropdown-item[data-highlighted], .dropdown-item[data-state='checked'] {
          background: linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9)) !important;
          color: #2563eb !important;
        }
      `}</style>
      <div className="space-y-6 mt-0 animate-fade-in">
        <Card className="border-none shadow-sm bg-gradient-to-r from-blue-500/15 via-teal-500/15 to-emerald-500/15 overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <div className="flex items-center">
              {/* Icon container matching other page headers */}
              <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-2 rounded-lg mr-3 shadow-inner">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center">
                <h3 className="text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-600">
                  Settings
                </h3>
                <div className="h-10 flex items-center">
                  <img
                    src="/indrabot-mascot.png"
                    alt="Indrasol Mascot"
                    className="h-20 w-auto object-contain opacity-35 ml-2 -my-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <CardDescription className="text-sm text-gray-600 mt-1">Manage your account, organization and billing preferences.</CardDescription>
          </CardContent>
        </Card>

        <Tabs defaultValue={initialTab} className="space-y-4">
          <TabsList className="w-full bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization & Teams</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-sm bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-xl hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input defaultValue={user?.username || ''} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input defaultValue={user?.email || ''} placeholder="Email address" />
                  </div>
                </div>
                {/* Additional org & role info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Organization</label>
                    <Input disabled value={orgName} placeholder="Organization" className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="h-9 w-full bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600 hover:border-blue-200 hover:shadow-sm">
                        <SelectValue>{role}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg border border-blue-100 rounded-lg">
                        {['Owner', 'Member'].map((r) => (
                          <SelectItem
                            key={r}
                            value={r}
                            style={{
                              background:
                                role === r
                                  ? 'linear-gradient(to right, rgba(219, 234, 254, 0.9), rgba(233, 213, 255, 0.9))'
                                  : 'transparent',
                              color: role === r ? '#2563eb' : undefined,
                            }}
                            className="font-inter text-blue-600 dropdown-item cursor-pointer"
                          >
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  {/* Save button styled like sidebar org selector */}
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 hover:border-blue-200 text-blue-600 hover:text-blue-700 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm transition-all"
                  >
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization">
            <Card className="shadow-sm bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-xl hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Organization & Teams</CardTitle>
                <CardDescription>Manage your organization settings and team members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">This section will let you invite new members, assign roles, and configure organization details.</p>

                {/* Invite Member Dialog */}
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600 hover:border-blue-200 hover:shadow-sm">Invite Member</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/90 backdrop-blur-md border border-blue-100/60 rounded-xl max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Invite New Member</DialogTitle>
                      <DialogDescription>Send an invitation to a team member via email.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email" placeholder="member@example.com" className="w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <Select value={inviteRoleSelect} onValueChange={setInviteRoleSelect}>
                          <SelectTrigger className="h-9 w-full bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600 hover:border-blue-200 hover:shadow-sm">
                            <SelectValue>{inviteRoleSelect}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white shadow-lg border border-blue-100 rounded-lg">
                            {['Owner', 'Member'].map((r) => (
                              <SelectItem
                                key={r}
                                value={r}
                                className="font-inter text-blue-600 dropdown-item cursor-pointer"
                              >
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        className="bg-gradient-to-r from-blue-50/70 to-purple-50/70 border-blue-100 text-blue-600 hover:text-blue-700 hover:border-blue-200 hover:from-blue-100/80 hover:to-purple-100/80 hover:shadow-sm transition-all"
                        onClick={() => {
                          const email = inviteEmail.trim();
                          if (!email) {
                            toast({ title: 'Please enter an email address.' });
                            return;
                          }
                          setInvites(prev => [...prev, { email, role: inviteRoleSelect, status: 'Pending' }]);
                          toast({ title: 'Invitation sent successfully!' });
                          // reset
                          setInviteEmail('');
                          setInviteRoleSelect('Member');
                          setInviteOpen(false);
                        }}
                      >
                        Send Invite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Pending Invites Table */}
            {invites.length > 0 && (
              <Card className="shadow-sm bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-xl hover:shadow-md transition-all">
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>Track invitations you have sent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-blue-600">
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Role</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.map((inv, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 px-3">{inv.email}</td>
                            <td className="py-2 px-3">{inv.role}</td>
                            <td className="py-2 px-3">
                              <span className="inline-flex px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{inv.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing">
            <Card className="shadow-sm bg-white/70 backdrop-blur-md border border-blue-100/60 rounded-xl hover:shadow-md transition-all">
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>View and manage your subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Billing details and invoices will appear here soon.</p>
                <Button disabled className="cursor-not-allowed">Coming Soon</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings; 