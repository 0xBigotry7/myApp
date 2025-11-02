"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";

interface AddLifeEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddLifeEventModal({ onClose, onCreated }: AddLifeEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [type, setType] = useState("memory");
  const [customType, setCustomType] = useState("");
  const [showCustomType, setShowCustomType] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      alert("Please enter a title and date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse date and time components to avoid UTC conversion issues
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const timestamp = localDate.toISOString();

      // Upload photos to Google Drive first if any
      const photoUrls: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo) => {
          formData.append("photos", photo);
        });

        const uploadResponse = await fetch("/api/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoUrls.push(...uploadData.urls);
        } else {
          const error = await uploadResponse.json();
          if (error.needsAuth) {
            alert("Please connect Google Drive in Settings first to upload photos.");
            return;
          }
          throw new Error("Failed to upload photos");
        }
      }

      const finalType = showCustomType && customType ? customType : type;

      const eventData = {
        type: finalType,
        title,
        content: content || undefined,
        photos: photoUrls,
        location: location || undefined,
        mood: mood || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        isPrivate,
        date: timestamp,
      };

      const response = await fetch("/api/timeline/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      onCreated();
    } catch (error) {
      console.error("Error creating life event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Add Life Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={showCustomType ? "custom" : type}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setShowCustomType(true);
                } else {
                  setShowCustomType(false);
                  setType(e.target.value);
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            >
              <optgroup label="🌟 Life Moments">
                <option value="memory">💭 Memory</option>
                <option value="milestone">🎯 Milestone</option>
                <option value="achievement">🏆 Achievement</option>
                <option value="birthday">🎂 Birthday</option>
                <option value="anniversary">💝 Anniversary</option>
              </optgroup>
              <optgroup label="👥 Relationships">
                <option value="family">👨‍👩‍👧‍👦 Family</option>
                <option value="social">🎉 Social</option>
                <option value="friendship">🤝 Friendship</option>
                <option value="dating">💕 Dating</option>
              </optgroup>
              <optgroup label="💼 Career & Education">
                <option value="work">💼 Work</option>
                <option value="education">📚 Education</option>
                <option value="project">🚀 Project</option>
                <option value="promotion">📈 Promotion</option>
              </optgroup>
              <optgroup label="🏃 Health & Wellness">
                <option value="health">🌸 Health</option>
                <option value="fitness">💪 Fitness</option>
                <option value="mental_health">🧘 Mental Health</option>
              </optgroup>
              <optgroup label="🎯 Hobbies & Interests">
                <option value="hobby">🎨 Hobby</option>
                <option value="travel">✈️ Travel</option>
                <option value="reading">📖 Reading</option>
                <option value="music">🎵 Music</option>
                <option value="sports">⚽ Sports</option>
                <option value="gaming">🎮 Gaming</option>
              </optgroup>
              <optgroup label="🏠 Home & Daily Life">
                <option value="home">🏡 Home</option>
                <option value="pet">🐾 Pet</option>
                <option value="cooking">🍳 Cooking</option>
              </optgroup>
              <optgroup label="📝 Documentation">
                <option value="photo">📸 Photo</option>
                <option value="note">📝 Note</option>
                <option value="journal">📔 Journal</option>
              </optgroup>
              <option value="custom">✨ Custom Type...</option>
            </select>
            {showCustomType && (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter custom event type (e.g., 'volunteering', 'adventure')"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none mt-2"
                required={showCustomType}
              />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What happened?"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Tell the story... (Markdown supported: **bold**, *italic*, ## heading, etc.)"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where was this?"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How did you feel?
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select mood...</option>
              <option value="happy">😊 Happy</option>
              <option value="excited">🤩 Excited</option>
              <option value="grateful">🙏 Grateful</option>
              <option value="proud">😎 Proud</option>
              <option value="neutral">😐 Neutral</option>
              <option value="sad">😢 Sad</option>
              <option value="anxious">😰 Anxious</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="family, celebration, career"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Photos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {photos.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  {photos.length} photo{photos.length > 1 ? "s" : ""} selected
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 shadow-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-900">
                🔒 Keep this private (only visible to you)
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
