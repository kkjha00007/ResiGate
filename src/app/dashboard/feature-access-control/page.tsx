// src/app/dashboard/feature-access-control/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronRight, Users, Settings, Shield, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FEATURES, FEATURE_CATEGORIES, FEATURE_TO_CATEGORY, ROLE_GROUPS, ROLE_TO_GROUP, DEFAULT_ROLE_PERMISSIONS } from '@/lib/constants';
import type { UserRole, UserRoleAssociation } from '@/lib/types';

interface RolePermissionSettings {
  role: UserRole;
  roleGroup: string;
  isEnabled: boolean;
  permissions: { [feature: string]: string[] };
}

interface Society {
  id: string;
  name: string;
  city: string;
}

interface FeatureAccessControlData {
  societies: Society[];
  roleSettings: { [societyId: string]: { [role: string]: RolePermissionSettings } };
}

export default function FeatureAccessControlPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSociety, setSelectedSociety] = useState<string>('');
  const [data, setData] = useState<FeatureAccessControlData>({
    societies: [],
    roleSettings: {}
  });
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Load initial data
  useEffect(() => {
    loadFeatureAccessData();
  }, []);

  const loadFeatureAccessData = async () => {
    try {
      setLoading(true);

      // Load societies (simplified - you may need to adjust based on your API)
      const societiesResponse = await fetch('/api/societies');
      const societies = societiesResponse.ok ? await societiesResponse.json() : [];

      // Load role settings for each society
      const roleSettings: { [societyId: string]: { [role: string]: RolePermissionSettings } } = {};
      
      for (const society of societies) {
        roleSettings[society.id] = {};
        
        // Initialize default settings for each role group
        Object.entries(ROLE_GROUPS).forEach(([groupName, roleNames]) => {
          const rolesArray = Array.from(roleNames);
          rolesArray.forEach((roleString: string) => {
            const role = roleString as UserRole;
            const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS];
            const convertedPermissions: { [feature: string]: string[] } = {};
            
            if (defaultPerms && typeof defaultPerms === 'object') {
              Object.keys(defaultPerms).forEach(feature => {
                const perms = defaultPerms[feature as keyof typeof defaultPerms];
                convertedPermissions[feature] = Array.isArray(perms) ? perms : [];
              });
            }

            roleSettings[society.id][role] = {
              role,
              roleGroup: groupName,
              isEnabled: true, // Default enabled
              permissions: convertedPermissions
            };
          });
        });
      }

      setData({ societies, roleSettings });
      if (societies.length > 0) {
        setSelectedSociety(societies[0].id);
      }

    } catch (error) {
      console.error('Error loading feature access data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feature access control data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryExpansion = (key: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleRoleEnabled = (role: UserRole, enabled: boolean) => {
    if (!selectedSociety) return;

    setData(prevData => ({
      ...prevData,
      roleSettings: {
        ...prevData.roleSettings,
        [selectedSociety]: {
          ...prevData.roleSettings[selectedSociety],
          [role]: {
            ...prevData.roleSettings[selectedSociety][role],
            isEnabled: enabled
          }
        }
      }
    }));
  };

  const toggleFeaturePermission = (role: UserRole, feature: string, permission: string, enabled: boolean) => {
    if (!selectedSociety) return;

    setData(prevData => {
      const currentPermissions = prevData.roleSettings[selectedSociety][role].permissions[feature] || [];
      let newPermissions: string[];

      if (enabled) {
        newPermissions = [...currentPermissions, permission];
      } else {
        newPermissions = currentPermissions.filter(p => p !== permission);
      }

      return {
        ...prevData,
        roleSettings: {
          ...prevData.roleSettings,
          [selectedSociety]: {
            ...prevData.roleSettings[selectedSociety],
            [role]: {
              ...prevData.roleSettings[selectedSociety][role],
              permissions: {
                ...prevData.roleSettings[selectedSociety][role].permissions,
                [feature]: newPermissions
              }
            }
          }
        }
      };
    });
  };

  const saveRoleSettings = async () => {
    if (!selectedSociety) return;

    try {
      setSaving(true);

      const roleSettingsToSave = data.roleSettings[selectedSociety];
      
      const response = await fetch('/api/rbac/feature-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyId: selectedSociety,
          roleSettings: roleSettingsToSave
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save role settings');
      }

      toast({
        title: 'Success',
        description: 'Feature access settings saved successfully'
      });

    } catch (error) {
      console.error('Error saving role settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feature access settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = (role: UserRole) => {
    if (!selectedSociety) return;

    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS];
    const convertedPermissions: { [feature: string]: string[] } = {};
    
    if (defaultPerms && typeof defaultPerms === 'object') {
      Object.keys(defaultPerms).forEach(feature => {
        const perms = defaultPerms[feature as keyof typeof defaultPerms];
        convertedPermissions[feature] = Array.isArray(perms) ? perms : [];
      });
    }
    
    setData(prevData => ({
      ...prevData,
      roleSettings: {
        ...prevData.roleSettings,
        [selectedSociety]: {
          ...prevData.roleSettings[selectedSociety],
          [role]: {
            ...prevData.roleSettings[selectedSociety][role],
            permissions: convertedPermissions
          }
        }
      }
    }));
  };

  // Get feature keys and filter them
  const featureKeys = Object.keys(FEATURES);
  const filteredFeatures = featureKeys.filter(featureKey => {
    const featureValue = FEATURES[featureKey as keyof typeof FEATURES];
    return featureKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
           featureValue.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group features by category
  const categoryKeys = Object.keys(FEATURE_CATEGORIES);
  const groupedFeatures = categoryKeys.reduce((acc: { [category: string]: string[] }, categoryKey) => {
    const category = FEATURE_CATEGORIES[categoryKey as keyof typeof FEATURE_CATEGORIES];
    acc[category] = filteredFeatures.filter(feature => 
      FEATURE_TO_CATEGORY[feature as keyof typeof FEATURE_TO_CATEGORY] === category
    );
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Feature Access Control</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading feature access control...</p>
          </div>
        </div>
      </div>
    );
  }

  const roleGroupKeys = Object.keys(ROLE_GROUPS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Feature Access Control</h1>
        </div>
        <Button onClick={saveRoleSettings} disabled={saving || !selectedSociety}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Configure feature access permissions for each role group across different societies. 
          Enable/disable entire modules and set granular CRUD permissions.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Society Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Society Selection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="society-select">Select Society</Label>
                <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a society" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.societies.map(society => (
                      <SelectItem key={society.id} value={society.id}>
                        {society.name} ({society.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search-features">Search Features</Label>
                <Input
                  id="search-features"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Group Settings */}
        <div className="lg:col-span-2">
          {selectedSociety && (
            <Tabs defaultValue={roleGroupKeys[0]} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                {roleGroupKeys.map(groupName => (
                  <TabsTrigger key={groupName} value={groupName} className="capitalize">
                    {groupName.replace('_', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {roleGroupKeys.map(groupName => {
                const roleNames = ROLE_GROUPS[groupName as keyof typeof ROLE_GROUPS];
                const rolesArray = Array.from(roleNames); // Convert readonly array to regular array

                return (
                  <TabsContent key={groupName} value={groupName}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="h-5 w-5" />
                          <span className="capitalize">{groupName.replace('_', ' ')} Roles</span>
                        </CardTitle>
                        <CardDescription>
                          Configure feature access for {groupName.replace('_', ' ')} role group
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {rolesArray.map((roleString: string) => {
                            const role = roleString as UserRole;
                            const roleSettings = data.roleSettings[selectedSociety]?.[role];
                            if (!roleSettings) return null;

                            return (
                              <div key={role} className="space-y-4 p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Switch
                                      checked={roleSettings.isEnabled}
                                      onCheckedChange={(enabled) => toggleRoleEnabled(role, enabled)}
                                    />
                                    <div>
                                      <Label className="text-sm font-medium capitalize">
                                        {role.replace('_', ' ')}
                                      </Label>
                                      <Badge variant="secondary" className="ml-2">
                                        {roleSettings.isEnabled ? 'Enabled' : 'Disabled'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => resetToDefaults(role)}
                                  >
                                    Reset to Defaults
                                  </Button>
                                </div>

                                {roleSettings.isEnabled && (
                                  <div className="space-y-3">
                                    {Object.keys(groupedFeatures).map(category => {
                                      const categoryFeatures = groupedFeatures[category];
                                      if (!categoryFeatures || categoryFeatures.length === 0) return null;

                                      const expandKey = `${role}-${category}`;
                                      const isExpanded = expandedCategories[expandKey];

                                      return (
                                        <div key={category} className="border rounded-lg">
                                          <button
                                            className="flex items-center space-x-2 w-full text-left p-3 hover:bg-muted rounded-t-lg"
                                            onClick={() => toggleCategoryExpansion(expandKey)}
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <span className="text-sm font-medium capitalize">
                                              {category}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {categoryFeatures.length} features
                                            </Badge>
                                          </button>
                                          {isExpanded && (
                                            <div className="p-3 pt-0 space-y-2">
                                              {categoryFeatures.map((feature: string) => {
                                                const permissions = roleSettings.permissions[feature] || [];
                                                const crudOptions = ['create', 'read', 'update', 'delete'];
                                                const featureDisplayName = FEATURES[feature as keyof typeof FEATURES];

                                                return (
                                                  <div key={feature} className="space-y-2 p-3 bg-muted/30 rounded">
                                                    <Label className="text-sm font-medium">
                                                      {featureDisplayName}
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                      {crudOptions.map(permission => (
                                                        <label key={permission} className="flex items-center space-x-1 text-xs">
                                                          <input
                                                            type="checkbox"
                                                            checked={permissions.includes(permission)}
                                                            onChange={(e) => toggleFeaturePermission(
                                                              role, 
                                                              feature, 
                                                              permission, 
                                                              e.target.checked
                                                            )}
                                                            className="rounded"
                                                          />
                                                          <span className="capitalize">{permission}</span>
                                                        </label>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
