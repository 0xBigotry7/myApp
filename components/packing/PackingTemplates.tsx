"use client";

import { useState } from "react";
import { 
  Plane, 
  Briefcase, 
  Palmtree, 
  Mountain, 
  Snowflake, 
  Tent,
  Baby,
  Sparkles,
  Plus,
  Check,
  X
} from "lucide-react";
import { getTranslations, type Locale } from "@/lib/i18n";

interface TemplateItem {
  name: string;
  category: string;
  quantity: number;
}

interface PackingTemplate {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  items: TemplateItem[];
}

const TEMPLATES: PackingTemplate[] = [
  {
    id: "essentials",
    name: "Travel Essentials",
    icon: Plane,
    color: "bg-blue-500",
    description: "Must-have items for any trip",
    items: [
      { name: "Passport", category: "documents", quantity: 1 },
      { name: "Phone", category: "electronics", quantity: 1 },
      { name: "Phone Charger", category: "charging", quantity: 1 },
      { name: "Wallet", category: "accessories", quantity: 1 },
      { name: "Keys", category: "accessories", quantity: 1 },
      { name: "Toothbrush", category: "toiletries", quantity: 1 },
      { name: "Toothpaste", category: "toiletries", quantity: 1 },
      { name: "Underwear", category: "clothing", quantity: 3 },
      { name: "Socks", category: "clothing", quantity: 3 },
      { name: "Pain Relief", category: "medications", quantity: 1 },
    ],
  },
  {
    id: "beach",
    name: "Beach Vacation",
    icon: Palmtree,
    color: "bg-amber-500",
    description: "Sun, sand, and relaxation",
    items: [
      { name: "Swimwear", category: "clothing", quantity: 2 },
      { name: "Sunscreen", category: "toiletries", quantity: 1 },
      { name: "Sunglasses", category: "accessories", quantity: 1 },
      { name: "Hat", category: "accessories", quantity: 1 },
      { name: "Sandals", category: "shoes", quantity: 1 },
      { name: "Beach Towel", category: "other", quantity: 1 },
      { name: "Shorts", category: "clothing", quantity: 3 },
      { name: "T-Shirts", category: "clothing", quantity: 4 },
      { name: "Lip Balm", category: "cosmetics", quantity: 1 },
      { name: "Aloe Vera", category: "medications", quantity: 1 },
    ],
  },
  {
    id: "business",
    name: "Business Trip",
    icon: Briefcase,
    color: "bg-zinc-800",
    description: "Professional and polished",
    items: [
      { name: "Dress Shirts", category: "clothing", quantity: 3 },
      { name: "Dress Pants", category: "clothing", quantity: 2 },
      { name: "Dress Shoes", category: "shoes", quantity: 1 },
      { name: "Belt", category: "clothing", quantity: 1 },
      { name: "Laptop", category: "electronics", quantity: 1 },
      { name: "Laptop Charger", category: "charging", quantity: 1 },
      { name: "Business Cards", category: "documents", quantity: 1 },
      { name: "Notebook", category: "other", quantity: 1 },
      { name: "Tie", category: "clothing", quantity: 2 },
      { name: "Watch", category: "accessories", quantity: 1 },
    ],
  },
  {
    id: "hiking",
    name: "Hiking Adventure",
    icon: Mountain,
    color: "bg-emerald-600",
    description: "Outdoor exploration",
    items: [
      { name: "Hiking Boots", category: "shoes", quantity: 1 },
      { name: "Backpack", category: "accessories", quantity: 1 },
      { name: "Water Bottle", category: "other", quantity: 1 },
      { name: "Snacks", category: "food", quantity: 1 },
      { name: "Sunscreen", category: "toiletries", quantity: 1 },
      { name: "First Aid Kit", category: "medications", quantity: 1 },
      { name: "Rain Jacket", category: "clothing", quantity: 1 },
      { name: "Quick-dry Clothes", category: "clothing", quantity: 2 },
      { name: "Hat", category: "accessories", quantity: 1 },
      { name: "Headlamp", category: "electronics", quantity: 1 },
    ],
  },
  {
    id: "winter",
    name: "Winter Trip",
    icon: Snowflake,
    color: "bg-sky-500",
    description: "Stay warm and cozy",
    items: [
      { name: "Winter Coat", category: "clothing", quantity: 1 },
      { name: "Sweaters", category: "clothing", quantity: 3 },
      { name: "Thermal Underwear", category: "clothing", quantity: 2 },
      { name: "Warm Socks", category: "clothing", quantity: 4 },
      { name: "Gloves", category: "accessories", quantity: 1 },
      { name: "Scarf", category: "accessories", quantity: 1 },
      { name: "Beanie", category: "accessories", quantity: 1 },
      { name: "Moisturizer", category: "cosmetics", quantity: 1 },
      { name: "Lip Balm", category: "cosmetics", quantity: 1 },
      { name: "Boots", category: "shoes", quantity: 1 },
    ],
  },
  {
    id: "camping",
    name: "Camping Trip",
    icon: Tent,
    color: "bg-orange-600",
    description: "Back to nature",
    items: [
      { name: "Sleeping Bag", category: "bedding", quantity: 1 },
      { name: "Tent", category: "other", quantity: 1 },
      { name: "Flashlight", category: "electronics", quantity: 1 },
      { name: "Power Bank", category: "charging", quantity: 1 },
      { name: "Bug Spray", category: "medications", quantity: 1 },
      { name: "Sunscreen", category: "toiletries", quantity: 1 },
      { name: "First Aid Kit", category: "medications", quantity: 1 },
      { name: "Water Bottle", category: "other", quantity: 2 },
      { name: "Snacks", category: "food", quantity: 1 },
      { name: "Comfortable Shoes", category: "shoes", quantity: 1 },
    ],
  },
  {
    id: "baby",
    name: "Traveling with Baby",
    icon: Baby,
    color: "bg-pink-500",
    description: "Everything for little ones",
    items: [
      { name: "Diapers", category: "other", quantity: 1 },
      { name: "Baby Wipes", category: "other", quantity: 1 },
      { name: "Baby Formula", category: "food", quantity: 1 },
      { name: "Baby Bottles", category: "other", quantity: 2 },
      { name: "Baby Clothes", category: "clothing", quantity: 5 },
      { name: "Bibs", category: "other", quantity: 3 },
      { name: "Baby Blanket", category: "bedding", quantity: 1 },
      { name: "Pacifier", category: "other", quantity: 2 },
      { name: "Baby Medicine", category: "medications", quantity: 1 },
      { name: "Baby Toys", category: "other", quantity: 2 },
    ],
  },
];

