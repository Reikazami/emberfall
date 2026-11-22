// The card set of Emberfall: four elements, minions with Guard or Swift, and five kinds of spell.

export const ELEMENT = {
  ember: { label: 'Ember', dark: '#4a130c', mid: '#a8391f', light: '#f2874a', glyph: '#ffe2b0' },
  tide: { label: 'Tide', dark: '#0c2748', mid: '#246ca8', light: '#6cc3f2', glyph: '#e0f6ff' },
  gale: { label: 'Gale', dark: '#0f3d2c', mid: '#2e9468', light: '#8ae6b4', glyph: '#e6fff0' },
  stone: { label: 'Stone', dark: '#2f2a26', mid: '#7a6f61', light: '#cdbd9f', glyph: '#fff4de' },
};

export const KEYWORD_TEXT = {
  guard: 'Guard: foes must strike this first.',
  swift: 'Swift: can attack the turn it lands.',
};

function minion(id, name, element, cost, atk, hp, keywords, flavor) {
  return { id, name, type: 'minion', element, cost, atk, hp, keywords, text: flavor };
}

function spell(id, name, element, cost, effect, text) {
  return { id, name, type: 'spell', element, cost, effect, text, keywords: [] };
}

export const CARDS = {
  imp: minion('imp', 'Ember Imp', 'ember', 1, 2, 1, [], 'Small, hot and rude.'),
  minnow: minion('minnow', 'Tide Minnow', 'tide', 1, 1, 3, [], 'Nibbles at your pride.'),
  wisp: minion('wisp', 'Gale Wisp', 'gale', 1, 1, 1, ['swift'], 'Here, then gone.'),
  pup: minion('pup', 'Stone Pup', 'stone', 1, 1, 2, ['guard'], 'Guards the bone.'),
  hound: minion('hound', 'Ash Hound', 'ember', 2, 3, 2, [], 'Tracks by cinder-smell.'),
  turtle: minion('turtle', 'Mossback', 'stone', 2, 1, 4, ['guard'], 'Slow. Very slow.'),
  fox: minion('fox', 'Squall Fox', 'gale', 2, 2, 2, ['swift'], 'Rides the front wind.'),
  caller: minion('caller', 'Tidecaller', 'tide', 3, 3, 4, [], 'Hums the deep songs.'),
  golem: minion('golem', 'Pebble Golem', 'stone', 3, 2, 5, ['guard'], 'Built from a cliff.'),
  hawk: minion('hawk', 'Storm Hawk', 'gale', 3, 4, 2, ['swift'], 'Dives with the thunder.'),
  brute: minion('brute', 'Magma Brute', 'ember', 4, 5, 4, [], 'Walks through walls.'),
  warden: minion('warden', 'Reef Warden', 'tide', 4, 3, 6, ['guard'], 'The tide keeps its word.'),
  phoenix: minion('phoenix', 'Phoenix Fledgling', 'ember', 5, 6, 4, [], 'Burns brightest young.'),
  titan: minion('titan', 'Granite Titan', 'stone', 5, 4, 8, ['guard'], 'A mountain with opinions.'),
  drake: minion('drake', 'Tempest Drake', 'gale', 6, 6, 5, ['swift'], 'Arrives mid-sentence.'),
  leviathan: minion('leviathan', 'Ancient Leviathan', 'tide', 7, 8, 8, [], 'Older than the sea.'),
  spark: spell('spark', 'Spark', 'ember', 1, { kind: 'damage', amount: 2 }, 'Deal 2 damage to a foe or foe minion.'),
  fireball: spell('fireball', 'Fireball', 'ember', 4, { kind: 'damage', amount: 5 }, 'Deal 5 damage to a foe or foe minion.'),
  mend: spell('mend', 'Mend', 'tide', 2, { kind: 'heal', amount: 5 }, 'Restore 5 life to yourself.'),
  gust: spell('gust', 'Gust', 'gale', 2, { kind: 'draw', amount: 2 }, 'Draw 2 cards.'),
  wave: spell('wave', 'Tidal Wave', 'tide', 3, { kind: 'sweep', amount: 2 }, 'Deal 2 damage to every foe minion.'),
  growth: spell('growth', 'Overgrowth', 'gale', 3, { kind: 'buff', atk: 1, hp: 1 }, 'Your minions get +1/+1.'),
};

export const DECK_LIST = [
  'imp', 'minnow', 'wisp', 'pup',
  'hound', 'hound', 'turtle', 'fox',
  'caller', 'golem', 'hawk', 'hawk',
  'brute', 'warden', 'phoenix', 'titan',
  'drake', 'leviathan',
  'spark', 'spark', 'fireball', 'mend', 'gust', 'wave', 'growth',
].slice(0, 25);

export function isTargetedSpell(card) {
  return card.type === 'spell' && card.effect.kind === 'damage';
}

export function hasKeyword(card, word) {
  return card.keywords.includes(word);
}
