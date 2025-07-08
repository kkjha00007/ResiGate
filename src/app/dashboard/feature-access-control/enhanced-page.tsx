// src/app/dashboard/feature-access-control/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Users, Settings, Shield, Save, Flag, Plus, Edit, Trash2, TestTube, Globe, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  FEATURES, 
  FEATURE_CATEGORIES, 
  FEATURE_TO_CATEGORY, 
  ROLE_GROUPS, 
  ROLE_TO_GROUP, 
  DEFAULT_ROLE_PERMISSIONS,
  FEATURE_TO_TIER,
  PRICING_TIERS,
  ENVIRONMENTS,
  CURRENT_ENVIRONMENT
} from '@/lib/constants';
import type { UserRole, UserRoleAssociation, FeatureFlag, PricingTier, Environment } from '@/lib/types';
import { getAllFeatureFlags, isFeatureEnabled, createFeatureContext } from '@/lib/feature-flags';
import { initializeFeatureFlags } from '@/lib/feature-flags-db';

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

interface FeatureFlagForm {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environments: { [env in Environment]?: boolean };
  roles: { [role in UserRole]?: boolean };
  tiers: { [tier in PricingTier]?: boolean };
  abTestConfig?: {
    enabled: boolean;
    groups: { [groupName: string]: { percentage: number; enabled: boolean } };
  };
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
  const [searchResults, setSearchResults] = useState<{ category: string, feature: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Feature Flag System State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [isCreateFlagDialogOpen, setIsCreateFlagDialogOpen] = useState(false);
  const [isEditFlagDialogOpen, setIsEditFlagDialogOpen] = useState(false);
  const [flagForm, setFlagForm] = useState<FeatureFlagForm>({
    key: '',
    name: '',
    description: '',
    enabled: true,
    environments: {
      dev: true,
      prod: true,
      demo: true,
    },
    roles: {},
    tiers: {
      free: true,
    },
  });

  // Load feature flags
  useEffect(() => {
    loadFeatureFlags();
  }, [selectedSociety]);

  const loadFeatureFlags = async () => {
    try {
      const flags = await getAllFeatureFlags();
      setFeatureFlags(flags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      });
    }
  };

  // Initialize feature flags system
  const initializeSystem = async () => {
    try {
      await initializeFeatureFlags(selectedSociety || 'global');
      await loadFeatureFlags();
      toast({
        title: "Success",
        description: "Feature flags system initialized successfully",
      });
    } catch (error) {
      console.error('Error initializing feature flags:', error);
      toast({
        title: "Error",
        description: "Failed to initialize feature flags system",
        variant: "destructive",
      });
    }
  };

