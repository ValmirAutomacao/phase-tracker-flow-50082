import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'dateRange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValue {
  key: string;
  value: any;
  label?: string;
}

export interface TableFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  showActiveFilters?: boolean;
  className?: string;
}

export function TableFilters({
  filters,
  values,
  onChange,
  onClear,
  showActiveFilters = true,
  className,
}: TableFiltersProps) {
  // Filtros ativos
  const activeFilters = Object.entries(values).filter(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === 'todos') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && !value.from && !value.to) return false;
    return true;
  });

  const clearFilter = (key: string) => {
    onChange(key, '');
  };

  const getActiveFilterLabel = (key: string, value: any) => {
    const filter = filters.find(f => f.key === key);
    if (!filter) return `${key}: ${value}`;

    switch (filter.type) {
      case 'select': {
        const option = filter.options?.find(opt => opt.value === value);
        return `${filter.label}: ${option?.label || value}`;
      }

      case 'date':
        if (value instanceof Date) {
          return `${filter.label}: ${format(value, 'dd/MM/yyyy', { locale: ptBR })}`;
        }
        return `${filter.label}: ${value}`;

      case 'dateRange': {
        if (value.from && value.to) {
          return `${filter.label}: ${format(value.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`;
        } else if (value.from) {
          return `${filter.label}: A partir de ${format(value.from, 'dd/MM/yyyy', { locale: ptBR })}`;
        } else if (value.to) {
          return `${filter.label}: Até ${format(value.to, 'dd/MM/yyyy', { locale: ptBR })}`;
        }
        return `${filter.label}: ${value}`;
      }

      default:
        return `${filter.label}: ${value}`;
    }
  };

  const renderFilter = (filter: FilterConfig) => {
    const currentValue = values[filter.key];

    switch (filter.type) {
      case 'text':
      case 'number':
        return (
          <Input
            key={filter.key}
            type={filter.type}
            placeholder={filter.placeholder || `Filtrar por ${filter.label.toLowerCase()}`}
            value={currentValue || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="h-9"
          />
        );

      case 'select':
        return (
          <Select
            key={filter.key}
            value={currentValue || ''}
            onValueChange={(value) => onChange(filter.key, value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={filter.placeholder || `Todos ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Popover key={filter.key}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {currentValue ? (
                  format(currentValue, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">
                    {filter.placeholder || `Selecionar ${filter.label.toLowerCase()}`}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <DatePicker
                selected={currentValue}
                onSelect={(date) => onChange(filter.key, date)}
                mode="single"
              />
            </PopoverContent>
          </Popover>
        );

      case 'dateRange':
        return (
          <Popover key={filter.key}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {currentValue?.from ? (
                  currentValue.to ? (
                    <>
                      {format(currentValue.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                      {format(currentValue.to, 'dd/MM/yy', { locale: ptBR })}
                    </>
                  ) : (
                    format(currentValue.from, 'dd/MM/yyyy', { locale: ptBR })
                  )
                ) : (
                  <span className="text-muted-foreground">
                    {filter.placeholder || `Período de ${filter.label.toLowerCase()}`}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePicker
                selected={currentValue}
                onSelect={(range) => onChange(filter.key, range)}
                mode="range"
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Grid de filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((filter, index) => (
          <div key={filter.key}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {filter.label}
            </label>
            {renderFilter(filter)}
          </div>
        ))}

        {/* Botão de limpar filtros */}
        {activeFilters.length > 0 && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-9"
            >
              <Filter className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Filtros ativos */}
      {showActiveFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 flex items-center">
            Filtros ativos:
          </span>
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {getActiveFilterLabel(key, value)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 px-2 text-xs"
            >
              Limpar todos
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Hook personalizado para gerenciar filtros
export function useTableFilters(initialFilters: Record<string, any> = {}) {
  const [filters, setFilters] = React.useState(initialFilters);

  const updateFilter = React.useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = React.useCallback(() => {
    setFilters({});
  }, []);

  const clearFilter = React.useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
    setFilters
  };
}

// Função utilitária para aplicar filtros aos dados
export function applyTableFilters<T>(
  data: T[],
  filters: Record<string, any>,
  filterConfigs: FilterConfig[]
): T[] {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'todos') return true;

      const config = filterConfigs.find(c => c.key === key);
      if (!config) return true;

      const itemValue = getNestedValue(item, key);

      switch (config.type) {
        case 'text':
          return itemValue?.toString().toLowerCase().includes(value.toLowerCase());

        case 'number':
          return itemValue === Number(value);

        case 'select':
          return itemValue === value;

        case 'date': {
          if (!itemValue || !value) return true;
          const itemDate = new Date(itemValue);
          const filterDate = new Date(value);
          return itemDate.toDateString() === filterDate.toDateString();
        }

        case 'dateRange': {
          if (!itemValue) return true;
          const itemDateRange = new Date(itemValue);

          if (value.from && value.to) {
            return itemDateRange >= value.from && itemDateRange <= value.to;
          } else if (value.from) {
            return itemDateRange >= value.from;
          } else if (value.to) {
            return itemDateRange <= value.to;
          }
          return true;
        }

        default:
          return true;
      }
    });
  });
}

// Função utilitária para obter valor aninhado
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current: any, key: string) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}