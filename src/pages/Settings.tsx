
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Shield, 
  Monitor, 
  Moon, 
  Sun, 
  Palette, 
  Save, 
  Globe, 
  Volume2, 
  VolumeX,
  RefreshCw,
  UserCog,
  Rocket
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import Sidebar from '@/components/sidebar/Sidebar';

const Settings = () => {
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been successfully saved.",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-space-dark text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-6 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Configure your space traffic management system</p>
            </div>
            <Button onClick={handleSaveSettings} className="bg-neon-blue hover:bg-neon-blue/80">
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </Button>
          </div>

          <Tabs defaultValue="appearance">
            <TabsList className="grid grid-cols-5 h-12 mb-8 bg-space-light">
              <TabsTrigger value="appearance" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                <Monitor className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                <Rocket className="mr-2 h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">
                <UserCog className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription className="text-gray-400">Customize the look and feel of the application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-space-dark p-4 rounded-lg border border-white/10 w-full h-32 flex flex-col items-center justify-center cursor-pointer relative hover:border-neon-blue transition group">
                          <Moon className="h-10 w-10 text-neon-blue group-hover:text-neon-purple transition" />
                          <span className="mt-2 text-sm">Dark Mode</span>
                          <div className="absolute -top-2 -right-2 h-5 w-5 bg-neon-blue rounded-full border-2 border-space-dark flex items-center justify-center">
                            <span className="text-xs">✓</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-white p-4 rounded-lg border border-white/10 w-full h-32 flex flex-col items-center justify-center cursor-pointer relative hover:border-neon-blue transition group">
                          <Sun className="h-10 w-10 text-space-dark group-hover:text-neon-purple transition" />
                          <span className="mt-2 text-sm text-space-dark">Light Mode</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="bg-gradient-to-b from-space-dark to-space p-4 rounded-lg border border-white/10 w-full h-32 flex flex-col items-center justify-center cursor-pointer relative hover:border-neon-blue transition group">
                          <Monitor className="h-10 w-10 text-neon-purple group-hover:text-neon-blue transition" />
                          <span className="mt-2 text-sm">System Default</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="space-y-4">
                    <Label className="text-base">UI Accent Color</Label>
                    <div className="flex space-x-3">
                      <div className="h-10 w-10 rounded-full bg-neon-blue cursor-pointer border-2 border-white/30"></div>
                      <div className="h-10 w-10 rounded-full bg-neon-purple cursor-pointer"></div>
                      <div className="h-10 w-10 rounded-full bg-status-success cursor-pointer"></div>
                      <div className="h-10 w-10 rounded-full bg-status-warning cursor-pointer"></div>
                      <div className="h-10 w-10 rounded-full bg-status-danger cursor-pointer"></div>
                      <div className="h-10 w-10 rounded-full bg-white/20 cursor-pointer flex items-center justify-center">
                        <Palette className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable animations</Label>
                        <p className="text-sm text-muted-foreground">Use motion effects across the interface</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Reduce transparency</Label>
                        <p className="text-sm text-muted-foreground">Improve contrast by reducing transparency</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure how information is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <Label className="text-base">Satellite Label Size</Label>
                    <Slider defaultValue={[75]} max={100} step={1} />
                  </div>

                  <div className="flex flex-col space-y-4">
                    <Label className="text-base">Interface Zoom</Label>
                    <Slider defaultValue={[100]} max={150} step={5} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show satellite trails</Label>
                      <p className="text-sm text-muted-foreground">Display path history for tracked objects</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription className="text-gray-400">Control how you receive alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-status-danger/20 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-status-danger" />
                        </div>
                        <div>
                          <p className="font-medium">Collision alerts</p>
                          <p className="text-sm text-muted-foreground">High-priority notifications for potential collisions</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-status-warning/20 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-status-warning" />
                        </div>
                        <div>
                          <p className="font-medium">System updates</p>
                          <p className="text-sm text-muted-foreground">Notifications about system changes and updates</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-neon-blue/20 flex items-center justify-center">
                          <Rocket className="h-5 w-5 text-neon-blue" />
                        </div>
                        <div>
                          <p className="font-medium">Mission progress</p>
                          <p className="text-sm text-muted-foreground">Updates on trajectory optimization and mission status</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="space-y-4">
                    <Label className="text-base">Alert Sound Volume</Label>
                    <div className="flex items-center space-x-2">
                      <VolumeX className="h-5 w-5 text-muted-foreground" />
                      <Slider defaultValue={[75]} max={100} step={1} className="flex-1" />
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox id="test-alerts" />
                    <Label htmlFor="test-alerts" className="text-sm">Send me a test notification</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription className="text-gray-400">Manage access and authentication preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Two-factor authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Setup</Button>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">API access tokens</Label>
                        <p className="text-sm text-muted-foreground">Manage integration access to your account</p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Session timeout</Label>
                        <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input type="number" className="w-20 bg-space" defaultValue={30} />
                        <span className="text-sm">minutes</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="space-y-4">
                    <Label className="text-base">Access Log</Label>
                    <div className="rounded-md border border-white/10 bg-space overflow-hidden">
                      <div className="px-4 py-3 bg-black/20 text-sm grid grid-cols-3">
                        <div className="font-medium">Date</div>
                        <div className="font-medium">IP Address</div>
                        <div className="font-medium">Status</div>
                      </div>
                      <div className="divide-y divide-white/10">
                        <div className="px-4 py-3 text-sm grid grid-cols-3">
                          <div>Today, 14:32</div>
                          <div>192.168.1.1</div>
                          <div className="text-status-success">Success</div>
                        </div>
                        <div className="px-4 py-3 text-sm grid grid-cols-3">
                          <div>Today, 09:15</div>
                          <div>192.168.1.1</div>
                          <div className="text-status-success">Success</div>
                        </div>
                        <div className="px-4 py-3 text-sm grid grid-cols-3">
                          <div>Yesterday, 18:42</div>
                          <div>192.168.1.1</div>
                          <div className="text-status-danger">Failed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription className="text-gray-400">Configure core system parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base">Data Refresh Rate</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="number" className="bg-space" defaultValue={5} />
                        <span className="text-sm">seconds</span>
                      </div>
                      <p className="text-xs text-muted-foreground">How often tracking data will be refreshed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-base">Map Projection</Label>
                      <div className="relative">
                        <select className="w-full h-10 px-3 rounded-md bg-space border border-input text-sm focus:outline-none">
                          <option>Mercator</option>
                          <option>Equirectangular</option>
                          <option>Azimuthal Equidistant</option>
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">Projection used for global mapping</p>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="space-y-2">
                    <Label className="text-base">Collision Risk Threshold</Label>
                    <Slider defaultValue={[25]} max={100} step={5} />
                    <div className="flex justify-between">
                      <span className="text-xs text-green-400">Low</span>
                      <span className="text-xs text-yellow-400">Medium</span>
                      <span className="text-xs text-orange-400">High</span>
                      <span className="text-xs text-red-400">Critical</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Trajectory Optimization</Label>
                      <p className="text-sm text-muted-foreground">System will automatically suggest optimized trajectories</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Remote Telemetry Access</Label>
                      <p className="text-sm text-muted-foreground">Allow external systems to access telemetry data</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Language and Region</CardTitle>
                  <CardDescription className="text-gray-400">Set your location and measurement preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-base">Interface Language</Label>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div className="relative flex-1">
                          <select className="w-full h-10 px-3 rounded-md bg-space border border-input text-sm focus:outline-none">
                            <option>English (US)</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Spanish</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-base">Measurement Units</Label>
                      <div className="relative">
                        <select className="w-full h-10 px-3 rounded-md bg-space border border-input text-sm focus:outline-none">
                          <option>Metric (km, kg)</option>
                          <option>Imperial (mi, lb)</option>
                          <option>Astronomical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox id="use-24h" defaultChecked />
                    <Label htmlFor="use-24h" className="text-sm">Use 24-hour time format</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card className="neo-border border-white/10 bg-space-light">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription className="text-gray-400">Manage your account details and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="h-24 w-24 rounded-full bg-space flex items-center justify-center border border-white/20 overflow-hidden">
                        <UserCog className="h-12 w-12 text-neon-blue" />
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input id="fullName" className="bg-space" defaultValue="Space Administrator" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" type="email" className="bg-space" defaultValue="admin@spacetraffic.com" />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm">Change Avatar</Button>
                        <Button variant="outline" size="sm">Change Password</Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Role and Permissions</h3>
                    
                    <div className="flex items-center space-x-2 bg-neon-blue/10 p-3 rounded-md border border-neon-blue/30">
                      <div className="h-8 w-8 rounded-full bg-neon-blue/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-neon-blue" />
                      </div>
                      <div>
                        <p className="font-medium">Administrator</p>
                        <p className="text-sm text-muted-foreground">Full system access and control</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-white/10 flex justify-between pt-6">
                  <Button variant="outline" className="text-status-danger">Delete Account</Button>
                  <Button className="bg-neon-blue hover:bg-neon-blue/80">Update Profile</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
