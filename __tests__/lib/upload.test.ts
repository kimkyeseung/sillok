import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock env
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

import { uploadPersonImage } from '@/lib/upload';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('uploadPersonImage', () => {
  const mockFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

  it('should get presigned URL then upload file', async () => {
    // Mock presigned URL response
    mockFetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              upload_url: 'https://storage.test/upload?token=abc',
              path: 'person-1/file-id.jpg',
              file_id: 'file-id',
            },
          }),
      })
      // Mock file upload response
      .mockResolvedValueOnce({ ok: true });

    const url = await uploadPersonImage(mockFile, 'person-1');

    // Should call presigned URL endpoint
    expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'persons',
        content_type: 'image/jpeg',
        file_size: 4,
        person_id: 'person-1',
      }),
    });

    // Should upload to presigned URL
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://storage.test/upload?token=abc',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: mockFile,
      }
    );

    // Should return public URL
    expect(url).toBe(
      'https://test.supabase.co/storage/v1/object/public/persons/person-1/file-id.jpg'
    );
  });

  it('should throw if presigned URL fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          success: false,
          error: { message: 'Unauthorized' },
        }),
    });

    await expect(uploadPersonImage(mockFile, 'person-1')).rejects.toThrow(
      'Unauthorized'
    );
  });

  it('should throw if file upload fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              upload_url: 'https://storage.test/upload',
              path: 'p/f.jpg',
              file_id: 'f',
            },
          }),
      })
      .mockResolvedValueOnce({ ok: false });

    await expect(uploadPersonImage(mockFile, 'person-1')).rejects.toThrow(
      'Failed to upload file'
    );
  });
});
