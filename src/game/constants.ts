/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: number;
  n: string; // Name
  f: string; // Flag emoji
  r: number; // Rating (66-94)
  c: string; // Primary kit color
  preferredFormationId: string; // Default tactical formation
}

export interface PlayerRole {
  id: number;
  number: number;
  name: string;
  shortName: string;
  sizeDesc: string;
  radius: number; // base 21 px
  mass: number;
  powerMultiplier: number;
  clearanceBonus?: number;
  blockBonus?: number;
  agilityBonus?: number;
  controlBonus?: number;
  precisionBonus?: number;
  finishingBonus?: number;
  specialAbility: string;
  balanceDesc: string;
  massDesc: string;
  powerDesc: string;
}

export interface TacticalFormation {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: string;
  style: 'balanced' | 'offensive' | 'defensive' | 'wings' | 'possession';
  // 6 coordinates for players [1..6] relative to (PITCH_LEFT, PITCH_TOP)
  // Pitch width = 400, height = 680
  positions: [number, number][];
}

export const BASE_RADIUS = 21;
export const MATCH_DURATION_SECONDS = 180; // 3 minutes as requested!
export const EXTRA_TIME_SECONDS = 45; // Golden goal extra period if tied in knockout

export const ROLES: PlayerRole[] = [
  {
    id: 1,
    number: 1,
    name: 'Kaleci',
    shortName: 'KL',
    sizeDesc: '%35 daha büyük',
    radius: Math.round(BASE_RADIUS * 1.35 * 10) / 10, // 28.4px
    mass: 9.0, // Çok yüksek; rakip taşlara karşı daha zor hareket eder
    powerMultiplier: 0.82, // Düşük
    clearanceBonus: 1.7, // Topa temas ettiğinde güçlü uzaklaştırma yapar
    specialAbility: 'Kale çizgisine yakınken kalecilik avantajı & güçlü uzaklaştırma',
    balanceDesc: 'Büyük boyutu nedeniyle diğer taşlara alan bırakır.',
    massDesc: 'Çok yüksek',
    powerDesc: 'Düşük (Topa temasta yüksek uzaklaştırma)',
  },
  {
    id: 2,
    number: 2,
    name: 'Stoper',
    shortName: 'STP',
    sizeDesc: '%15 daha büyük',
    radius: Math.round(BASE_RADIUS * 1.15 * 10) / 10, // 24.2px
    mass: 6.2, // Yüksek
    powerMultiplier: 1.0, // Orta
    blockBonus: 1.45, // Top çarpışmalarında daha güçlü müdahale ve blok
    specialAbility: 'Top çarpışmalarında daha güçlü müdahale ve blok',
    balanceDesc: 'Yavaş ivmelenir, ancak savunma hattında kolay kolay savrulmaz.',
    massDesc: 'Yüksek',
    powerDesc: 'Orta',
  },
  {
    id: 3,
    number: 3,
    name: 'Bek',
    shortName: 'BEK',
    sizeDesc: 'Normalden biraz küçük',
    radius: 19.5, // ~-7%
    mass: 4.0, // Orta
    powerMultiplier: 1.06, // Orta
    agilityBonus: 1.25, // Hızlı hareket ve çapraz açıyla müdahale
    specialAbility: 'Hızlı hareket ve çapraz açıyla topa müdahale',
    balanceDesc: 'Hem savunmada hem hücumda kullanılabilir.',
    massDesc: 'Orta',
    powerDesc: 'Orta',
  },
  {
    id: 4,
    number: 4,
    name: 'Ön Libero & Merkez',
    shortName: 'ÖNL',
    sizeDesc: 'Normal',
    radius: 21.0, // Normal
    mass: 4.5, // Orta
    powerMultiplier: 1.1, // Orta
    controlBonus: 1.3, // Top kontrolünde ve pas bağlantılarında avantaj
    specialAbility: 'Top kontrolünde ve pas bağlantılarında avantaj',
    balanceDesc: 'İki yönlü oyunun merkezidir; topu takım arkadaşlarına hazırlamakta iyidir.',
    massDesc: 'Orta',
    powerDesc: 'Orta',
  },
  {
    id: 5,
    number: 5,
    name: 'On Numara',
    shortName: '10',
    sizeDesc: '%5 daha küçük',
    radius: Math.round(BASE_RADIUS * 0.95 * 10) / 10, // 20.0px
    mass: 3.3, // Orta-düşük
    powerMultiplier: 1.3, // Yüksek
    precisionBonus: 1.6, // İnce açılardan şut ve hassas pas
    specialAbility: 'İnce açılardan şut ve hassas pas desteği',
    balanceDesc: 'Teknik açıdan güçlüdür ama sert çarpışmalarda dezavantajlıdır.',
    massDesc: 'Orta-düşük',
    powerDesc: 'Yüksek',
  },
  {
    id: 6,
    number: 6,
    name: 'Forvet',
    shortName: 'FVT',
    sizeDesc: '%12 daha küçük',
    radius: Math.round(BASE_RADIUS * 0.88 * 10) / 10, // 18.5px
    mass: 2.7, // Düşük
    powerMultiplier: 1.48, // Çok yüksek
    finishingBonus: 1.35, // Kaleye yakın şutlarda güç ve isabet bonusu
    specialAbility: 'Kaleye yakın şutlarda güç ve isabet bitiricilik bonusu',
    balanceDesc: 'Çabuk hızlanır fakat defans taşlarıyla çarpışınca daha kolay savrulur.',
    massDesc: 'Düşük',
    powerDesc: 'Çok yüksek',
  },
];

