import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Mock data for demo purposes
const demoSources = [
  { name: 'PDF Upload', policies: 45, gwp: 180000 },
  { name: 'Manual Entry', policies: 32, gwp: 120000 },
  { name: 'CSV Import', policies: 28, gwp: 95000 }
];

function PageSources() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { userChanged } = useUserChange();
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');

  // Handle user changes - reset data sources when user changes
  useEffect(() => {
    if (userChanged && user) {
      setDataSources([]);
      setDataSource('');
    }
  }, [userChanged, user]);

  useEffect(() => {
    const loadDataSources = async () => {
      try {
        // Use dual storage pattern: S3 → Database → Mock Data
        const response = await DualStorageService.getDataSources();
        
        if (response.success) {
          const newDataSources = Array.isArray(response.data) ? response.data : [];
          setDataSources(newDataSources);
          setDataSource(response.source);
          
        }
      } catch (error) {
        console.error('Failed to load data sources:', error);
        setDataSources(demoSources);
        setDataSource('MOCK_DATA');
      }
    };
    
    loadDataSources();
  }, []);
  
  // Debug logging for chart data
  if (ENABLE_DEBUG) {
  }
  
  return (
      <Card title="Contribution by Data Source">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={`chart-${dataSources.length}-${dataSource}`} data={dataSources.length > 0 ? dataSources : demoSources}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="name"/>
            <YAxis/>
            <Tooltip/>
            <Legend/>
            <Bar dataKey="policies" name="# Policies" fill="#6366f1"/>
            <Bar dataKey="gwp" name="GWP" fill="#10b981"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-sm mt-2">
        {dataSources.length > 0 ? (
          <span className="text-green-600 font-medium">
            ✅ Showing {dataSources.length} real data sources from {dataSource}
          </span>
        ) : dataSource === 'BACKEND_API' ? (
          <span className="text-red-500">
            ❌ No data sources found in backend
          </span>
        ) : (
          <span className="text-blue-500">
            📊 Showing demo data (fallback)
          </span>
        )}
      </div>
    </Card>
  )
}

export default PageSources;
