'use client';

import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface UploadedImage {
  id: string;
  url: string;
}

interface ImageUploadProps {
  bucket: 'threads' | 'persons' | 'avatars';
  maxFiles?: number;
  onUpload: (images: UploadedImage[]) => void;
}

export default function ImageUpload({
  bucket,
  maxFiles = 3,
  onUpload,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxFiles - images.length;
    if (remaining <= 0) {
      toast(`You can upload up to ${maxFiles} images`, 'error');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast('File size must be 5MB or less', 'error');
          continue;
        }

        const { presigned_url, file_path } = await apiFetch<{
          presigned_url: string;
          file_path: string;
        }>('/api/upload/presigned-url', {
          method: 'POST',
          body: JSON.stringify({
            bucket,
            content_type: file.type,
            file_name: file.name,
          }),
        });

        await fetch(presigned_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          url: file_path,
        };
        setImages((prev) => {
          const updated = [...prev, newImage];
          onUpload(updated);
          return updated;
        });
      }
    } catch {
      toast('Upload failed', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      onUpload(updated);
      return updated;
    });
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <img
                src={img.url}
                alt=""
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxFiles && (
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-600">
          {uploading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Attach Image ({images.length}/{maxFiles})
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
