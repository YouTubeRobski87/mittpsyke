import type { JomojiCategory } from './jomojiTypes';
import { jomojiLabels } from './jomojiLabels';

const svgModules = import.meta.glob('$lib/assets/picker/**/*.svg', {
  query: '?raw',
  eager: true,
  import: 'default'
}) as Record<string, string>;

const categoryOrder = ['Humör', 'Aktiviteter', 'Människor', 'Miljö', 'Mat', 'Symboler'];

const categoryIcons: Record<string, string> = {
  Humör: 'face-beaming',
  Aktiviteter: 'party-popper',
  Människor: 'hand-waving',
  Miljö: 'house',
  Mat: 'apple',
  Symboler: 'light-bulb'
};

function toName(filename: string): string {
  return filename
    .replace('.svg', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Track seen IDs to handle duplicates across categories
const seenIds = new Set<string>();
const categoryMap = new Map<string, { emojis: { id: string; name: string; svg: string }[] }>();

for (const [path, svg] of Object.entries(svgModules)) {
  const parts = path.split('/');
  // Path is .../Jomojis/Category/file.svg - get last two segments
  const categoryName = parts[parts.length - 2].normalize('NFC');
  const filename = parts[parts.length - 1];
  const emojiId = filename.replace('.svg', '');
  const emojiName = toName(filename);

  if (seenIds.has(emojiId)) continue;
  seenIds.add(emojiId);

  if (!categoryMap.has(categoryName)) {
    categoryMap.set(categoryName, { emojis: [] });
  }

  categoryMap.get(categoryName)!.emojis.push({ id: emojiId, name: emojiName, svg: svg as string });
}

export const jomojiCategories: JomojiCategory[] = categoryOrder
  .filter((name) => categoryMap.has(name))
  .map((name) => {
    const { emojis } = categoryMap.get(name)!;
    return {
      name,
      icon: emojis.find((e) => e.id === categoryIcons[name])?.svg ?? emojis[0].svg,
      emojis
    };
  });

// Lookup maps for rendering and labels
export const jomojiSvgMap = new Map<string, string>();
export const jomojiNameMap = new Map<string, string>();
export const jomojiLabelMap = new Map<string, string>();

for (const category of jomojiCategories) {
  for (const emoji of category.emojis) {
    jomojiSvgMap.set(emoji.id, emoji.svg);
    jomojiNameMap.set(emoji.id, emoji.name);
    // Use Swedish labels when available, otherwise fall back to auto-generated name
    jomojiLabelMap.set(emoji.id, jomojiLabels[emoji.id] ?? emoji.name);
  }
}
