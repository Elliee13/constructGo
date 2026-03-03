import { Asset } from 'expo-asset';

const toUri = (moduleId: number) => Asset.fromModule(moduleId).uri;

const fromModules = (modules: number[]) => modules.map((moduleId) => toUri(moduleId));

const pickSingleImage = (uris: string[], startIndex: number): string[] => {
  if (uris.length === 0) return [];
  return [uris[startIndex % uris.length]];
};

const mapCategory = (names: string[], uris: string[]) =>
  Object.fromEntries(names.map((name, index) => [name, pickSingleImage(uris, index)]));

const toolUris = fromModules([
  require('../assets/products/tools/tools1.png'),
  require('../assets/products/tools/tools2.png'),
  require('../assets/products/tools/tools3.png'),
  require('../assets/products/tools/tools4.png'),
  require('../assets/products/tools/tools5.png'),
  require('../assets/products/tools/tools6.png'),
  require('../assets/products/tools/tools7.jpg'),
]);

const electricalUris = fromModules([
  require('../assets/products/electrical/Elec1.png'),
  require('../assets/products/electrical/Elec2.png'),
  require('../assets/products/electrical/Elec3.png'),
  require('../assets/products/electrical/Elec4.png'),
  require('../assets/products/electrical/Elec5.png'),
  require('../assets/products/electrical/Elec6.png'),
]);

const plumbingUris = fromModules([
  require('../assets/products/plumbing/Plum1.png'),
  require('../assets/products/plumbing/Plum2.png'),
  require('../assets/products/plumbing/Plum3.png'),
  require('../assets/products/plumbing/Plum4.png'),
  require('../assets/products/plumbing/Plum5.png'),
  require('../assets/products/plumbing/Plum6.png'),
]);

const paintUris = fromModules([
  require('../assets/products/paint/Paint1.png'),
  require('../assets/products/paint/Paint2.png'),
  require('../assets/products/paint/Paint3.png'),
  require('../assets/products/paint/Paint4.png'),
  require('../assets/products/paint/Paint5.png'),
]);

const toolNames = [
  'Power Drill Set',
  'Circular Saw',
  'Framing Hammer',
  'Measuring Tape',
  'Screwdriver Set',
  'Step Ladder',
  'Steel Nails (Per Kilo)',
  'Socket Wrench Set',
  'Adjustable Spanner Kit',
  'Laser Distance Meter',
  'Hex Key Set',
];

const electricalNames = [
  'Digital Multimeter',
  'True RMS Multimeter',
  'Adjustable Hacksaw',
  'Mini Hacksaw',
  'Ratcheting Crimping Tool',
  'Wire Terminal Crimper',
  'Digital Voltage Tester Pen',
  'Self-Adjusting Wire Stripper',
  'Long Nose Pliers',
  'Precision Long Nose Pliers',
];

const plumbingNames = [
  'PVC Pipe Cutter',
  'Heavy-Duty PVC Cutter',
  'Straight Pipe Wrench',
  'Heavy Pipe Wrench',
  'Manual Tube Bender',
  'Copper Pipe Bender',
  'Manual Pipe Threader Set',
  'Pipe Deburring Tool',
  'Rubber Drain Plunger',
  'Heavy-Duty Toilet Plunger',
];

const paintNames = [
  'Paint Roller',
  'Paint Roller Refill',
  'Paint Brush Set',
  'Angled Paint Brush Set',
  'Electric Paint Spray Gun',
  'HVLP Paint Sprayer',
  'Putty Knife',
  'Wide Putty Knife',
  'Airbrush Spray Gun',
  'Dual-Action Airbrush Kit',
];

export const localProductImages: Record<string, string[]> = {
  ...mapCategory(toolNames, toolUris),
  ...mapCategory(electricalNames, electricalUris),
  ...mapCategory(plumbingNames, plumbingUris),
  ...mapCategory(paintNames, paintUris),
};

export const localProductImagesBySku: Record<string, string[]> = {
  'TLS-PD-18V': pickSingleImage(toolUris, 0),
  'TLS-CS-185': pickSingleImage(toolUris, 1),
  'TLS-FH-20': pickSingleImage(toolUris, 2),
  'TLS-MT-25': pickSingleImage(toolUris, 3),
  'TLS-SD-12': pickSingleImage(toolUris, 4),
  'TLS-SL-5FT': pickSingleImage(toolUris, 5),
  'TLS-NAILS-001': pickSingleImage(toolUris, 6),
  'ELC-DM-6000': pickSingleImage(electricalUris, 0),
  'ELC-TRMS-600': pickSingleImage(electricalUris, 1),
  'ELC-HSW-12': pickSingleImage(electricalUris, 2),
  'ELC-HSW-M6': pickSingleImage(electricalUris, 3),
  'ELC-RCT-8P8C': pickSingleImage(electricalUris, 4),
  'ELC-WTC-2210': pickSingleImage(electricalUris, 5),
  'PLB-PC-PVC': pickSingleImage(plumbingUris, 0),
  'PLB-PC-P63': pickSingleImage(plumbingUris, 1),
  'PLB-SPW-14': pickSingleImage(plumbingUris, 2),
  'PLB-HPW-18': pickSingleImage(plumbingUris, 3),
  'PLB-MTB-180': pickSingleImage(plumbingUris, 4),
  'PLB-CPB-180': pickSingleImage(plumbingUris, 5),
  'PNT-PR-9': pickSingleImage(paintUris, 0),
  'PNT-PRR-9': pickSingleImage(paintUris, 1),
  'PNT-PBS-5': pickSingleImage(paintUris, 2),
  'PNT-APB-4': pickSingleImage(paintUris, 3),
  'PNT-EPS-500': pickSingleImage(paintUris, 4),
};
