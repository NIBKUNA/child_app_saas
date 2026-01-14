
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ExcelExportButtonProps {
    data: any[];
    fileName: string;
    headers?: string[]; // Optional custom headers keys
    headerLabels?: Record<string, string>; // Map key to display name
    className?: string;
}

export function ExcelExportButton({ data, fileName, headers, headerLabels, className }: ExcelExportButtonProps) {
    const { canExportData } = useTheme();
    const [exporting, setExporting] = useState(false);

    if (!canExportData) return null;

    const handleExport = async () => {
        if (!data || data.length === 0) {
            alert("내보낼 데이터가 없습니다.");
            return;
        }
        setExporting(true);

        try {
            // Process data to match headers/labels if provided
            let exportData = data;

            if (headers || headerLabels) {
                exportData = data.map(row => {
                    const newRow: any = {};
                    const keys = headers || Object.keys(row);

                    keys.forEach(key => {
                        const label = headerLabels?.[key] || key;
                        // Handle nested objects text representation if needed, simple string conversion for now
                        let val = row[key];
                        if (typeof val === 'object' && val !== null) {
                            val = JSON.stringify(val);
                        }
                        newRow[label] = val;
                    });
                    return newRow;
                });
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-width columns roughly
            const wscols = Object.keys(exportData[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 15) }));
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (error) {
            console.error(error);
            alert('엑셀 내보내기 실패');
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={exporting}
            className={cn(
                "flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50",
                className
            )}
        >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting ? '추출 중...' : '엑셀로 내보내기'}
        </button>
    );
}
