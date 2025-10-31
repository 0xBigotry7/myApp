"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface AddPhotoModalProps {
  tripId: string;
  onClose: () => void;
}

export default function AddPhotoModal({ tripId, onClose }: AddPhotoModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [timestamp, setTimestamp] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);

    // Generate preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]); // Clean up memory
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert("Please select at least one photo");
      return;
    }

    setUploading(true);

    try {
      // Upload all photos to Vercel Blob
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { url } = await uploadRes.json();
        return url;
      });

      const photoUrls = await Promise.all(uploadPromises);

      // Create the trip post
      // The timestamp from datetime-local input is already in local timezone
      // Just pass it through as-is
      const res = await fetch(`/api/trips/${tripId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "photo",
          content: caption || null,
          photos: photoUrls,
          location: location || null,
          timestamp: new Date(timestamp).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create post");
      }

      // Clean up preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      // Refresh the page to show the new post
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">📸 Add Photos</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Photos *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all"
            >
              {selectedFiles.length === 0 ? "Choose Photos" : `${selectedFiles.length} photo(s) selected`}
            </button>
          </div>

          {/* Preview */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover rounded-xl border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this moment..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              📍 Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was this taken?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              🕐 Date & Time
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            <p className="text-xs text-gray-600 mt-1">
              Adjust if you're backdating this memory
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-2xl font-bold hover:bg-gray-300 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-6 rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "Uploading..." : "Post Photos"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