interface PackingTemplatesProps {
  onApplyTemplate: (items: TemplateItem[], owner: string) => Promise<void>;
  locale: Locale;
}

export default function PackingTemplates({ onApplyTemplate, locale }: PackingTemplatesProps) {
  const t = getTranslations(locale);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PackingTemplate | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<"shared" | "baber" | "BABER">("shared");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);

  const handleOpenTemplate = (template: PackingTemplate) => {
    setSelectedTemplate(template);
    setSelectedItems(new Set(template.items.map((_, i) => i)));
    setShowModal(true);
  };

  const handleToggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTemplate) {
      if (selectedItems.size === selectedTemplate.items.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(selectedTemplate.items.map((_, i) => i)));
      }
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    
    setApplying(true);
    const itemsToAdd = selectedTemplate.items.filter((_, i) => selectedItems.has(i));
    await onApplyTemplate(itemsToAdd, selectedOwner);
    setApplying(false);
    setShowModal(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      {/* Template Picker */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Quick Start Templates</h3>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => handleOpenTemplate(template)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all shrink-0 group"
              >
                <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white whitespace-nowrap">
                  {template.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Modal */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className={`${selectedTemplate.color} p-5 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <selectedTemplate.icon className="w-6 h-6" />
                  <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/80 text-sm">{selectedTemplate.description}</p>
            </div>

            {/* Owner Selector */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
                Add items for
              </label>
              <div className="flex gap-2">
                {[
                  { value: "shared", label: "Everyone", style: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" },
                  { value: "baber", label: t.baber, style: "bg-pink-500 text-white" },
                  { value: "BABER", label: t.BABER, style: "bg-blue-500 text-white" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedOwner(opt.value as typeof selectedOwner)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedOwner === opt.value
                        ? opt.style
                        : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="p-4 max-h-[40vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {selectedItems.size} of {selectedTemplate.items.length} items selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  {selectedItems.size === selectedTemplate.items.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-1">
                {selectedTemplate.items.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleToggleItem(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedItems.has(index)
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedItems.has(index)
                        ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}>
                      {selectedItems.has(index) && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
                    </div>
                    <span className={`flex-1 text-left text-sm font-medium ${
                      selectedItems.has(index) ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                    }`}>
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        ×{item.quantity}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying || selectedItems.size === 0}
                className="flex-1 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {applying ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add {selectedItems.size} Items
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

