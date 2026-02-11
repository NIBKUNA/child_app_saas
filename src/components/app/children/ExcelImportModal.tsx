import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { Upload, FileSpreadsheet, Check, AlertTriangle, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

/**
 * 🏫 케어플(Careple) 엑셀 → 자라다 ERP 아동 일괄 등록
 * 
 * 케어플 엑셀 컬럼 매핑:
 * A: (번호)
 * B: 이용자 → name
 * C: 성별 → gender ('남'→'male', '여'→'female')
 * D: 생년월일 → birth_date
 * E: 개월수 (무시)
 * F: 장애유형 → diagnosis (일부)
 * G: 장애등급 (무시)
 * H: 통보장애내용 (무시)
 * I: 연락처 → contact (보호자 연락처)
 * J: 이메일 (무시)
 * K: 주소 → address
 * L: 학교 (무시)
 * M: 학교 (무시)
 * N: 교육번호 → registration_number
 * O: 유입경로 (무시)
 * P: 유입경로 관련 참고사항 (무시)
 * Q: 상태 → status mapping
 * R: 메모 → memo
 * S: 최종수정일시 (무시)
 */

interface ParsedChild {
    name: string;
    gender: 'male' | 'female' | null;
    birth_date: string | null;
    diagnosis: string | null;
    contact: string | null;
    address: string | null;
    registration_number: string | null;
    memo: string | null;
    guardian_name: string | null;
    careple_status: string | null; // 원본 상태 (대기/등록/퇴원 등)
    _rowNum: number; // 엑셀 원본 행 번호
    _isValid: boolean;
    _error?: string;
}

interface ExcelImportModalProps {
    centerId: string;
    centerName: string;
    isOpen: boolean;
    onClose: (refresh: boolean) => void;
}

function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function parseExcelDate(value: any): string | null {
    if (!value) return null;

    // Case 1: Excel serial date number
    if (typeof value === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date.toISOString().split('T')[0];
    }

    // Case 2: String date
    if (typeof value === 'string') {
        const cleaned = value.trim();
        // YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
        const match = cleaned.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
        if (match) {
            const [, y, m, d] = match;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }

    return null;
}

function parseGender(value: any): 'male' | 'female' | null {
    if (!value) return null;
    const str = String(value).trim();
    if (str === '남' || str === '남자' || str.toLowerCase() === 'male' || str.toLowerCase() === 'm') return 'male';
    if (str === '여' || str === '여자' || str.toLowerCase() === 'female' || str.toLowerCase() === 'f') return 'female';
    return null;
}

function parsePhone(value: any): string | null {
    if (!value) return null;
    const str = String(value).trim();
    // "(모) 010-1234-5678" → "010-1234-5678"
    const match = str.match(/(01[0-9][-.\s]?\d{3,4}[-.\s]?\d{4})/);
    return match ? match[1].replace(/\s/g, '') : str;
}

function extractGuardianType(value: any): string | null {
    if (!value) return null;
    const str = String(value).trim();
    // "(모)" or "(부)" or "(조모)" etc.
    const match = str.match(/\(([^)]+)\)/);
    if (match) {
        const type = match[1];
        if (type === '모') return '어머니';
        if (type === '부') return '아버지';
        if (type === '조모') return '할머니';
        if (type === '조부') return '할아버지';
        return type;
    }
    return null;
}

export function ExcelImportModal({ centerId, centerName, isOpen, onClose }: ExcelImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
    const [parsedData, setParsedData] = useState<ParsedChild[]>([]);
    const [fileName, setFileName] = useState('');
    const [importResult, setImportResult] = useState({ success: 0, failed: 0, skipped: 0 });
    const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');
    const [showDetails, setShowDetails] = useState(false);
    const [skipRetired, setSkipRetired] = useState(true); // 퇴원 아동 제외
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 'A', defval: '' });

                // Skip header row(s) - find first data row
                let startIdx = 0;
                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = jsonData[i] as any;
                    if (row.B && (row.B === '이용자' || row.B === '이름' || row.B === '아동명')) {
                        startIdx = i + 1;
                        break;
                    }
                }

                const parsed: ParsedChild[] = [];
                for (let i = startIdx; i < jsonData.length; i++) {
                    const row = jsonData[i] as any;
                    const name = String(row.B || '').trim();

                    // Skip empty rows
                    if (!name) continue;

                    const contact = parsePhone(row.I);
                    const guardianType = extractGuardianType(row.I);
                    const birthDate = parseExcelDate(row.D);
                    const gender = parseGender(row.C);
                    const status = String(row.Q || '').trim();

                    let diagnosis = '';
                    if (row.F) diagnosis += String(row.F).trim();
                    if (row.H && String(row.H).trim()) {
                        diagnosis += diagnosis ? ` / ${String(row.H).trim()}` : String(row.H).trim();
                    }

                    const isValid = name.length > 0;
                    const error = !isValid ? '이름이 비어있습니다' : undefined;

                    parsed.push({
                        name,
                        gender,
                        birth_date: birthDate,
                        diagnosis: diagnosis || null,
                        contact,
                        address: String(row.K || '').trim() || null,
                        registration_number: String(row.N || '').trim() || null,
                        memo: String(row.R || '').trim() || null,
                        guardian_name: guardianType,
                        careple_status: status || null,
                        _rowNum: i + 1,
                        _isValid: isValid,
                        _error: error,
                    });
                }

                setParsedData(parsed);
                setStep('preview');
            } catch (error) {
                console.error('Excel parse error:', error);
                alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인하세요.');
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const getFilteredData = () => {
        let filtered = parsedData;
        if (skipRetired) {
            filtered = filtered.filter(d => !d.careple_status || !['퇴원', '종결', '퇴소'].includes(d.careple_status));
        }
        if (filterStatus === 'valid') return filtered.filter(d => d._isValid);
        if (filterStatus === 'invalid') return filtered.filter(d => !d._isValid);
        return filtered;
    };

    const importableData = parsedData.filter(d => {
        if (!d._isValid) return false;
        if (skipRetired && d.careple_status && ['퇴원', '종결', '퇴소'].includes(d.careple_status)) return false;
        return true;
    });

    const handleImport = async () => {
        if (importableData.length === 0) return;

        setStep('importing');
        let success = 0;
        let failed = 0;
        let skipped = 0;

        // Check existing children to avoid duplicates
        const { data: existingChildren } = await supabase
            .from('children')
            .select('name, birth_date')
            .eq('center_id', centerId);

        const existingSet = new Set(
            (existingChildren || []).map(c => `${c.name}_${c.birth_date || ''}`)
        );

        // Batch import
        const batchSize = 10;
        for (let i = 0; i < importableData.length; i += batchSize) {
            const batch = importableData.slice(i, i + batchSize);
            const inserts = [];

            for (const child of batch) {
                const key = `${child.name}_${child.birth_date || ''}`;
                if (existingSet.has(key)) {
                    skipped++;
                    continue;
                }

                inserts.push({
                    name: child.name,
                    gender: child.gender || 'male',
                    birth_date: child.birth_date || '2000-01-01',
                    diagnosis: child.diagnosis,
                    contact: child.contact,
                    address: child.address,
                    registration_number: child.registration_number,
                    memo: child.memo ? `[케어플] ${child.memo}` : '[케어플 이관]',
                    guardian_name: child.guardian_name,
                    invitation_code: generateInviteCode(),
                    center_id: centerId,
                } as any);

                existingSet.add(key); // Prevent in-batch duplicates
            }

            if (inserts.length > 0) {
                const { error } = await supabase
                    .from('children')
                    .insert(inserts);

                if (error) {
                    console.error('Import batch error:', error);
                    failed += inserts.length;
                } else {
                    success += inserts.length;
                }
            }
        }

        setImportResult({ success, failed, skipped });
        setStep('done');
    };

    const handleClose = () => {
        setStep('upload');
        setParsedData([]);
        setFileName('');
        setImportResult({ success: 0, failed: 0, skipped: 0 });
        onClose(step === 'done' && importResult.success > 0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden my-8">
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />

                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                            케어플 엑셀 아동 일괄 등록
                        </h2>
                        <p className="text-slate-400 font-bold text-sm mt-1">
                            대상 센터: <span className="text-indigo-600 dark:text-indigo-400">{centerName}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-8">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
                            >
                                <Upload className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-6 group-hover:text-indigo-500 transition-colors" />
                                <p className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">
                                    케어플 엑셀 파일을 선택하세요
                                </p>
                                <p className="text-sm font-bold text-slate-400">
                                    .xlsx, .xls 파일 지원 · 드래그 앤 드롭 또는 클릭
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 space-y-3">
                                <p className="text-sm font-black text-slate-600 dark:text-slate-300">✅ 지원되는 케어플 엑셀 컬럼:</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-slate-500">
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">B: 이용자(이름)</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">C: 성별</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">D: 생년월일</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">I: 연락처</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">K: 주소</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">N: 교육번호</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">Q: 상태</span>
                                    <span className="bg-white dark:bg-slate-700 px-3 py-2 rounded-xl">R: 메모</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* Stats bar */}
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-2xl font-black text-sm">
                                    📄 {fileName}
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-2xl font-black text-sm">
                                    전체 {parsedData.length}명
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-2xl font-black text-sm">
                                    등록 대상 {importableData.length}명
                                </div>
                                {parsedData.length - importableData.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-2xl font-black text-sm">
                                        제외 {parsedData.length - importableData.length}명
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={skipRetired}
                                        onChange={(e) => setSkipRetired(e.target.checked)}
                                        className="w-4 h-4 rounded accent-indigo-600"
                                    />
                                    퇴원/종결 아동 제외
                                </label>

                                <div className="flex gap-1 ml-auto">
                                    {(['all', 'valid', 'invalid'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setFilterStatus(f)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filterStatus === f
                                                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                        >
                                            {f === 'all' ? '전체' : f === 'valid' ? '유효' : '오류'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Data table */}
                            <div className="max-h-[400px] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">행</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">이름</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">성별</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">생년월일</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">연락처</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">상태</th>
                                            <th className="text-left px-4 py-3 font-black text-slate-500 dark:text-slate-400 text-xs">상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredData().map((child, idx) => {
                                            const isRetired = skipRetired && child.careple_status && ['퇴원', '종결', '퇴소'].includes(child.careple_status);
                                            return (
                                                <tr
                                                    key={idx}
                                                    className={`border-t border-slate-100 dark:border-slate-700/50 ${isRetired
                                                        ? 'opacity-40 line-through'
                                                        : child._isValid
                                                            ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                            : 'bg-rose-50/50 dark:bg-rose-900/10'
                                                        }`}
                                                >
                                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{child._rowNum}</td>
                                                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{child.name}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${child.gender === 'male'
                                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : child.gender === 'female'
                                                                ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                                                                : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                            {child.gender === 'male' ? '남' : child.gender === 'female' ? '여' : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs">{child.birth_date || '-'}</td>
                                                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 text-xs">{child.contact || '-'}</td>
                                                    <td className="px-4 py-2.5">
                                                        {child.careple_status && (
                                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${child.careple_status === '등록'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : child.careple_status === '대기'
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : child.careple_status === '퇴원' || child.careple_status === '종결'
                                                                        ? 'bg-slate-100 text-slate-500'
                                                                        : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {child.careple_status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {!child._isValid && (
                                                            <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                                                                <AlertTriangle className="w-3 h-3" /> {child._error}
                                                            </span>
                                                        )}
                                                        {child._isValid && !isRetired && (
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Detail toggle */}
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                매핑 상세 정보 {showDetails ? '접기' : '보기'}
                            </button>

                            {showDetails && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 text-xs space-y-2 font-bold text-slate-500">
                                    <p>• <span className="text-slate-700 dark:text-slate-200">이름(B)</span> → children.name</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">성별(C)</span> → children.gender (남→male, 여→female)</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">생년월일(D)</span> → children.birth_date</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">장애유형(F)+내용(H)</span> → children.diagnosis</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">연락처(I)</span> → children.contact (번호만 추출)</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">주소(K)</span> → children.address</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">교육번호(N)</span> → children.registration_number</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">메모(R)</span> → children.memo (접두사 "[케어플]" 추가)</p>
                                    <p>• <span className="text-slate-700 dark:text-slate-200">초대코드</span> → 자동 생성 (5자리 랜덤)</p>
                                    <p>• <span className="text-amber-600">⚠️ 이름+생년월일이 동일한 아동은 중복 체크하여 건너뜁니다</span></p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setStep('upload'); setParsedData([]); }}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-lg transition-all"
                                >
                                    다른 파일 선택
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importableData.length === 0}
                                    className="flex-[2] py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 dark:shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="w-5 h-5" />
                                    {importableData.length}명 일괄 등록 시작
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === 'importing' && (
                        <div className="py-16 text-center space-y-6">
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">등록 진행 중...</p>
                                <p className="text-slate-400 font-bold mt-2">잠시만 기다려 주세요. 브라우저를 닫지 마세요.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Done */}
                    {step === 'done' && (
                        <div className="py-12 text-center space-y-8">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mb-2">등록 완료!</p>
                                <p className="text-slate-400 font-bold">{centerName}에 아동 정보가 등록되었습니다.</p>
                            </div>

                            <div className="flex justify-center gap-4">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-8 py-5 rounded-3xl text-center">
                                    <p className="text-3xl font-black text-emerald-600">{importResult.success}</p>
                                    <p className="text-xs font-black text-emerald-500 mt-1">성공</p>
                                </div>
                                {importResult.skipped > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 px-8 py-5 rounded-3xl text-center">
                                        <p className="text-3xl font-black text-amber-600">{importResult.skipped}</p>
                                        <p className="text-xs font-black text-amber-500 mt-1">중복 건너뜀</p>
                                    </div>
                                )}
                                {importResult.failed > 0 && (
                                    <div className="bg-rose-50 dark:bg-rose-900/20 px-8 py-5 rounded-3xl text-center">
                                        <p className="text-3xl font-black text-rose-600">{importResult.failed}</p>
                                        <p className="text-xs font-black text-rose-500 mt-1">실패</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleClose}
                                className="px-12 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                            >
                                완료
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
