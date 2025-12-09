import { useState } from 'react';
import { Search, Database, BarChart3, Calendar, Hash, Type, ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FieldType } from './types';
import { cn } from '@/lib/utils';

const mockSemanticModel = {
  tables: [
    {
      name: 'Sales',
      dimensions: [
        { id: 'sales.region', name: 'Region', type: 'dimension' as const, dataType: 'string' as const, table: 'Sales' },
        { id: 'sales.product', name: 'Product Category', type: 'dimension' as const, dataType: 'string' as const, table: 'Sales' },
        { id: 'sales.date', name: 'Sales Date', type: 'dimension' as const, dataType: 'date' as const, table: 'Sales' },
      ],
      measures: [
        { id: 'sales.revenue', name: 'Revenue', type: 'measure' as const, dataType: 'number' as const, table: 'Sales' },
        { id: 'sales.quantity', name: 'Quantity Sold', type: 'measure' as const, dataType: 'number' as const, table: 'Sales' },
        { id: 'sales.profit', name: 'Profit', type: 'measure' as const, dataType: 'number' as const, table: 'Sales' },
      ],
    },
    {
      name: 'Customers',
      dimensions: [
        { id: 'customers.segment', name: 'Customer Segment', type: 'dimension' as const, dataType: 'string' as const, table: 'Customers' },
        { id: 'customers.location', name: 'Location', type: 'dimension' as const, dataType: 'string' as const, table: 'Customers' },
      ],
      measures: [
        { id: 'customers.count', name: 'Customer Count', type: 'measure' as const, dataType: 'number' as const, table: 'Customers' },
        { id: 'customers.ltv', name: 'Lifetime Value', type: 'measure' as const, dataType: 'number' as const, table: 'Customers' },
      ],
    },
  ],
};

interface SemanticModelSidebarProps {
  selectedFields: FieldType[];
  onFieldSelectionChange: (fields: FieldType[]) => void;
}

export function SemanticModelSidebar({ selectedFields, onFieldSelectionChange }: SemanticModelSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<string[]>(['Sales']);

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const handleDragStart = (event: React.DragEvent, field: FieldType) => {
    console.log('handleDragStart called', field);
    event.dataTransfer.setData('application/json', JSON.stringify(field));
    event.dataTransfer.effectAllowed = 'copy';
    console.log('drag data set:', JSON.stringify(field));
  };

  const toggleFieldSelection = (field: FieldType) => {
    const isSelected = selectedFields.some(f => f.id === field.id);
    if (isSelected) {
      onFieldSelectionChange(selectedFields.filter(f => f.id !== field.id));
    } else {
      onFieldSelectionChange([...selectedFields, field]);
    }
  };

  const clearSelection = () => {
    onFieldSelectionChange([]);
  };

  const isFieldSelected = (field: FieldType) => {
    return selectedFields.some(f => f.id === field.id);
  };

  const getFieldIcon = (field: FieldType) => {
    if (field.type === 'measure') {
      return <Hash className="w-3 h-3 text-primary" />;
    }
    switch (field.dataType) {
      case 'string':
        return <Type className="w-3 h-3 text-secondary" />;
      case 'date':
        return <Calendar className="w-3 h-3 text-accent" />;
      case 'number':
        return <BarChart3 className="w-3 h-3 text-primary" />;
      default:
        return <Type className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const filteredTables = mockSemanticModel.tables.map(table => ({
    ...table,
    dimensions: table.dimensions.filter(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    measures: table.measures.filter(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(table => 
    table.dimensions.length > 0 || table.measures.length > 0 || searchTerm === ''
  );

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-sidebar-primary" />
          <h2 className="font-semibold text-sidebar-foreground">Semantic Model</h2>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border"
          />
        </div>
        
        {/* Selected Fields Summary */}
        {selectedFields.length > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">
                Selected Fields ({selectedFields.length})
              </span>
              <Button 
                onClick={clearSelection}
                variant="ghost" 
                size="sm"
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedFields.map((field) => (
                <Badge 
                  key={field.id} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {field.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tables and Fields */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredTables.map((table) => (
            <div key={table.name} className="space-y-1">
              <button
                onClick={() => toggleTable(table.name)}
                className="flex items-center gap-2 w-full p-2 text-left rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                {expandedTables.includes(table.name) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <Database className="w-4 h-4 text-sidebar-primary" />
                <span className="font-medium text-sidebar-foreground">{table.name}</span>
              </button>

              {expandedTables.includes(table.name) && (
                <div className="ml-6 space-y-1">
                  {/* Dimensions */}
                  {table.dimensions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
                        Dimensions
                      </div>
                      {table.dimensions.map((field) => (
                        <div
                          key={field.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded group cursor-pointer transition-colors",
                            "hover:bg-sidebar-accent",
                            isFieldSelected(field) && "bg-primary/10 border border-primary/30"
                          )}
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, field)}
                            className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
                          >
                            {getFieldIcon(field)}
                            <span className="text-sm text-sidebar-foreground">{field.name}</span>
                          </div>
                          <Button
                            onClick={() => toggleFieldSelection(field)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isFieldSelected(field) ? 
                              <Minus className="w-3 h-3 text-destructive" /> : 
                              <Plus className="w-3 h-3 text-primary" />
                            }
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Measures */}
                  {table.measures.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
                        Measures
                      </div>
                      {table.measures.map((field) => (
                        <div
                          key={field.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded group cursor-pointer transition-colors",
                            "hover:bg-sidebar-accent",
                            isFieldSelected(field) && "bg-primary/10 border border-primary/30"
                          )}
                        >
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, field)}
                            className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing"
                          >
                            {getFieldIcon(field)}
                            <span className="text-sm text-sidebar-foreground">{field.name}</span>
                          </div>
                          <Button
                            onClick={() => toggleFieldSelection(field)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isFieldSelected(field) ? 
                              <Minus className="w-3 h-3 text-destructive" /> : 
                              <Plus className="w-3 h-3 text-primary" />
                            }
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground mb-2">
          💡 <strong>Tip:</strong> Click + to multi-select fields, then drag to canvas
        </div>
        <div className="text-xs text-muted-foreground">
          Double-click canvas to add questions
        </div>
      </div>
    </div>
  );
}