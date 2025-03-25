import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, ArrowUpRight } from 'lucide-react';

interface MissionReport {
  id: string;
  title: string;
  date: string;
  type: string;
  author: string;
  summary: string;
}

interface MissionReportsListProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const MissionReportsList: React.FC<MissionReportsListProps> = ({ timeRange }) => {
  // Generate sample mission reports
  const generateReports = (): MissionReport[] => {
    const reportTypes = ['Mission Summary', 'Technical Analysis', 'Incident Report', 'Operational Review'];
    const authors = ['J. Wilson', 'S. Chen', 'K. Patel', 'M. Rodriguez', 'A. Kowalski'];
    
    let count = 6;
    if (timeRange === 'day') count = 2;
    if (timeRange === 'week') count = 4;
    if (timeRange === 'year') count = 10;
    
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      if (timeRange === 'day') {
        date.setHours(date.getHours() - Math.floor(Math.random() * 24));
      } else if (timeRange === 'week') {
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      } else if (timeRange === 'month') {
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      } else {
        date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
      }
      
      const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];
      let title = '';
      
      switch (type) {
        case 'Mission Summary':
          title = `Q${Math.floor(Math.random() * 4) + 1} Orbital Operations Summary`;
          break;
        case 'Technical Analysis':
          title = `Analysis of Propulsion System Performance`;
          break;
        case 'Incident Report':
          title = `Signal Anomaly Investigation Report`;
          break;
        case 'Operational Review':
          title = `Constellation Maintenance Report`;
          break;
      }
      
      return {
        id: `rep-${i}`,
        title,
        date: date.toLocaleDateString(),
        type,
        author: authors[Math.floor(Math.random() * authors.length)],
        summary: `This report covers detailed ${type.toLowerCase()} for the period ending ${date.toLocaleDateString()}. It includes statistics, findings, and recommendations for future operations.`
      };
    });
  };

  const reports = generateReports();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => (
          <div key={report.id} className="glass-panel p-4 hover:bg-space-light/10 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-1 rounded-md text-xs">
                {report.type}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <h3 className="text-white font-medium text-lg mb-2">{report.title}</h3>
            
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{report.summary}</p>
            
            <div className="flex justify-between items-center text-xs text-white/50">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {report.date}
              </div>
              <div>{report.author}</div>
            </div>
            
            <div className="pt-3 mt-3 border-t border-white/10 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-neon-blue hover:text-white flex items-center text-xs p-0"
              >
                View Full Report
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionReportsList;
