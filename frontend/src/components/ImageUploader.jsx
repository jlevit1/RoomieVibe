import { useRef, useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { uploadImage } from '../services/uploadService';

export default function ImageUploader({ images, onChange, maxImages = 10 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    setUploading(true);
    try {
      const remaining = maxImages - images.length;
      const filesToUpload = files.slice(0, remaining);
      const urls = await Promise.all(filesToUpload.map(uploadImage));
      onChange([...images, ...urls]);
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh lên thất bại, thử lại nhé');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage(url) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url, i) => (
          <div key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            <img src={url} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-xs font-semibold text-gray-900">
                Ảnh bìa
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(url)}
              aria-label={`Xóa ảnh ${i + 1}`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/70 text-white transition-colors hover:bg-gray-900"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-900 disabled:cursor-wait"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            <span className="text-sm font-medium">{uploading ? 'Đang tải lên...' : 'Thêm ảnh'}</span>
            {!uploading && <span className="text-xs text-gray-500">Còn {maxImages - images.length} ảnh</span>}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
