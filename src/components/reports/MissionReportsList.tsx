import React, { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, ArrowUpRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [selectedReport, setSelectedReport] = useState<MissionReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { toPDF, targetRef } = usePDF({ 
    filename: selectedReport?.title + '.pdf',
    page: {
      margin: 10
    }
  });

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

  const handleViewFullReport = (report: MissionReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const generatePDF = async () => {
    return new Promise<void>((resolve) => {
      toPDF();
      setTimeout(resolve, 1000);
    });
  };
  
  const handleDownloadPDF = async () => {
    await generatePDF();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(report => (
          <div key={report.id} className="glass-panel p-4 hover:bg-space-light/10 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-1 rounded-md text-xs">
                {report.type}
              </div>
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
                className="text-neon-blue hover:text-white flex items-center text-xs p-2"
                onClick={() => handleViewFullReport(report)}
              >
                View Full Report
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Report Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-space-dark border-space-light/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{selectedReport?.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div ref={targetRef} className='bg-space-dark'>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center text-white/70">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Date: {selectedReport.date}</span>
                  </div>
                  <div className="flex items-center text-white/70">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Type: {selectedReport.type}</span>
                  </div>
                  <div className="text-white/70">
                    Author: {selectedReport.author}
                  </div>
                </div>
              
                <div className="bg-space-light/10 p-4 rounded-md">
                  <h4 className="text-neon-blue font-medium mb-2">Report Summary</h4>
                  <p className="text-white/90">{selectedReport.summary}</p>
                </div>
              
                <div className="bg-space-light/10 p-4 rounded-md">
                  <h4 className="text-neon-blue font-medium mb-2">Full Content</h4>
                  <div className="space-y-3 text-white/90">
                    <p>This is a detailed expansion of the {selectedReport.type.toLowerCase()} report. In a real application, this would contain the complete content of the report.</p>
                    <p>For mission summaries, this might include detailed operational statistics, crew performance metrics, and system status reports.</p>
                    <p>Technical analyses would contain detailed data visualizations, system performance metrics, and engineering evaluations.</p>
                    <p>Incident reports would include timelines, root cause analysis, and corrective action plans.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="border-neon-blue text-neon-blue hover:text-neon-blue/90"
                  onClick={handleDownloadPDF}
                  >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MissionReportsList;