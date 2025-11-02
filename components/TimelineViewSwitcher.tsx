"use client";

export type TimelineView = "feed" | "horizontal" | "calendar" | "map" | "stats" | "grid" | "story";

interface TimelineViewSwitcherProps {
  currentView: TimelineView;
  onViewChange: (view: TimelineView) => void;
}

const views: Array<{ id: TimelineView; icon: string; label: string; description: string }> = [
  {
    id: "feed",
    icon: "📱",
    label: "Feed",
    description: "Vertical timeline feed",
  },
  {
    id: "horizontal",
    icon: "📊",
    label: "Timeline",
    description: "Interactive horizontal timeline",
  },
  {
    id: "calendar",
    icon: "📅",
    label: "Calendar",
    description: "Calendar heat map view",
  },
  {
    id: "map",
    icon: "🗺️",
    label: "Map",
    description: "Geographic event plotting",
  },
  {
    id: "stats",
    icon: "📈",
    label: "Stats",
    description: "Insights and analytics",
  },
  {
    id: "grid",
    icon: "🎴",
    label: "Grid",
    description: "Photo masonry grid",
  },
  {
    id: "story",
    icon: "📖",
    label: "Story",
    description: "Life chapters narrative",
  },
];

export default function TimelineViewSwitcher({ currentView, onViewChange }: TimelineViewSwitcherProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">View Mode</h3>
        <div className="text-xs text-gray-500">Choose how to view your timeline</div>
      </div>

      {/* Desktop: Horizontal Buttons */}
      <div className="hidden md:flex items-center gap-2">
        {views.map((view) => {
          const isActive = currentView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all transform
                ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                }
              `}
              title={view.description}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl">{view.icon}</span>
                <span className="text-xs">{view.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <select
          value={currentView}
          onChange={(e) => onViewChange(e.target.value as TimelineView)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none font-medium"
        >
          {views.map((view) => (
            <option key={view.id} value={view.id}>
              {view.icon} {view.label} - {view.description}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
