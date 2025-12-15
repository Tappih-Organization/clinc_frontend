import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  CheckCircle,
  Crown,
  Loader2
} from "lucide-react";
import { tenantApiService } from "@/services/api/tenantApi";
import { toast } from "@/hooks/use-toast";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    inactive: 0
  });
  const [loading, setLoading] = useState(true);

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await tenantApiService.getTenantStats();
        setStats(response.stats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Crown className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          </div>
          <p className="text-slate-600 mt-1">
            Manage and monitor the entire ClinicPro platform
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          All Systems Operational
        </Badge>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{stats.active} active</span>
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.pending} pending
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{stats.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-yellow-600">{stats.pending}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium text-red-600">{stats.suspended}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Super Admin Panel</CardTitle>
          <CardDescription>
            Manage tenants and monitor system performance from this central dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              asChild
            >
              <a href="/admin/tenants">
                <div className="bg-blue-500 p-2 rounded-lg mr-4">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Manage Tenants</div>
                  <div className="text-xs text-muted-foreground">
                    Create, edit, and manage tenant organizations
                  </div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
