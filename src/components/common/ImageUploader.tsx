/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

import { useState, useRef } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
    currentImage: string | null;
    onUploadComplete: (url: string) => void;
    bucketName?: string;
    label?: string;
}

export function ImageUploader({
    currentImage,
    onUploadComplete,
    bucketName = 'images',
    label = '이미지 업로드'
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
            onUploadComplete(data.publicUrl);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('이미지 업로드 실패: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">{label}</label>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-4 hover:bg-slate-50 transition-colors">
                {currentImage ? (
                    <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden bg-slate-100 shadow-md">
                        <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors"
                            >
                                이미지 변경
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <p className="text-sm text-slate-500 mb-4">등록된 이미지가 없습니다</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all inline-flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            이미지 업로드
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-xs font-bold text-slate-500">업로드 중...</span>
                        </div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
            />
        </div>
    );
}
