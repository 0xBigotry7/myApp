"use client";

import { useState, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Image as ImageIcon, 
  Smile, 
  Lock, 
  Globe, 
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronDown
} from "lucide-react";

interface AddLifeEventModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_TYPES = [
  {
    label: "Life Moments",
    options: [
      { value: "memory", label: "Memory", icon: "💭" },
      { value: "milestone", label: "Milestone", icon: "🎯" },
      { value: "achievement", label: "Achievement", icon: "🏆" },
      { value: "birthday", label: "Birthday", icon: "🎂" },
      { value: "anniversary", label: "Anniversary", icon: "💝" },
    ]
  },
  {
    label: "Relationships",
    options: [
      { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
      { value: "social", label: "Social", icon: "🎉" },
      { value: "friendship", label: "Friendship", icon: "🤝" },
      { value: "dating", label: "Dating", icon: "💕" },
    ]
  },
  {
    label: "Career & Growth",
    options: [
      { value: "work", label: "Work", icon: "💼" },
      { value: "education", label: "Education", icon: "📚" },
      { value: "project", label: "Project", icon: "🚀" },
      { value: "promotion", label: "Promotion", icon: "📈" },
    ]
  },
  {
    label: "Wellness & Fun",
    options: [
      { value: "health", label: "Health", icon: "🌸" },
      { value: "travel", label: "Travel", icon: "✈️" },
      { value: "hobby", label: "Hobby", icon: "🎨" },
      { value: "sports", label: "Sports", icon: "⚽" },
    ]
  }
];

export default function AddLifeEventModal({ onClose, onCreated }: AddLifeEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

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
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const timestamp = localDate.toISOString();

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative bg-zinc-50 w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col transition-transform duration-300 ${isVisible ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:scale-100 sm:opacity-100"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
          <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            New Memory
          </h2>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title Input (Hero) */}
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="What happened?"
                className="w-full text-3xl font-bold bg-transparent border-none p-0 placeholder:text-zinc-300 text-zinc-900 focus:ring-0"
                autoFocus
              />
            </div>

            {/* Type Selection */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 block">Event Type</label>
              <div className="relative">
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
                  className="w-full appearance-none pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-100 rounded-xl font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {EVENT_TYPES.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">✨ Custom Type...</option>
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                  {EVENT_TYPES.flatMap(g => g.options).find(o => o.value === type)?.icon || "✨"}
                </div>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
              
              {showCustomType && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom type..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Story</label>
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 ring-offset-1">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Tell the story..."
                />
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where was this?"
                    className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Tags</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="family, travel..."
                    className="w-full pl-10 pr-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Photos</label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline"
                >
                  + Add Photos
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />

              {photos.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-all flex flex-col items-center gap-2 text-zinc-400"
                >
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  <span className="text-sm font-medium">Click to upload photos</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 transition-colors"
                  >
                    <span className="text-2xl">+</span>
                  </button>
                </div>
              )}
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center gap-3 p-4 bg-zinc-100 rounded-xl">
              <div className={`p-2 rounded-lg ${isPrivate ? "bg-zinc-900 text-white" : "bg-white text-zinc-400"}`}>
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-zinc-900">Private Memory</div>
                <div className="text-xs text-zinc-500">Only visible to you</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-zinc-100 shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span>Create Memory</span>
                  <ChevronRight className="w-5 h-5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
