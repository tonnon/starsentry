
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface SatelliteActivity {
  id: string;
  satellite: string;
  type: string;
  timestamp: string;
  status: string;
  details: string;
}

interface SatelliteActivityTableProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const SatelliteActivityTable: React.FC<SatelliteActivityTableProps> = ({ timeRange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id) 
        : [...prev, id]
    );
  };

  // Generate sample satellite activity data
  const generateActivityData = (): SatelliteActivity[] => {
    const activityTypes = ['Orbital Adjustment', 'System Restart', 'Payload Activation', 'Telemetry Update', 'Power Mode Change'];
    const statuses = ['Completed', 'In Progress', 'Failed', 'Scheduled'];
    const satellites = ['Sentinel-6A', 'Landsat-9', 'WorldView-4', 'TerraSAR-X', 'GOES-16', 'NOAA-20'];
    
    let count = 20;
    if (timeRange === 'day') count = 8;
    if (timeRange === 'week') count = 15;
    if (timeRange === 'year') count = 30;
    
    return Array.from({ length: count }, (_, i) => {
      const timestamp = new Date();
      if (timeRange === 'day') {
        timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 24));
      } else if (timeRange === 'week') {
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));
      } else if (timeRange === 'month') {
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
      } else {
        timestamp.setMonth(timestamp.getMonth() - Math.floor(Math.random() * 12));
      }
      
      return {
        id: `act-${i}`,
        satellite: satellites[Math.floor(Math.random() * satellites.length)],
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        timestamp: timestamp.toLocaleString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        details: `Detailed information about this activity. This includes technical parameters, command logs, and operational metrics related to the ${activityTypes[Math.floor(Math.random() * activityTypes.length)]} operation.`
      };
    });
  };

  const activities = generateActivityData();
  
  const filteredActivities = activities.filter(activity => 
    activity.satellite.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400 border border-green-500/50';
      case 'In Progress': return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
      case 'Failed': return 'bg-red-500/20 text-red-400 border border-red-500/50';
      case 'Scheduled': return 'bg-purple-500/20 text-purple-400 border border-purple-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
          <Input 
            placeholder="Search activities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-space-dark border-space-light"
          />
        </div>
        <Button variant="outline" className="bg-space-dark border-space-light">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="border border-space-light rounded-md">
        <Table>
          <TableHeader className="bg-space-dark">
            <TableRow className="hover:bg-space-dark/50 border-space-light">
              <TableHead className="w-[30px] text-white"></TableHead>
              <TableHead className="text-white">Satellite</TableHead>
              <TableHead className="text-white">Activity Type</TableHead>
              <TableHead className="text-white">Timestamp</TableHead>
              <TableHead className="text-white">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-space-dark/30">
            {filteredActivities.map((activity) => (
              <React.Fragment key={activity.id}>
                <TableRow 
                  className="cursor-pointer hover:bg-space-light/10 border-space-light" 
                  onClick={() => toggleExpandRow(activity.id)}
                >
                  <TableCell>
                    {expandedRows.includes(activity.id) ? 
                      <ChevronDown className="h-4 w-4 text-white/70" /> : 
                      <ChevronRight className="h-4 w-4 text-white/70" />
                    }
                  </TableCell>
                  <TableCell className="font-medium text-white">{activity.satellite}</TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.timestamp}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(activity.id) && (
                  <TableRow className="bg-purple-500/5 border-space-light">
                    <TableCell colSpan={5} className="p-4">
                      <div className="text-sm text-white/80">
                        <h4 className="font-medium mb-2">Details</h4>
                        <p>{activity.details}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SatelliteActivityTable;
