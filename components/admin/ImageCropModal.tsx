'use client';

import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import Modal from '@/components/common/Modal';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onComplete: (croppedFile: File) => void;
  /** Aspect ratio (default: 1 for square) */
  aspect?: number;
}

export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onComplete,
  aspect = 1,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const file = await getCroppedImage(imageSrc, croppedArea);
      onComplete(file);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Crop Image">
      <div className="space-y-4">
        {/* Crop area */}
        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-900 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-1">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
          />
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Apply'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Canvas crop helper ──

async function getCroppedImage(
  imageSrc: string,
  crop: Area
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Output at 400x400 max for thumbnails
  const outputSize = Math.min(400, crop.width, crop.height);
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(new File([blob!], 'thumbnail.webp', { type: 'image/webp' }));
      },
      'image/webp',
      0.85
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
