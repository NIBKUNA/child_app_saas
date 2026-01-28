/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 */

import { useState, useRef } from 'react';
import { Loader2, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCenter } from '@/contexts/CenterContext';
import { cn } from '@/lib/utils';

interface MultiImageUploaderProps {
    currentImages: string | null; // Comma separated URLs
    onUploadComplete: (urls: string) => void;
    bucketName?: string;
    label?: string;
}

export function MultiImageUploader({
    currentImages,
    onUploadComplete,
    bucketName = 'images',
    label = '여러 이미지 업로드'
}: MultiImageUploaderProps) {
    const { center } = useCenter();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const imageList = currentImages ? currentImages.split(',').map(s => s.trim()).filter(Boolean) : [];

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            setUploading(true);
            const newUrls: string[] = [...imageList];

            // Load Optimizer dynamically
            const { compressImage } = await import('@/utils/imageOptimizer');

            const { data: { session } } = await supabase.auth.getSession();
            const userCenterId = session?.user?.user_metadata?.center_id || center?.id || 'public';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const optimizedFile = await compressImage(file);
                const fileExt = 'webp';
                const filePath = `${userCenterId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, optimizedFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                newUrls.push(data.publicUrl);
            }

            onUploadComplete(newUrls.join(','));
        } catch (error: any) {
            console.error('Error uploading images:', error);
            alert('이미지 업로드 실패: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const newList = imageList.filter((_, i) => i !== index);
        onUploadComplete(newList.join(','));
    };

    return (
        <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {imageList.map((url, index) => (
                    <div key={index} className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border dark:border-slate-800 shadow-sm">
                        <img src={url} alt={`Slide ${index}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => handleRemove(index)}
                                className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-tighter">
                            Slide {index + 1}
                        </div>
                    </div>
                ))}

                {/* Upload Button Box */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={cn(
                        "aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95",
                        uploading ? "bg-slate-50 border-slate-200" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400">업로드 중...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">이미지 추가</span>
                        </>
                    )}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
            />

            <p className="text-[10px] text-slate-400 font-medium ml-1">
                * 여러 장의 이미지를 업로드하면 메인 화면에서 부드러운 슬라이드로 전환됩니다.
            </p>
        </div>
    );
}
