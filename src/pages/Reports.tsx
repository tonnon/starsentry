
import React, { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import ReportSummary from '../components/reports/ReportSummary';
import OrbitStatusChart from '../components/reports/OrbitStatusChart';
import CollisionRiskTrend from '../components/reports/CollisionRiskTrend';
import SatelliteActivityTable from '../components/reports/SatelliteActivityTable';
import MissionReportsList from '../components/reports/MissionReportsList';

const Reports = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1 pl-64">
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-glow">Reports & Analytics</h1>
            <p className="text-white/70">Comprehensive data analysis and reporting tools</p>
          </header>
          
          <div className="flex gap-4 mb-6">
            <ReportSummary
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </div>
          
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-space-dark border border-white/10 mb-6">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-500/20">Dashboard</TabsTrigger>
              <TabsTrigger value="mission" className="data-[state=active]:bg-purple-500/20">Mission Reports</TabsTrigger>
              <TabsTrigger value="satellites" className="data-[state=active]:bg-purple-500/20">Satellite Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-space-dark border-space-light">
                  <CardHeader className="border-b border-space-light">
                    <CardTitle className="text-white">Orbit Status</CardTitle>
                    <CardDescription className="text-white/60">Satellite orbit health and stability</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <OrbitStatusChart timeRange={timeRange} />
                  </CardContent>
                </Card>
                
                <Card className="bg-space-dark border-space-light">
                  <CardHeader className="border-b border-space-light">
                    <CardTitle className="text-white">Collision Risk Trend</CardTitle>
                    <CardDescription className="text-white/60">Historical risk assessment data</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CollisionRiskTrend timeRange={timeRange} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="mission" className="space-y-6">
              <Card className="bg-space-dark border-space-light">
                <CardHeader className="border-b border-space-light">
                  <CardTitle className="text-white">Mission Reports</CardTitle>
                  <CardDescription className="text-white/60">Operation summaries and outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                  <MissionReportsList timeRange={timeRange} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="satellites" className="space-y-6">
              <Card className="bg-space-dark border-space-light">
                <CardHeader className="border-b border-space-light">
                  <CardTitle className="text-white">Satellite Activity Log</CardTitle>
                  <CardDescription className="text-white/60">Detailed operational activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <SatelliteActivityTable timeRange={timeRange} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reports;
