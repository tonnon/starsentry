
import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useDebounce } from 'use-debounce';

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
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id) 
        : [...prev, id]
    );
  };

  const generateBaseActivityData = (): SatelliteActivity[] => {
    const activityTypes = ['Orbital Adjustment', 'System Restart', 'Payload Activation', 'Telemetry Update', 'Power Mode Change'];
    const statuses = ['Completed', 'In Progress', 'Failed', 'Scheduled'];
    const satellites = ['Sentinel-6A', 'Landsat-9', 'WorldView-4', 'TerraSAR-X', 'GOES-16', 'NOAA-20'];
    
    // Total number of activities to generate
    const totalActivities = 100;
    
    return Array.from({ length: totalActivities }, (_, i) => {
      const now = new Date();
      const timestamp = new Date(now);
      
      // Distribute activities across different time periods
      const timeDistribution = Math.random();
      
      if (timeDistribution < 0.3) {
        // 30% of activities in last day
        timestamp.setHours(now.getHours() - Math.floor(Math.random() * 24));
      } else if (timeDistribution < 0.6) {
        // 30% in last week (1-7 days)
        timestamp.setDate(now.getDate() - 1 - Math.floor(Math.random() * 6));
      } else if (timeDistribution < 0.85) {
        // 25% in last month (1-4 weeks)
        timestamp.setDate(now.getDate() - 7 - Math.floor(Math.random() * 21));
      } else {
        timestamp.setMonth(now.getMonth() - 1 - Math.floor(Math.random() * 11));
      }
      
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      timestamp.setSeconds(Math.floor(Math.random() * 60));
      
      return {
        id: `act-${i}`,
        satellite: satellites[Math.floor(Math.random() * satellites.length)],
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        timestamp: timestamp.toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        details: `Detailed log for ${activityTypes[Math.floor(Math.random() * activityTypes.length)]} operation. ` +
                 `Performed on ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}. ` +
                 `Current status: ${statuses[Math.floor(Math.random() * statuses.length)]}.`
      };
    });
  };

  const baseActivities = useMemo(generateBaseActivityData, []);
  
  const timeFilteredActivities = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);
    
    switch (timeRange) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return baseActivities;
    }
  
    return baseActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= cutoffDate;
    });
  }, [baseActivities, timeRange]);

  const filteredActivities = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return timeFilteredActivities;

    const query = debouncedSearchQuery
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return timeFilteredActivities.filter(activity => {
      const normalizeField = (text: string) => text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return (
        normalizeField(activity.satellite).includes(query) ||
        normalizeField(activity.type).includes(query) ||
        normalizeField(activity.status).includes(query)
      );
    });
  }, [timeFilteredActivities, debouncedSearchQuery]);

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
        <div className="relative w-full sm:max-w-xs mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
          <Input 
            placeholder="Search activities..." 
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-9 bg-space-dark border-space-light"
          />
        </div>
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
