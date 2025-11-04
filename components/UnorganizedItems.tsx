"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getTranslations, type Locale } from "@/lib/i18n";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  weight: number | null;
  isPacked: boolean;
  belongsTo: string;
  colorCode: string | null;
  importance: string;
  notes: string | null;
}

interface UnorganizedItemsProps {
  items: PackingItem[];
  locale: Locale;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItem: (itemId: string, isPacked: boolean) => void;
}

function DraggableItem({
  item,
  onDelete,
  onToggle
}: {
  item: PackingItem;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item: item,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-violet-300 transition-all group"
    >
      <div {...listeners} className="cursor-move text-gray-400 hover:text-gray-600">
        ⋮⋮
      </div>
      <input
        type="checkbox"
        checked={item.isPacked}
        onChange={onToggle}
        className="w-4 h-4 text-violet-600 rounded cursor-pointer"
      />
      {item.importance && item.importance !== "normal" && (
        <span className="text-xs flex-shrink-0" title={item.importance}>
          {item.importance === "essential" && "🔴"}
          {item.importance === "important" && "🟠"}
          {item.importance === "optional" && "⚪"}
        </span>
      )}
      {item.colorCode && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.colorCode }}
          title={item.belongsTo}
        />
      )}
      <span
        className={`flex-1 text-sm ${
          item.isPacked ? "line-through text-gray-400" : "text-gray-700"
        }`}
      >
        {item.name}
        {item.quantity > 1 && (
          <span className="text-xs text-gray-500 ml-1">×{item.quantity}</span>
        )}
      </span>
      <span className="text-xs text-gray-400 capitalize">{item.category}</span>
      {item.weight && (
        <span className="text-xs text-gray-400">
          {(item.weight * item.quantity).toFixed(1)}kg
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
      >
        🗑️
      </button>
    </div>
  );
}

export default function UnorganizedItems({
  items,
  locale,
  onAddItem,
  onDeleteItem,
  onToggleItem,
}: UnorganizedItemsProps) {
  const t = getTranslations(locale);

  const { setNodeRef, isOver } = useDroppable({
    id: 'unorganized',
    data: {
      type: 'unorganized-area',
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-dashed transition-all ${
        isOver ? "border-violet-500 bg-violet-50" : "border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📦 {t.unorganizedItems}
            <span className="text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t.itemsNotInLuggage}</p>
        </div>
        <button
          onClick={onAddItem}
          className="px-4 py-2 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors"
        >
          + {t.addItem}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-sm">{t.dragItemsToOrganize}</p>
        </div>
      ) : (
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <DraggableItem
                key={item.id}
                item={item}
                onDelete={() => onDeleteItem(item.id)}
                onToggle={() => onToggleItem(item.id, item.isPacked)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