export const WORLD_WIDTH = 500;
export const WORLD_HEIGHT = 820;
export const PITCH_LEFT = 50;
export const PITCH_TOP = 70;
export const PITCH_RIGHT = 450;
export const PITCH_BOTTOM = 750;
export const CENTER_X = 250;
export const CENTER_Y = 410;
export const GOAL_LEFT = 180;
export const GOAL_RIGHT = 320;
export const GOAL_WIDTH = GOAL_RIGHT - GOAL_LEFT; // 140
export const PHYSICS_DT = 1 / 120;
export const MAX_PULL_DISTANCE = 110;

/**
 * 5 Distinct Tactical Formations for 6 Players
 */
export const FORMATIONS: TacticalFormation[] = [
  {
    id: 'classic',
    name: 'Klasik 1-2-1-1-1',
    shortLabel: 'Dengeli',
    description: 'Dengeli saha dizilişi. Hem savunmada derinlik hem hücumda destek.',
    icon: '⚖️',
    style: 'balanced',
    positions: [
      [200, 646], // 1: Kaleci
      [160, 565], // 2: Stoper
      [280, 545], // 3: Bek
      [150, 480], // 4: Ön libero & merkez
      [260, 440], // 5: On numara
      [200, 390], // 6: Forvet
    ],
  },
  {
    id: 'offensive',
    name: 'Baskı 1-1-1-1-2',
    shortLabel: 'Hücum',
    description: 'İleri hatta agresif pres. Rakip yarı sahaya yakın 2 forvet tehdidi.',
    icon: '🔥',
    style: 'offensive',
    positions: [
      [200, 646], // 1: Kaleci
      [200, 575], // 2: Tek merkezi stoper
      [100, 490], // 3: İleri fırlayan sol bek
      [300, 490], // 4: Ön libero sağ kanat desteği
      [160, 410], // 5: On numara ceza sahası önü
      [240, 370], // 6: Forvet kaleye çok yakın
    ],
  },
  {
    id: 'catenaccio',
    name: 'Katenaçyo 1-2-2-0-1',
    shortLabel: 'Savunma',
    description: 'Çift hatlı çelik savunma. Kalesini kapatıp hızlı kontralarla vurur.',
    icon: '🛡️',
    style: 'defensive',
    positions: [
      [200, 650], // 1: Kaleci
      [140, 585], // 2: Derin stoper sol
      [260, 585], // 3: Derin stoper/bek sağ
      [140, 515], // 4: Ön libero kalkanı
      [260, 515], // 5: On numara kontra pas istasyonu
      [200, 420], // 6: İleride tek kontra forveti
    ],
  },
  {
    id: 'wings',
    name: 'Kanat Akını 1-1-2-1-1',
    shortLabel: 'Kanatlar',
    description: 'Sahanın genişliğini kullanarak çizgilere yayılır ve orta/çapraz şut üretir.',
    icon: '⚡',
    style: 'wings',
    positions: [
      [200, 646], // 1: Kaleci
      [200, 575], // 2: Stoper merkezde
      [80, 510],  // 3: Sol kanat bek
      [200, 465], // 4: Ön libero merkez dağıtıcı
      [320, 510], // 5: Sağ kanat hücumcu
      [200, 385], // 6: Merkez bitirici forvet
    ],
  },
  {
    id: 'possession',
    name: 'Tiki-Taka 1-1-3-0-1',
    shortLabel: 'Orta Saha',
    description: 'Orta sahada kalabalık pas üçgenleri kurup rakibin dengesini bozar.',
    icon: '🎯',
    style: 'possession',
    positions: [
      [200, 646], // 1: Kaleci
      [200, 570], // 2: Stoper
      [120, 475], // 3: Sol iç pasör
      [200, 450], // 4: Ön libero merkez
      [280, 475], // 5: Sağ iç On numara
      [200, 395], // 6: Sahte 9 Forvet
    ],
  },
];

export const DEFAULT_FORMATION_ID = 'classic';

