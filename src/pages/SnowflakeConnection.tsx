import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Database, Table, CheckCircle } from 'lucide-react';

const SnowflakeConnection = () => {
  const navigate = useNavigate();
  const [selectedTables, setSelectedTables] = useState<string[]>(['Sales', 'Customers']);

  const availableTables = [
    { name: 'Sales', description: 'Transaction records and revenue data', rows: '2.4M' },
    { name: 'Customers', description: 'Customer profiles and demographics', rows: '150K' },
    { name: 'Products', description: 'Product catalog and specifications', rows: '25K' },
    { name: 'Inventory', description: 'Stock levels and warehouse data', rows: '500K' },
  ];

  const handleTableSelection = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleExplore = () => {
    navigate('/analytics');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Database className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Connect to Snowflake</h1>
            </div>
            <p className="text-muted-foreground">
              Select the tables you want to explore in your analytics canvas
            </p>
          </div>

          {/* Connection Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Connected to Analytics Warehouse
              </CardTitle>
              <CardDescription>
                Connection established • Database: ANALYTICS_DB • Schema: PUBLIC
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Table Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Available Tables
              </CardTitle>
              <CardDescription>
                Choose the tables you want to include in your analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableTables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleTableSelection(table.name)}
                >
                  <Checkbox
                    checked={selectedTables.includes(table.name)}
                    onChange={() => handleTableSelection(table.name)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{table.name}</h3>
                      <span className="text-sm text-muted-foreground">{table.rows} rows</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{table.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Summary and Explore Button */}
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected: {selectedTables.join(', ')}
              </p>
            </div>
            <Button 
              onClick={handleExplore}
              disabled={selectedTables.length === 0}
              size="lg"
              className="px-8"
            >
              Explore Analytics Canvas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnowflakeConnection;