import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: { value: string; label: string }[];
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pageSize?: number;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showSelection?: boolean;
  showActions?: boolean;
  customActions?: (row: T) => React.ReactNode;
  globalSearch?: boolean;
  hideFilters?: boolean;
  className?: string;
}

function getValue<T>(obj: T, path: string): any {
  return path.split('.').reduce((current: any, key: string) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  pageSize = 10,
  onEdit,
  onDelete,
  onSelectionChange,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum dado encontrado.",
  showSelection = false,
  showActions = true,
  customActions,
  globalSearch = true,
  hideFilters = false,
  className,
}: DataTableProps<T>) {
  // Estados para controle da tabela
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  // Função para obter valor de uma propriedade aninhada
  const getNestedValue = (obj: T, path: string) => {
    return getValue(obj, path);
  };

  // Dados filtrados e ordenados
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Filtro global
    if (globalSearchTerm && globalSearch) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = getNestedValue(row, column.key as string);
          return value?.toString().toLowerCase().includes(globalSearchTerm.toLowerCase());
        })
      );
    }

    // Filtros por coluna
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'todos') {
        filtered = filtered.filter(row => {
          const cellValue = getNestedValue(row, key);
          const stringValue = cellValue?.toString().toLowerCase() || '';
          return stringValue.includes(value.toLowerCase());
        });
      }
    });

    // Ordenação
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, filters, globalSearchTerm, sortConfig, columns, globalSearch]);

  // Paginação
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  // Controle de ordenação
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null; // Remove ordenação
        }
      }
      return { key, direction: 'asc' };
    });
  };

  // Controle de seleção
  const handleRowSelect = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);

    if (onSelectionChange) {
      const selectedData = data.filter(row => newSelected.has(row.id));
      onSelectionChange(selectedData);
    }
  };

  // Seleção de todas as linhas
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allIds);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  // Controle de filtros
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset para primeira página
  };

  // Reset filtros
  const handleClearFilters = () => {
    setFilters({});
    setGlobalSearchTerm("");
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Renderizar célula
  const renderCell = (column: Column<T>, row: T, index: number) => {
    if (column.render) {
      return column.render(getNestedValue(row, column.key as string), row, index);
    }

    const value = getNestedValue(row, column.key as string);

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    return value.toString();
  };

  // Navegação de páginas
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const isAllSelected = paginatedData.length > 0 &&
    paginatedData.every(row => selectedRows.has(row.id));
  const isIndeterminate = paginatedData.some(row => selectedRows.has(row.id)) &&
    !isAllSelected;

  if (loading) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showSelection && <TableHead className="w-12" />}
                {columns.map((column, index) => (
                  <TableHead key={index}>{column.title}</TableHead>
                ))}
                {showActions && <TableHead className="w-24">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {showSelection && (
                    <TableCell>
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    </TableCell>
                  )}
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className || ''}`}>
      {/* Barra de busca e ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {globalSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalSearchTerm}
                onChange={(e) => {
                  setGlobalSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          )}

          {!hideFilters && Object.keys(filters).length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <Filter className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>

        {selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} item(ns) selecionado(s)
          </div>
        )}
      </div>

      {/* Filtros por coluna */}
      {!hideFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {columns
            .filter(column => column.filterable)
            .map((column, index) => (
              <div key={index}>
                <label className="text-sm font-medium mb-1 block">
                  {column.title}
                </label>
                {column.filterType === 'select' && column.filterOptions ? (
                  <Select
                    value={filters[column.key as string] || ''}
                    onValueChange={(value) =>
                      handleFilterChange(column.key as string, value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {column.filterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={`Filtrar ${column.title.toLowerCase()}`}
                    value={filters[column.key as string] || ''}
                    onChange={(e) =>
                      handleFilterChange(column.key as string, e.target.value)
                    }
                    className="h-8"
                  />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showSelection && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    indeterminate={isIndeterminate}
                  />
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={column.className}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1">
                    {column.title}
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleSort(column.key as string)}
                      >
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          )
                        ) : (
                          <SortAsc className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="w-24 text-center">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showSelection ? 1 : 0) + (showActions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={selectedRows.has(row.id) ? 'bg-muted/50' : ''}
                >
                  {showSelection && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) =>
                          handleRowSelect(row.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {renderCell(column, row, startIndex + index)}
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(row)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                          {customActions && customActions(row)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, processedData.length)} de {processedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}