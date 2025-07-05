import { useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { ListTable } from '@visactor/vtable';
import * as VTable from '@visactor/vtable';
import '../app/styles/vtable.css';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

type Theme = 'paper' | 'high-contrast' | 'dos-blue' | 'cyberpunk' | 'solarized';

// Create VTable theme configurations for each OpenSVM theme using direct theme objects
function createVTableTheme(theme: Theme) {
  const baseThemes = {
    paper: {
      name: `OpenSVM-${theme}`,
      underlayBackgroundColor: '#ffffff',
      defaultStyle: {
        color: '#1f2937',
        bgColor: '#ffffff',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#e5e7eb',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#f3f4f6',
        }
      },
      headerStyle: {
        color: '#1f2937',
        bgColor: '#f9fafb',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        borderColor: '#e5e7eb',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#f3f4f6',
        }
      },
      bodyStyle: {
        color: '#1f2937',
        bgColor: '#ffffff',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#e5e7eb',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#f3f4f6',
        }
      },
      frameStyle: {
        borderColor: '#e5e7eb',
        borderLineWidth: 1,
        borderLineDash: [],
        cornerRadius: 6,
      },
      selectionStyle: {
        cellBorderColor: '#3b82f6',
        cellBorderLineWidth: 2,
        cellBgColor: 'rgba(59, 130, 246, 0.1)',
      },
    },
    'high-contrast': {
      name: `OpenSVM-${theme}`,
      underlayBackgroundColor: '#0a0a0a',
      defaultStyle: {
        color: '#fafafa',
        bgColor: '#0a0a0a',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#262626',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#171717',
        }
      },
      headerStyle: {
        color: '#fafafa',
        bgColor: '#0a0a0a',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        borderColor: '#262626',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#171717',
        }
      },
      bodyStyle: {
        color: '#fafafa',
        bgColor: '#0a0a0a',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#262626',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#171717',
        }
      },
      frameStyle: {
        borderColor: '#262626',
        borderLineWidth: 1,
        borderLineDash: [],
        cornerRadius: 6,
      },
      selectionStyle: {
        cellBorderColor: '#fafafa',
        cellBorderLineWidth: 2,
        cellBgColor: 'rgba(250, 250, 250, 0.1)',
      },
    },
    'dos-blue': {
      name: `OpenSVM-${theme}`,
      underlayBackgroundColor: '#000066',
      defaultStyle: {
        color: '#ffffe6',
        bgColor: '#000066',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#0000cc',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#000099',
        }
      },
      headerStyle: {
        color: '#ffffe6',
        bgColor: '#000066',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        borderColor: '#0000cc',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#000099',
        }
      },
      bodyStyle: {
        color: '#ffffe6',
        bgColor: '#000066',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#0000cc',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#000099',
        }
      },
      frameStyle: {
        borderColor: '#0000cc',
        borderLineWidth: 1,
        borderLineDash: [],
        cornerRadius: 6,
      },
      selectionStyle: {
        cellBorderColor: '#ffff66',
        cellBorderLineWidth: 2,
        cellBgColor: 'rgba(255, 255, 102, 0.1)',
      },
    },
    cyberpunk: {
      name: `OpenSVM-${theme}`,
      underlayBackgroundColor: '#330033',
      defaultStyle: {
        color: '#ff66ff',
        bgColor: '#330033',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#660066',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#4d0040',
        }
      },
      headerStyle: {
        color: '#ff66ff',
        bgColor: '#330033',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        borderColor: '#660066',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#4d0040',
        }
      },
      bodyStyle: {
        color: '#ff66ff',
        bgColor: '#330033',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#660066',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#4d0040',
        }
      },
      frameStyle: {
        borderColor: '#660066',
        borderLineWidth: 1,
        borderLineDash: [],
        cornerRadius: 6,
      },
      selectionStyle: {
        cellBorderColor: '#00ffff',
        cellBorderLineWidth: 2,
        cellBgColor: 'rgba(0, 255, 255, 0.1)',
      },
    },
    solarized: {
      name: `OpenSVM-${theme}`,
      underlayBackgroundColor: '#002b36',
      defaultStyle: {
        color: '#839496',
        bgColor: '#002b36',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#073642',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#073642',
        }
      },
      headerStyle: {
        color: '#839496',
        bgColor: '#002b36',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 600,
        borderColor: '#073642',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#073642',
        }
      },
      bodyStyle: {
        color: '#839496',
        bgColor: '#002b36',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        borderColor: '#073642',
        padding: [8, 12, 8, 12],
        hover: {
          cellBgColor: '#073642',
        }
      },
      frameStyle: {
        borderColor: '#073642',
        borderLineWidth: 1,
        borderLineDash: [],
        cornerRadius: 6,
      },
      selectionStyle: {
        cellBorderColor: '#586e75',
        cellBorderLineWidth: 2,
        cellBgColor: 'rgba(88, 110, 117, 0.1)',
      },
    },
  };

  return baseThemes[theme];
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !data.length) { return; }

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

          // Create new table with theme applied
          const vtableTheme = createVTableTheme(theme);
          
          // Add explicit theme configuration to ensure it's applied
          const tableConfig = {
            container: containerRef.current,
            records: processedData,
            theme: vtableTheme, // Use the direct theme object
            // Force theme application by setting explicit style options
            defaultRowHeight: 48,
            defaultHeaderRowHeight: 48,
            // Override any default theme
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
          console.log('Applied VTable theme:', theme, vtableTheme);

          // Additional theme enforcement - try to set theme after creation
          try {
            if (table.updateTheme) {
              table.updateTheme(vtableTheme);
            }
          } catch (themeError) {
            console.warn('Unable to apply theme after table creation:', themeError);
          }

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
  }, [columns, data, mounted, onLoadMore, onSort, handleNavigation, selectedRowId, pinnedRowIds, rowKey, onRowSelect, handleRowClick, theme]);

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
