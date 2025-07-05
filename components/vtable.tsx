import { useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { ListTable } from '@visactor/vtable';
import * as VTable from '@visactor/vtable';
import '../app/styles/vtable.css';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

type Theme = 'paper' | 'high-contrast' | 'dos-blue' | 'cyberpunk' | 'solarized';

// Register VTable themes using the proper VTable.register.theme method
function registerVTableThemes() {
  // Paper Theme
  VTable.register.theme('opensvm-paper', {
    defaultStyle: {
      borderLineWidth: 1
    },
    headerStyle: {
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      fontWeight: 600,
      color: '#1f2937',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    rowHeaderStyle: {
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      borderLineWidth: 1,
      fontWeight: 'normal',
      color: '#1f2937'
    },
    cornerHeaderStyle: {
      bgColor: '#f9fafb',
      fontWeight: 600,
      color: '#1f2937'
    },
    bodyStyle: {
      borderColor: '#e5e7eb',
      borderLineWidth: 1,
      color: '#1f2937',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bgColor: (args: any) => {
        if (args.row % 2 === 1) {
          return '#f9fafb';
        }
        return '#ffffff';
      }
    }
  });

  // High Contrast Theme
  VTable.register.theme('opensvm-high-contrast', {
    defaultStyle: {
      borderLineWidth: 1
    },
    headerStyle: {
      bgColor: '#0a0a0a',
      borderColor: '#262626',
      fontWeight: 600,
      color: '#fafafa',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    rowHeaderStyle: {
      bgColor: '#0a0a0a',
      borderColor: '#262626',
      borderLineWidth: 1,
      fontWeight: 'normal',
      color: '#fafafa'
    },
    cornerHeaderStyle: {
      bgColor: '#0a0a0a',
      fontWeight: 600,
      color: '#fafafa'
    },
    bodyStyle: {
      borderColor: '#262626',
      borderLineWidth: 1,
      color: '#fafafa',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bgColor: (args: any) => {
        if (args.row % 2 === 1) {
          return '#171717';
        }
        return '#0a0a0a';
      }
    }
  });

  // DOS Blue Theme
  VTable.register.theme('opensvm-dos-blue', {
    defaultStyle: {
      borderLineWidth: 1
    },
    headerStyle: {
      bgColor: '#000066',
      borderColor: '#0000cc',
      fontWeight: 600,
      color: '#ffffe6',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    rowHeaderStyle: {
      bgColor: '#000066',
      borderColor: '#0000cc',
      borderLineWidth: 1,
      fontWeight: 'normal',
      color: '#ffffe6'
    },
    cornerHeaderStyle: {
      bgColor: '#000066',
      fontWeight: 600,
      color: '#ffffe6'
    },
    bodyStyle: {
      borderColor: '#0000cc',
      borderLineWidth: 1,
      color: '#ffffe6',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bgColor: (args: any) => {
        if (args.row % 2 === 1) {
          return '#000099';
        }
        return '#000066';
      }
    }
  });

  // Cyberpunk Theme
  VTable.register.theme('opensvm-cyberpunk', {
    defaultStyle: {
      borderLineWidth: 1
    },
    headerStyle: {
      bgColor: '#330033',
      borderColor: '#660066',
      fontWeight: 600,
      color: '#ff66ff',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    rowHeaderStyle: {
      bgColor: '#330033',
      borderColor: '#660066',
      borderLineWidth: 1,
      fontWeight: 'normal',
      color: '#ff66ff'
    },
    cornerHeaderStyle: {
      bgColor: '#330033',
      fontWeight: 600,
      color: '#ff66ff'
    },
    bodyStyle: {
      borderColor: '#660066',
      borderLineWidth: 1,
      color: '#ff66ff',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bgColor: (args: any) => {
        if (args.row % 2 === 1) {
          return '#4d0040';
        }
        return '#330033';
      }
    }
  });

  // Solarized Theme
  VTable.register.theme('opensvm-solarized', {
    defaultStyle: {
      borderLineWidth: 1
    },
    headerStyle: {
      bgColor: '#002b36',
      borderColor: '#073642',
      fontWeight: 600,
      color: '#839496',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    rowHeaderStyle: {
      bgColor: '#002b36',
      borderColor: '#073642',
      borderLineWidth: 1,
      fontWeight: 'normal',
      color: '#839496'
    },
    cornerHeaderStyle: {
      bgColor: '#002b36',
      fontWeight: 600,
      color: '#839496'
    },
    bodyStyle: {
      borderColor: '#073642',
      borderLineWidth: 1,
      color: '#839496',
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      bgColor: (args: any) => {
        if (args.row % 2 === 1) {
          return '#073642';
        }
        return '#002b36';
      }
    }
  });
}

// Get the registered theme name for a given OpenSVM theme
function getVTableThemeName(theme: Theme): string {
  return `opensvm-${theme}`;
}

interface Column {
  field: string;
  title: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => React.ReactNode;
  sortable?: boolean;
  onSort?: () => void;
  key?: string;
  header?: string;
}

interface VTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  error?: string;
  onSort?: (field: string, order: 'asc' | 'desc' | null) => void;
  selectedRowId?: string | null;
  onRowSelect?: (rowId: string) => void;
  renderRowAction?: (rowId: string) => ReactNode;
  rowKey?: (record: any) => string;
  pinnedRowIds?: Set<string>;
  onLoadMore?: () => void;
}

export function VTableWrapper({
  columns,
  data,
  loading,
  error,
  selectedRowId = null,
  onRowSelect,
  renderRowAction,
  rowKey = row => row.id,
  onSort,
  pinnedRowIds = new Set(),
  onLoadMore
}: VTableProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [themesRegistered, setThemesRegistered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  // Client-side navigation handler
  const handleNavigation = useCallback((href: string) => {
    if (href && typeof href === 'string') {
      router.push(href, { scroll: false });
    }
  }, [router]);

  // Handle row click for selection
  const handleRowClick = useCallback((rowData: any, e: any) => {
    if (onRowSelect && rowData) {
      const id = rowKey(rowData);
      onRowSelect(id);
    }
  }, [onRowSelect, rowKey]);

  // Register themes once on mount
  useEffect(() => {
    if (!themesRegistered) {
      registerVTableThemes();
      setThemesRegistered(true);
    }
    setMounted(true);
    return () => setMounted(false);
  }, [themesRegistered]);

  useEffect(() => {
    if (!mounted || !themesRegistered || !containerRef.current || !data.length) { return; }

    const initTable = () => {
      if (!containerRef.current) { return; }

      try {
        // Dispose existing table if any
        if (tableRef.current) {
          tableRef.current.dispose();
          tableRef.current = null;
        }

        // Clear the container to ensure fresh start
        containerRef.current.innerHTML = '';
        
        // Wait for the next frame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (!containerRef.current) { return; }
          
          // Process data to add selection state
          const processedData = data.map(row => {
            const rowId = rowKey(row);
            const isSelected = selectedRowId === rowId;
            const isPinned = pinnedRowIds.has(rowId);
            
            return {
              ...row,
              __vtableRowId: rowId,
              __isSelected: isSelected,
              __isPinned: isPinned
            };
          });

          // Get the registered theme name for current theme
          const vtableThemeName = getVTableThemeName(theme);
          
          // Create table configuration with registered theme
          const tableConfig = {
            container: containerRef.current,
            records: processedData,
            theme: vtableThemeName, // Use the registered theme name
            defaultRowHeight: 48,
            defaultHeaderRowHeight: 48,
            overscrollBehavior: 'none',
            columns: columns.map(col => ({
            field: col.field,
            title: col.header || col.title,
            width: col.width || 150,
            sortable: !!col.sortable, // Ensure boolean to fix TypeScript error
            ...(col.align && { textAlign: col.align }),
            render: (args: any) => {
              try {
                // Ensure the value is properly extracted from the row data
                const cellValue = args.row[col.field];
                
              // Skip for internal fields used for selection/state
                if (col.field.startsWith('__')) {
                  return '';
                }

                // Add row styling based on selection/pinned status
                if (col.field === columns[0].field) {
                  const isSelected = args.row.__isSelected;
                  const isPinned = args.row.__isPinned;
                  let bgClass = '';
                  
                  if (isPinned) {
                    bgClass = 'bg-yellow-50 dark:bg-yellow-900/20';
                  } else if (isSelected) {
                    bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                  }
                  
                  if (bgClass) {
                    return {
                      html: `<div class="${bgClass}" style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;"></div>${
                        col.render ? '' : (cellValue ?? '')
                      }`,
                    };
                  }
                }

                // Extract value with proper fallback to ensure something is always displayed
                const rendered = col.render?.(cellValue ?? null, args.row) ?? cellValue;

                // Handle React elements
                if (rendered && typeof rendered === 'object' && 'type' in rendered) {
                  // Handle Next.js Link components
                  if (rendered.type?.displayName === 'Link' || rendered.type === 'a') {
                    const { href, children: content } = rendered.props;
                    
                    // Extract the text to display in the cell
                    const text = typeof content === 'string' ? content : 
                      (content && typeof content === 'object' && 'props' in content) ? content.props.children : cellValue ?? '';
                    
                    return {
                      html: `<a href="javascript:void(0)" data-href="${href || '#'}" class="text-blue-500 hover:text-blue-600 hover:underline">${text}</a>`,
                      action: () => handleNavigation(href)
                    };
                  }

                  // Handle divs with content (commonly used for cell formatting)
                  if (rendered.type === 'div') {
                    const className = rendered.props.className || '';
                    let divContent = rendered.props.children;
                    
                    // Handle different types of children content
                    let textContent = '';
                    
                    if (typeof divContent === 'string') {
                      textContent = divContent;
                    } else if (Array.isArray(divContent)) {
                      // Join array content with spaces
                      textContent = divContent.map(item => 
                        typeof item === 'string' ? item : 
                        (item && typeof item === 'object' && 'props' in item) ? item.props.children || '' : ''
                      ).join(' ');
                    } else if (divContent && typeof divContent === 'object') {
                      // Extract from React element if possible
                      textContent = 'props' in divContent ? (divContent.props?.children || '') : 
                        (JSON.stringify(divContent) !== '{}' ? JSON.stringify(divContent) : '');
                    } else {
                      // Fallback to cell value
                      textContent = cellValue ?? '';
                    }
                    
                    return {
                      html: `<div class="${className}">${textContent}</div>`
                    };
                  }

                  // Handle span elements
                  if (rendered.type === 'span') {
                    const className = rendered.props.className || '';
                    return {
                      html: `<span class="${className}">${rendered.props.children}</span>`
                    };
                  }
                  
                  // Default to children content
                  return rendered.props?.children ?? cellValue ?? '';
                }

                // Handle plain values
                return rendered ?? (cellValue ?? '');
              } catch (err) {
                console.error('Cell render error:', err);
                return '';
              }
            }
          })),
        };

          // Create the table with the configuration
          const table = new ListTable(tableConfig);

          // Log theme application for debugging
          console.log('Applied VTable theme:', vtableThemeName, 'for OpenSVM theme:', theme);

          if (onLoadMore) {
            (table as any).on('scroll', (args: any) => {
              const { scrollTop, scrollHeight, clientHeight } = args;
              if (scrollHeight - scrollTop <= clientHeight * 1.5) {
                onLoadMore();
              }
            });
          }
          
          // Add click handler for cell interactions
          (table as any).on('click_cell', (args: any) => {
            // First check if we have a cell action (link click)
            const cellValue = args.value ?? {};
            const cellAction = cellValue.action || args.cellActionOption?.action;
            
            if (typeof cellAction === 'function') {
              cellAction();
              return; // Don't trigger row selection if we clicked a link
            }
            
            // If no cell action, handle row selection
            if (onRowSelect) {
              const rowData = args.cellKey?.rowKey ? 
                processedData.find(r => r.__vtableRowId === args.cellKey.rowKey) : 
                null;
              
              if (rowData) {
                handleRowClick(rowData, args);
              }
            }
          });

          if (onSort) {
            // Use any to bypass type checking for now
            (table as any).on('sortClick', (args: any) => {
              const { field, order } = args;
              onSort(field, order);
            });
          }

          tableRef.current = table;
        });
      } catch (err) {
        console.error('Failed to initialize table:', err);
      }
    };

    // Initialize table with delay to ensure container is ready
    const timer = setTimeout(initTable, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (tableRef.current) {
        try {
          tableRef.current.dispose();
          tableRef.current = null;
        } catch (err) {
          console.error('Failed to dispose table:', err);
        }
      }
    };
  }, [columns, data, mounted, themesRegistered, onLoadMore, onSort, handleNavigation, selectedRowId, pinnedRowIds, rowKey, onRowSelect, handleRowClick, theme]);

  if (error) {
    return (
      <div className="vtable-error">
        {error}
      </div>
    );
  }

  if (loading && !data.length) {
    return (
      <div className="vtable-loading">
        <div className="vtable-loading-spinner" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="vtable-empty">
        No data available
      </div>
    );
  }
  
  // Render the floating pin button for selected row
  const renderFloatingButton = () => {
    if (!selectedRowId || !renderRowAction) {
      return null;
    }
    
    return (
      <div className="vtable-floating-action">
        {renderRowAction(selectedRowId)}
      </div>
    );
  };

  return (
    <div className={`vtable-container relative theme-${theme}`} style={{ height: '100%' }} key={`vtable-${theme}`}>
      <div 
        className="vtable" 
        ref={containerRef} 
        style={{ width: '100%', height: '100%' }}
        data-selected-row={selectedRowId || ''}
        data-theme={theme}
      />
      
      {renderFloatingButton()}
    </div>
  );
}
