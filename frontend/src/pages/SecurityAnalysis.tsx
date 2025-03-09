
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';

// Import components
import TitleCard from '@/components/SecurityAnalysis/TitleCard';
import FindingsAnalysis from '@/components/SecurityAnalysis/FindingsAnalysis';
import SummaryCards from '@/components/SecurityAnalysis/SummaryCards';
import TrendView from '@/components/SecurityAnalysis/TrendView';

// Import data and utilities
import { MOCK_FINDINGS } from '@/components/SecurityAnalysis/data';
import { getSummaryStats } from '@/components/SecurityAnalysis/utils';
import { SecurityFinding } from '@/components/SecurityAnalysis/types';

const SecurityAnalysis = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFindings, setExpandedFindings] = useState<string[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<SecurityFinding[]>(MOCK_FINDINGS);
  const [statusFilter, setStatusFilter] = useState<SecurityFinding['status'] | 'All'>('All');
  const [criticalityFilter, setCriticalityFilter] = useState<SecurityFinding['criticality'] | 'All'>('All');
  const [showTrends, setShowTrends] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  useEffect(() => {
    toast({
      title: "Security Analysis",
      description: "Imported project file has been loaded for analysis.",
      className: "bg-gradient-to-r from-blue-200/40 to-purple-100/30 border-blue-300/30"
    });

    // Filter findings based on search term and filters
    const filtered = MOCK_FINDINGS.filter(finding => {
      const matchesSearch = searchTerm === '' || 
        finding.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || finding.status === statusFilter;
      const matchesCriticality = criticalityFilter === 'All' || finding.criticality === criticalityFilter;
      
      return matchesSearch && matchesStatus && matchesCriticality;
    });
    
    setFilteredFindings(filtered);
  }, [toast, searchTerm, statusFilter, criticalityFilter]);

  const toggleExpand = (id: string) => {
    setExpandedFindings(prev => 
      prev.includes(id) 
        ? prev.filter(findingId => findingId !== id)
        : [...prev, id]
    );
  };

  const stats = getSummaryStats(MOCK_FINDINGS);

  const toggleTrendView = () => {
    setShowTrends(prev => !prev);
  };

  // Style to fix the :before pseudoelement issue
  const pageStyle = {
    "--card-border-top": "4px solid #7C65F6"
  } as React.CSSProperties;

  return (
    <Layout>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/60 pointer-events-none -z-10" />
      <motion.div 
        className="space-y-6 pb-8 mt-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={pageStyle}
      >
        <TitleCard stats={stats} onViewTrends={toggleTrendView} showingTrends={showTrends} />
        
        {showTrends ? (
          <TrendView findings={MOCK_FINDINGS} stats={stats} />
        ) : (
          <>
            <FindingsAnalysis 
              findings={MOCK_FINDINGS}
              filteredFindings={filteredFindings}
              expandedFindings={expandedFindings}
              toggleExpand={toggleExpand}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              criticalityFilter={criticalityFilter}
              setCriticalityFilter={setCriticalityFilter}
              stats={stats}
            />
            
            <SummaryCards stats={stats} />
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default SecurityAnalysis;