export const TEAMS_DATA: Team[] = [
  { id: 0, n: 'Arjantin', f: '🇦🇷', r: 94, c: '#74acdf', preferredFormationId: 'offensive' },
  { id: 1, n: 'Fransa', f: '🇫🇷', r: 93, c: '#1e40af', preferredFormationId: 'offensive' },
  { id: 2, n: 'İspanya', f: '🇪🇸', r: 92, c: '#dc2626', preferredFormationId: 'possession' },
  { id: 3, n: 'Brezilya', f: '🇧🇷', r: 92, c: '#facc15', preferredFormationId: 'offensive' },
  { id: 4, n: 'İngiltere', f: '🇬🇧', r: 91, c: '#e5e7eb', preferredFormationId: 'wings' },
  { id: 5, n: 'Portekiz', f: '🇵🇹', r: 89, c: '#991b1b', preferredFormationId: 'possession' },
  { id: 6, n: 'Almanya', f: '🇩🇪', r: 89, c: '#374151', preferredFormationId: 'balanced' },
  { id: 7, n: 'Hollanda', f: '🇳🇱', r: 88, c: '#f97316', preferredFormationId: 'possession' },
  { id: 8, n: 'İtalya', f: '🇮🇹', r: 87, c: '#2563eb', preferredFormationId: 'catenaccio' },
  { id: 9, n: 'Hırvatistan', f: '🇭🇷', r: 86, c: '#be123c', preferredFormationId: 'possession' },
  { id: 10, n: 'Belçika', f: '🇧🇪', r: 85, c: '#b91c1c', preferredFormationId: 'wings' },
  { id: 11, n: 'Uruguay', f: '🇺🇾', r: 84, c: '#7dd3fc', preferredFormationId: 'catenaccio' },
  { id: 12, n: 'Kolombiya', f: '🇨🇴', r: 83, c: '#eab308', preferredFormationId: 'wings' },
  { id: 13, n: 'Fas', f: '🇲🇦', r: 82, c: '#15803d', preferredFormationId: 'catenaccio' },
  { id: 14, n: 'Japonya', f: '🇯🇵', r: 82, c: '#1e3a8a', preferredFormationId: 'balanced' },
  { id: 15, n: 'ABD', f: '🇺🇸', r: 81, c: '#4338ca', preferredFormationId: 'wings' },
  { id: 16, n: 'Türkiye', f: '🇹🇷', r: 80, c: '#e30a17', preferredFormationId: 'balanced' },
  { id: 17, n: 'Meksika', f: '🇲🇽', r: 80, c: '#166534', preferredFormationId: 'balanced' },
  { id: 18, n: 'Senegal', f: '🇸🇳', r: 80, c: '#16a34a', preferredFormationId: 'wings' },
  { id: 19, n: 'İsviçre', f: '🇨🇭', r: 79, c: '#ef4444', preferredFormationId: 'catenaccio' },
  { id: 20, n: 'Danimarka', f: '🇩🇰', r: 79, c: '#dc2626', preferredFormationId: 'balanced' },
  { id: 21, n: 'Güney Kore', f: '🇰🇷', r: 78, c: '#f43f5e', preferredFormationId: 'wings' },
  { id: 22, n: 'Polonya', f: '🇵🇱', r: 74, c: '#f87171', preferredFormationId: 'catenaccio' },
  { id: 23, n: 'Avustralya', f: '🇦🇺', r: 73, c: '#fbbf24', preferredFormationId: 'catenaccio' },
  { id: 24, n: 'Mısır', f: '🇪🇬', r: 73, c: '#b91c1c', preferredFormationId: 'wings' },
  { id: 25, n: 'İran', f: '🇮🇷', r: 72, c: '#059669', preferredFormationId: 'catenaccio' },
  { id: 26, n: 'Kanada', f: '🇨🇦', r: 72, c: '#dc2626', preferredFormationId: 'wings' },
  { id: 27, n: 'Nijerya', f: '🇳🇬', r: 74, c: '#22c55e', preferredFormationId: 'offensive' },
  { id: 28, n: 'Gana', f: '🇬🇭', r: 70, c: '#fde047', preferredFormationId: 'balanced' },
  { id: 29, n: 'Suudi Arabistan', f: '🇸🇦', r: 68, c: '#047857', preferredFormationId: 'catenaccio' },
  { id: 30, n: 'Kosta Rika', f: '🇨🇷', r: 67, c: '#1d4ed8', preferredFormationId: 'catenaccio' },
  { id: 31, n: 'Katar', f: '🇶🇦', r: 66, c: '#881337', preferredFormationId: 'catenaccio' },
];

export const DIFFICULTY_NAMES = ['Kolay', 'Normal', 'Zor'];
export const ROUND_NAMES: Record<number, string> = {
  8: 'Son 16',
  4: 'Çeyrek Final',
  2: 'Yarı Final',
  1: 'Final',
};
