import { useEffect, useRef, useState } from 'react';
import { ListTable } from '@visactor/vtable';
import '../app/styles/vtable.css';

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
  onLoadMore?: () => void;
}

export function VTableWrapper({
  columns,
  data,
  loading,
  error,
  onSort,
  onLoadMore
}: VTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !data.length) return;

    const initTable = () => {
      if (!containerRef.current) return;

      try {
        // Dispose existing table if any
        if (tableRef.current) {
          tableRef.current.dispose();
          tableRef.current = null;
        }

        // Create new table with minimal config
        const table = new ListTable({
          container: containerRef.current,
          records: data,
          columns: columns.map(col => ({
            field: col.field,
            title: col.header || col.title,
            width: col.width || 150,
            sortable: col.sortable,
            ...(col.align && { textAlign: col.align }),
            render: (args: any) => {
              try {
                const value = args.row[col.field];
                const rendered = col.render?.(args.row, args.row);

                // Handle React elements
                if (rendered && typeof rendered === 'object' && 'type' in rendered) {
                  // Link handling
                  if (rendered.type === 'a') {
                    return {
                      type: 'html',
                      html: `<a href="${rendered.props.href}" class="text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer">${rendered.props.children}</a>`
                    };
                  }
                  // Span handling
                  if (rendered.type === 'span') {
                    const className = rendered.props.className || '';
                    return {
                      type: 'html',
                      html: `<span class="${className}">${rendered.props.children}</span>`
                    };
                  }
                  // Default to children content
                  return rendered.props?.children || value || '';
                }

                // Handle plain values
                return rendered ?? value ?? '';
              } catch (err) {
                console.error('Cell render error:', err);
                return '';
              }
            }
          })),
          defaultRowHeight: 48,
          defaultHeaderRowHeight: 48
        });

        if (onLoadMore) {
          table.on('scroll', (args: any) => {
            const { scrollTop, scrollHeight, clientHeight } = args;
            if (scrollHeight - scrollTop <= clientHeight * 1.5) {
              onLoadMore();
            }
          });
        }

        if (onSort) {
          // Use any to bypass type checking for now
          (table as any).on('sortClick', (args: any) => {
            const field = args.field;
            const order = args.order;
            onSort(field, order);
          });
        }

        tableRef.current = table;
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
  }, [columns, data, mounted, onLoadMore, onSort]);

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

  return (
    <div className="vtable-container" style={{ height: '100%' }}>
      <div className="vtable" ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