  // Save feature flag
  const saveFeatureFlag = async (flag: FeatureFlagForm) => {
    try {
      setSaving(true);
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flag: {
            ...flag,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin',
            modifiedBy: 'admin',
          },
          societyId: selectedSociety || 'global',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feature flag');
      }

      await loadFeatureFlags();
      setIsCreateFlagDialogOpen(false);
      setIsEditFlagDialogOpen(false);
      resetFlagForm();
      
      toast({
        title: "Success",
        description: "Feature flag saved successfully",
      });
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast({
        title: "Error",
        description: "Failed to save feature flag",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete feature flag
  const deleteFeatureFlag = async (flagKey: string) => {
    try {
      const response = await fetch(`/api/feature-flags?key=${flagKey}&societyId=${selectedSociety || 'global'}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete feature flag');
      }

      await loadFeatureFlags();
      
      toast({
        title: "Success",
        description: "Feature flag deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast({
        title: "Error",
        description: "Failed to delete feature flag",
        variant: "destructive",
      });
    }
  };

  // Reset flag form
  const resetFlagForm = () => {
    setFlagForm({
      key: '',
      name: '',
      description: '',
      enabled: true,
      environments: {
        dev: true,
        prod: true,
        demo: true,
      },
      roles: {},
      tiers: {
        free: true,
      },
    });
  };

  // Open edit dialog
  const openEditDialog = (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setFlagForm({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      environments: flag.environments || {},
      roles: flag.roles || {},
      tiers: flag.tiers || {},
      abTestConfig: flag.abTestConfig,
    });
    setIsEditFlagDialogOpen(true);
  };

  // Get tier color
  const getTierColor = (tier: PricingTier) => {
    switch (tier) {
      case 'free': return 'bg-green-500';
      case 'premium': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Get environment color
  const getEnvironmentColor = (env: Environment) => {
    switch (env) {
      case 'dev': return 'bg-yellow-500';
      case 'prod': return 'bg-red-500';
      case 'demo': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Feature Flag Management Component
  const FeatureFlagManager = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Feature Flag System</h3>
          <p className="text-sm text-gray-600">Manage feature flags with environment, role, and pricing tier controls</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={initializeSystem}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Initialize System
          </Button>
          <Button 
            onClick={() => setIsCreateFlagDialogOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Flag
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {featureFlags.map((flag) => (
          <Card key={flag.key} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="h-4 w-4" />
                  <h4 className="font-medium">{flag.name}</h4>
                  <Switch 
                    checked={flag.enabled} 
                    onCheckedChange={(checked) => {
                      const updatedFlag: FeatureFlagForm = {
                        key: flag.key,
                        name: flag.name,
                        description: flag.description,
                        enabled: checked,
                        environments: flag.environments || { dev: true, prod: true, demo: true },
                        roles: flag.roles || {},
                        tiers: flag.tiers || { free: true },
                        abTestConfig: flag.abTestConfig,
                      };
                      saveFeatureFlag(updatedFlag);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">{flag.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {/* Environment badges */}
                  {flag.environments && Object.entries(flag.environments).map(([env, enabled]) => (
                    enabled && (
                      <Badge key={env} variant="secondary" className={`${getEnvironmentColor(env as Environment)} text-white`}>
                        <Globe className="h-3 w-3 mr-1" />
                        {env}
                      </Badge>
                    )
                  ))}
                  
                  {/* Tier badges */}
                  {flag.tiers && Object.entries(flag.tiers).map(([tier, enabled]) => (
                    enabled && (
                      <Badge key={tier} variant="secondary" className={`${getTierColor(tier as PricingTier)} text-white`}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        {tier}
                      </Badge>
                    )
                  ))}
                  
                  {/* A/B Test badge */}
                  {flag.abTestConfig && (
                    <Badge variant="secondary" className="bg-orange-500 text-white">
                      <TestTube className="h-3 w-3 mr-1" />
                      A/B Test
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(flag)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteFeatureFlag(flag.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Flag Dialog */}
      <Dialog open={isCreateFlagDialogOpen} onOpenChange={setIsCreateFlagDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Create a new feature flag with environment, role, and pricing tier controls
            </DialogDescription>
          </DialogHeader>
          <FeatureFlagForm />
        </DialogContent>
      </Dialog>

      {/* Edit Flag Dialog */}
      <Dialog open={isEditFlagDialogOpen} onOpenChange={setIsEditFlagDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Modify feature flag settings
            </DialogDescription>
          </DialogHeader>
          <FeatureFlagForm />
        </DialogContent>
      </Dialog>
    </div>
  );

  // Feature Flag Form Component
  const FeatureFlagForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="key">Feature Key</Label>
          <Input
            id="key"
            value={flagForm.key}
            onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })}
            placeholder="e.g., visitor_management"
          />
        </div>
        <div>
          <Label htmlFor="name">Display Name</Label>
          <Input
            id="name"
            value={flagForm.name}
            onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
            placeholder="e.g., Visitor Management"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={flagForm.description}
          onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
          placeholder="Describe what this feature flag controls..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          checked={flagForm.enabled} 
          onCheckedChange={(checked) => setFlagForm({ ...flagForm, enabled: checked })}
        />
        <Label>Enabled by default</Label>
      </div>

      <div>
        <Label>Environments</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {Object.values(ENVIRONMENTS).map((env) => (
            <div key={env} className="flex items-center space-x-2">
              <Switch 
                checked={flagForm.environments[env] || false}
                onCheckedChange={(checked) => 
                  setFlagForm({ 
                    ...flagForm, 
                    environments: { ...flagForm.environments, [env]: checked }
                  })
                }
              />
              <Label className={`${getEnvironmentColor(env)} text-white px-2 py-1 rounded text-xs`}>
                {env}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Pricing Tiers</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {Object.values(PRICING_TIERS).map((tier) => (
            <div key={tier} className="flex items-center space-x-2">
              <Switch 
                checked={flagForm.tiers[tier] || false}
                onCheckedChange={(checked) => 
                  setFlagForm({ 
                    ...flagForm, 
                    tiers: { ...flagForm.tiers, [tier]: checked }
                  })
                }
              />
              <Label className={`${getTierColor(tier)} text-white px-2 py-1 rounded text-xs`}>
                {tier}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setIsCreateFlagDialogOpen(false);
            setIsEditFlagDialogOpen(false);
            resetFlagForm();
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => saveFeatureFlag(flagForm)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  // Original code for RBAC would be here...
  // For now, I'll create a simplified version showing the tabs

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Feature Access Control</h1>
        <p className="text-gray-600">Manage feature flags and role-based access control</p>
      </div>

      <Tabs defaultValue="feature-flags" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="rbac">Role-Based Access Control</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feature-flags" className="mt-6">
          <FeatureFlagManager />
        </TabsContent>
        
        <TabsContent value="rbac" className="mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">RBAC management interface will be implemented here</p>
            <p className="text-sm text-gray-400 mt-2">This will include the existing role permission management</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
