import { getAvatarUrl, getProductImageUrl } from '../utils/image';
import { localProductImages, localProductImagesBySku } from './productImages';

export const categories = ['Tools', 'Electrical', 'Plumbing', 'Paint'];

type ProductOption = {
  id: string;
  label: string;
  priceDelta: number;
};

type ProductOptionGroup = {
  id: string;
  label: string;
  required?: boolean;
  type?: 'single';
  options: ProductOption[];
};

type ProductSeed = {
  id: string;
  category: string;
  name: string;
  price: number;
  model: string;
  sku: string;
  imageKeywords: string[];
  optionGroups?: ProductOptionGroup[];
};

const seeds: ProductSeed[] = [
  { id: 'p1', category: 'Tools', name: 'Power Drill Set', price: 1290, model: 'PD-18V-SET', sku: 'TLS-PD-18V', imageKeywords: ['power drill', 'cordless drill', 'drill set'], optionGroups: [{ id: 'p1-battery', label: 'Battery Pack', options: [{ id: 'p1-battery-1', label: '2.0Ah', priceDelta: 0 }, { id: 'p1-battery-2', label: '4.0Ah (+P450)', priceDelta: 450 }] }, { id: 'p1-warranty', label: 'Warranty', options: [{ id: 'p1-warranty-1', label: '1 year', priceDelta: 0 }, { id: 'p1-warranty-2', label: '2 years (+P250)', priceDelta: 250 }] }] },
  { id: 'p2', category: 'Tools', name: 'Circular Saw', price: 1490, model: 'CS-185-STD', sku: 'TLS-CS-185', imageKeywords: ['circular saw', 'wood cutting saw', 'power saw'] },
  { id: 'p3', category: 'Tools', name: 'Framing Hammer', price: 890, model: 'FH-20OZ-STL', sku: 'TLS-FH-20', imageKeywords: ['framing hammer', 'claw hammer', 'steel hammer'] },
  { id: 'p4', category: 'Tools', name: 'Measuring Tape', price: 420, model: 'MT-25FT-PR', sku: 'TLS-MT-25', imageKeywords: ['measuring tape', 'tape measure', '25ft tape'] },
  { id: 'p5', category: 'Tools', name: 'Screwdriver Set', price: 760, model: 'SD-12PC-SET', sku: 'TLS-SD-12', imageKeywords: ['screwdriver set', 'phillips screwdriver', 'flathead screwdriver'] },
  { id: 'p6', category: 'Tools', name: 'Step Ladder', price: 1190, model: 'SL-5FT-AL', sku: 'TLS-SL-5FT', imageKeywords: ['step ladder', 'folding ladder', 'aluminum ladder'], optionGroups: [{ id: 'p6-height', label: 'Height', options: [{ id: 'p6-height-1', label: '5ft', priceDelta: 0 }, { id: 'p6-height-2', label: '6ft (+P300)', priceDelta: 300 }] }, { id: 'p6-material', label: 'Material', options: [{ id: 'p6-material-1', label: 'Aluminum', priceDelta: 0 }, { id: 'p6-material-2', label: 'Fiberglass (+P600)', priceDelta: 600 }] }] },
  {
    id: 'tools-nails-001',
    category: 'Tools',
    name: 'Steel Nails (Per Kilo)',
    price: 65,
    model: 'SN-KG-5SIZE',
    sku: 'TLS-NAILS-001',
    imageKeywords: ['steel nails', 'hardware nails', 'wire nails'],
    optionGroups: [
      {
        id: 'tools-nails-001-size',
        label: 'Size',
        required: true,
        type: 'single',
        options: [
          { id: 'size-1', label: 'Size 1', priceDelta: 0 },
          { id: 'size-2', label: 'Size 2', priceDelta: 0 },
          { id: 'size-3', label: 'Size 3', priceDelta: -5 },
          { id: 'size-4', label: 'Size 4', priceDelta: -15 },
          { id: 'size-5', label: 'Size 5', priceDelta: -15 },
        ],
      },
    ],
  },
  { id: 'p11', category: 'Electrical', name: 'Digital Multimeter', price: 890, model: 'DM-6000', sku: 'ELC-DM-6000', imageKeywords: ['digital multimeter', 'electrical tester', 'voltage meter'] },
  { id: 'p12', category: 'Electrical', name: 'True RMS Multimeter', price: 1190, model: 'TRMS-600V', sku: 'ELC-TRMS-600', imageKeywords: ['digital multimeter', 'true rms meter', 'electrical tester'] },
  { id: 'p13', category: 'Electrical', name: 'Adjustable Hacksaw', price: 420, model: 'HSW-12-ADJ', sku: 'ELC-HSW-12', imageKeywords: ['hacksaw', 'metal saw', 'hand saw frame'] },
  { id: 'p14', category: 'Electrical', name: 'Mini Hacksaw', price: 310, model: 'HSW-MINI-6', sku: 'ELC-HSW-M6', imageKeywords: ['mini hacksaw', 'compact hacksaw', 'metal cutting saw'] },
  { id: 'p15', category: 'Electrical', name: 'Ratcheting Crimping Tool', price: 760, model: 'RCT-8P8C', sku: 'ELC-RCT-8P8C', imageKeywords: ['ratcheting crimper', 'cable crimping tool', 'wire crimper'] },
  { id: 'p16', category: 'Electrical', name: 'Wire Terminal Crimper', price: 680, model: 'WTC-22-10', sku: 'ELC-WTC-2210', imageKeywords: ['wire terminal crimper', 'crimping pliers', 'electrical crimper'] },
  { id: 'p21', category: 'Plumbing', name: 'PVC Pipe Cutter', price: 450, model: 'PC-PVC-42', sku: 'PLB-PC-PVC', imageKeywords: ['pvc pipe cutter', 'pipe cutting tool', 'plumbing cutter'], optionGroups: [{ id: 'p21-size', label: 'Cutting Capacity', options: [{ id: 'p21-size-1', label: '0-42mm', priceDelta: 0 }, { id: 'p21-size-2', label: '0-63mm (+P180)', priceDelta: 180 }] }] },
  { id: 'p22', category: 'Plumbing', name: 'Heavy-Duty PVC Cutter', price: 530, model: 'PC-PVC-63', sku: 'PLB-PC-P63', imageKeywords: ['heavy duty pvc cutter', 'ratchet pipe cutter', 'pipe cutting tool'] },
  { id: 'p23', category: 'Plumbing', name: 'Straight Pipe Wrench', price: 620, model: 'SPW-14IN', sku: 'PLB-SPW-14', imageKeywords: ['pipe wrench', 'straight pipe wrench', 'plumbing wrench'] },
  { id: 'p24', category: 'Plumbing', name: 'Heavy Pipe Wrench', price: 680, model: 'HPW-18IN', sku: 'PLB-HPW-18', imageKeywords: ['heavy pipe wrench', 'steel pipe wrench', 'plumbing wrench'] },
  { id: 'p25', category: 'Plumbing', name: 'Manual Tube Bender', price: 740, model: 'MTB-180', sku: 'PLB-MTB-180', imageKeywords: ['manual tube bender', 'pipe bending tool', 'copper tube bender'] },
  { id: 'p26', category: 'Plumbing', name: 'Copper Pipe Bender', price: 790, model: 'CPB-180', sku: 'PLB-CPB-180', imageKeywords: ['copper pipe bender', 'tube bender', 'manual pipe bender'] },
  { id: 'p31', category: 'Paint', name: 'Paint Roller', price: 240, model: 'PR-9IN', sku: 'PNT-PR-9', imageKeywords: ['paint roller', 'roller painting tool', 'wall roller'] },
  { id: 'p32', category: 'Paint', name: 'Paint Roller Refill', price: 180, model: 'PRR-9IN', sku: 'PNT-PRR-9', imageKeywords: ['paint roller refill', 'roller sleeve', 'wall paint roller'] },
  { id: 'p33', category: 'Paint', name: 'Paint Brush Set', price: 280, model: 'PBS-5PC', sku: 'PNT-PBS-5', imageKeywords: ['paint brush set', 'painting brushes', 'paint tools'] },
  { id: 'p34', category: 'Paint', name: 'Angled Paint Brush Set', price: 320, model: 'APB-4PC', sku: 'PNT-APB-4', imageKeywords: ['angled paint brush', 'trim brush set', 'paint brush'] },
  { id: 'p35', category: 'Paint', name: 'Electric Paint Spray Gun', price: 1390, model: 'EPS-500W', sku: 'PNT-EPS-500', imageKeywords: ['electric paint spray gun', 'paint sprayer', 'spray gun'] },
];

const toSoldText = (soldCount: number) => {
  if (soldCount >= 1000) {
    const k = (soldCount / 1000).toFixed(1).replace('.0', '');
    return `${k}k sold`;
  }
  return `${soldCount} sold`;
};

type ProductType =
  | 'drill'
  | 'hammer'
  | 'tape'
  | 'nails'
  | 'hacksaw'
  | 'pliers'
  | 'screwdriver'
  | 'driver'
  | 'saw'
  | 'grinder'
  | 'ladder'
  | 'wrench'
  | 'pipe-bender'
  | 'plunger'
  | 'meter'
  | 'tester'
  | 'cable-tool'
  | 'breaker'
  | 'extension'
  | 'light'
  | 'junction'
  | 'soldering'
  | 'pipe-tool'
  | 'plumbing-fixture'
  | 'paint-liquid'
  | 'paint-tool'
  | 'generic';

const hasAny = (value: string, parts: string[]) => parts.some((part) => value.includes(part));

const getProductType = (seed: ProductSeed): ProductType => {
  const source = `${seed.name} ${seed.imageKeywords.join(' ')}`.toLowerCase();

  if (source.includes('hacksaw')) return 'hacksaw';
  if (hasAny(source, ['hammer drill', 'cordless drill']) || source.includes('drill')) return 'drill';
  if (hasAny(source, ['framing hammer', 'claw hammer']) || source.includes(' hammer')) return 'hammer';
  if (hasAny(source, ['measuring tape', 'tape measure'])) return 'tape';
  if (source.includes('nails')) return 'nails';
  if (hasAny(source, ['long nose pliers', 'needle nose pliers'])) return 'pliers';
  if (source.includes('screwdriver')) return 'screwdriver';
  if (source.includes('pipe bender') || source.includes('tube bender')) return 'pipe-bender';
  if (source.includes('plunger')) return 'plunger';
  if (hasAny(source, ['impact driver', 'driver kit'])) return 'driver';
  if (hasAny(source, ['saw', 'reciprocating'])) return 'saw';
  if (source.includes('grinder')) return 'grinder';
  if (source.includes('ladder')) return 'ladder';
  if (hasAny(source, ['wrench', 'spanner', 'socket'])) return 'wrench';
  if (hasAny(source, ['multimeter', 'distance meter'])) return 'meter';
  if (source.includes('tester')) return 'tester';
  if (hasAny(source, ['crimp', 'stripper', 'screwdriver', 'plier'])) return 'cable-tool';
  if (source.includes('breaker')) return 'breaker';
  if (source.includes('extension reel')) return 'extension';
  if (hasAny(source, ['work light', 'flood light'])) return 'light';
  if (source.includes('junction box')) return 'junction';
  if (source.includes('soldering')) return 'soldering';
  if (hasAny(source, ['pipe', 'drain', 'faucet', 'trap', 'seal tape', 'gauge', 'deburring', 'threader'])) return 'pipe-tool';
  if (hasAny(source, ['mixer', 'shower'])) return 'plumbing-fixture';
  if (hasAny(source, ['paint', 'primer', 'epoxy', 'rust converter'])) return 'paint-liquid';
  if (hasAny(source, ['roller', 'brush', 'spray gun', 'putty', 'sanding', 'masking'])) return 'paint-tool';
  return 'generic';
};

const getSpecs = (seed: ProductSeed) => {
  const type = getProductType(seed);

  switch (type) {
    case 'drill':
      return [
        { label: 'Voltage', value: seed.name.toLowerCase().includes('hammer') ? '20V MAX' : '18V MAX' },
        { label: 'Max Torque', value: '320 in-lbs' },
        { label: 'Chuck Size', value: '1/2 inch keyless' },
        { label: 'Weight', value: '1.8 kg' },
      ];
    case 'hacksaw':
      return [
        { label: 'Blade Length', value: '12 inch' },
        { label: 'Blade Type', value: 'Bi-Metal HSS' },
        { label: 'TPI', value: '24 TPI' },
        { label: 'Frame Material', value: 'Steel Frame' },
      ];
    case 'hammer':
      return [
        { label: 'Head Weight', value: '20 oz' },
        { label: 'Head Material', value: 'Forged Steel' },
        { label: 'Handle', value: 'Fiberglass Anti-Slip Grip' },
        { label: 'Weight', value: '0.9 kg' },
      ];
    case 'tape':
      return [
        { label: 'Tape Length', value: '25 ft (7.5 m)' },
        { label: 'Blade Width', value: '25 mm' },
        { label: 'Lock Type', value: 'Auto Lock' },
        { label: 'Case Material', value: 'ABS + TPR' },
      ];
    case 'nails':
      return [
        { label: 'Material', value: 'High-Carbon Steel' },
        { label: 'Finish', value: 'Bright Zinc-Coated' },
        { label: 'Packaging', value: 'Sold per kilo' },
        { label: 'Use Case', value: 'General framing and carpentry' },
      ];
    case 'screwdriver':
      return [
        { label: 'Piece Count', value: '12 pcs' },
        { label: 'Tip Types', value: 'Phillips, Flat, Torx' },
        { label: 'Shaft Material', value: 'Chrome Vanadium Steel' },
        { label: 'Handle', value: 'Anti-Slip Grip' },
      ];
    case 'pliers':
      return [
        { label: 'Length', value: '6 inch' },
        { label: 'Jaw Type', value: 'Needle Nose' },
        { label: 'Material', value: 'Chrome Vanadium Steel' },
        { label: 'Handle', value: 'Insulated Grip' },
      ];
    case 'driver':
      return [
        { label: 'Voltage', value: '20V MAX' },
        { label: 'Impact Rate', value: '0-3200 BPM' },
        { label: 'Bit Holder', value: '1/4 inch hex' },
        { label: 'Weight', value: '1.4 kg' },
      ];
    case 'saw':
      return [
        { label: 'Power', value: seed.name.toLowerCase().includes('circular') ? '1400W' : '900W' },
        { label: 'No-load Speed', value: seed.name.toLowerCase().includes('circular') ? '5200 RPM' : '0-3000 SPM' },
        { label: 'Blade Size', value: seed.name.toLowerCase().includes('circular') ? '185 mm' : '150 mm' },
        { label: 'Weight', value: '3.2 kg' },
      ];
    case 'grinder':
      return [
        { label: 'Power', value: '900W' },
        { label: 'Disc Size', value: '100 mm' },
        { label: 'No-load Speed', value: '11000 RPM' },
        { label: 'Weight', value: '2.1 kg' },
      ];
    case 'ladder':
      return [
        { label: 'Height', value: '5 ft' },
        { label: 'Load Capacity', value: '150 kg' },
        { label: 'Material', value: 'Aluminum' },
        { label: 'Weight', value: '5.4 kg' },
      ];
    case 'wrench':
      return [
        { label: 'Material', value: 'Chrome Vanadium Steel' },
        { label: 'Size Range', value: '8-24 mm' },
        { label: 'Finish', value: 'Rust Resistant' },
        { label: 'Weight', value: '1.2 kg' },
      ];
    case 'pipe-bender':
      return [
        { label: 'Bending Range', value: '0-180 deg' },
        { label: 'Tube Size', value: '1/4 to 1/2 inch' },
        { label: 'Material', value: 'Forged Alloy Steel' },
        { label: 'Weight', value: '1.5 kg' },
      ];
    case 'plunger':
      return [
        { label: 'Cup Diameter', value: '145 mm' },
        { label: 'Handle Length', value: '380 mm' },
        { label: 'Cup Material', value: 'Flexible Rubber' },
        { label: 'Use Case', value: 'Sink and Toilet Drain' },
      ];
    case 'meter':
      return [
        { label: 'Measurement Range', value: seed.name.toLowerCase().includes('laser') ? '0.05-40 m' : '600V AC/DC' },
        { label: 'Display', value: 'Backlit LCD' },
        { label: 'Battery', value: '2 x AAA' },
        { label: 'Weight', value: '0.3 kg' },
      ];
    case 'tester':
      return [
        { label: 'Detection Range', value: '90-1000V AC' },
        { label: 'Indicator', value: 'LED + Buzzer' },
        { label: 'Safety Category', value: 'CAT III 600V' },
        { label: 'Weight', value: '0.1 kg' },
      ];
    case 'cable-tool':
      return [
        { label: 'Material', value: 'Hardened Steel + ABS' },
        { label: 'Wire Range', value: '10-22 AWG' },
        { label: 'Function', value: 'Strip, Crimp, Tighten' },
        { label: 'Weight', value: '0.6 kg' },
      ];
    case 'breaker':
      return [
        { label: 'Rated Current', value: '20A' },
        { label: 'Poles', value: '1P' },
        { label: 'Rated Voltage', value: '230V AC' },
        { label: 'Breaking Capacity', value: '6kA' },
      ];
    case 'extension':
      return [
        { label: 'Cable Length', value: '30 m' },
        { label: 'Wire Gauge', value: '1.5 sqmm' },
        { label: 'Outlet Count', value: '4 sockets' },
        { label: 'Max Load', value: '2500W' },
      ];
    case 'light':
      return [
        { label: 'Power', value: '50W' },
        { label: 'Brightness', value: '4500 lm' },
        { label: 'Waterproof Rating', value: 'IP65' },
        { label: 'Color Temp', value: '6500K' },
      ];
    case 'junction':
      return [
        { label: 'Box Count', value: '8 pcs' },
        { label: 'Size', value: '100 x 100 mm' },
        { label: 'Material', value: 'Flame Retardant ABS' },
        { label: 'Ingress Rating', value: 'IP55' },
      ];
    case 'soldering':
      return [
        { label: 'Power', value: '60W' },
        { label: 'Temperature Range', value: '200-480 C' },
        { label: 'Tip Type', value: 'Replaceable' },
        { label: 'Warm-up Time', value: '45 sec' },
      ];
    case 'pipe-tool':
      return [
        { label: 'Pipe Range', value: '1/2 to 2 inch' },
        { label: 'Material', value: 'Alloy Steel' },
        { label: 'Finish', value: 'Corrosion Resistant' },
        { label: 'Weight', value: '1.1 kg' },
      ];
    case 'plumbing-fixture':
      return [
        { label: 'Inlet Size', value: '1/2 inch' },
        { label: 'Material', value: 'Brass + Chrome' },
        { label: 'Cartridge Type', value: 'Ceramic Disc' },
        { label: 'Pressure Range', value: '0.1-0.8 MPa' },
      ];
    case 'paint-liquid':
      return [
        { label: 'Coverage', value: seed.name.toLowerCase().includes('epoxy') ? '8-10 sqm/L' : '10-12 sqm/L' },
        { label: 'Dry Time', value: '1-2 hours' },
        { label: 'Finish', value: seed.name.toLowerCase().includes('epoxy') ? 'Gloss' : 'Matte' },
        { label: 'Recoating Time', value: '4 hours' },
      ];
    case 'paint-tool':
      return [
        { label: 'Application', value: 'Walls and Trim' },
        { label: 'Material', value: 'Nylon Fiber + PP' },
        { label: 'Recommended Surface', value: 'Smooth to Semi-Rough' },
        { label: 'Weight', value: '0.4 kg' },
      ];
    default:
      return [
        { label: 'Material', value: 'Industrial Grade' },
        { label: 'Use Case', value: 'Home and Site' },
        { label: 'Durability', value: 'Daily Use' },
        { label: 'Weight', value: '0.9 kg' },
      ];
  }
};

const getFeatures = (seed: ProductSeed) => {
  const type = getProductType(seed);

  if (type === 'drill' || type === 'driver') {
    return [
      'Compact motor with controlled torque output',
      'Variable speed trigger for precision drilling',
      'LED work light for low-light work areas',
      'Balanced grip for longer use',
    ];
  }

  if (type === 'hacksaw') {
    return [
      'Rigid frame for straight cutting lines',
      'Quick blade replacement mechanism',
      'Comfortable handle for controlled strokes',
      'Suitable for metal and plastic pipe cuts',
    ];
  }

  if (type === 'hammer') {
    return [
      'Forged steel head for repeated impact use',
      'Balanced swing and reduced hand fatigue',
      'Textured grip for secure handling',
      'Suitable for framing and repair work',
    ];
  }

  if (type === 'nails') {
    return [
      'Sold per kilo with five size options',
      'Consistent shank profile for secure hold',
      'Suitable for framing, formwork, and wood assemblies',
      'Packed for dry storage and easy handling',
    ];
  }

  if (type === 'tape') {
    return [
      'High-contrast markings for easy reading',
      'Smooth lock and retract mechanism',
      'Durable casing for on-site use',
      'Accurate measurements for fit-out tasks',
    ];
  }

  if (type === 'screwdriver') {
    return [
      'Multiple bit types for common fasteners',
      'Magnetic tips for easier screw handling',
      'Comfortable anti-slip handles',
      'Ideal for assembly and maintenance jobs',
    ];
  }

  if (type === 'pliers') {
    return [
      'Slim nose reaches tight wiring spaces',
      'Precise grip for bending and holding wire',
      'Durable steel body for daily use',
      'Comfortable insulated handle design',
    ];
  }

  if (type === 'pipe-bender') {
    return [
      'Accurate angle marks for repeatable bends',
      'Smooth forming on copper and soft metal tubes',
      'Leverage-friendly handle geometry',
      'Reliable for install and maintenance work',
    ];
  }

  if (type === 'plunger') {
    return [
      'Strong suction for common drain clogs',
      'Flexible cup seals well on flat surfaces',
      'Lightweight and easy to handle',
      'Suitable for sinks and toilets',
    ];
  }

  if (type === 'paint-liquid') {
    return [
      'Consistent color and smooth spread',
      'Low odor formula for indoor use',
      'Fast surface drying between coats',
      'Reliable finish for wall and trim projects',
    ];
  }

  if (type === 'paint-tool') {
    return [
      'Even paint pickup and release',
      'Comfortable handle for long sessions',
      'Easy to clean after use',
      'Suitable for home and renovation work',
    ];
  }

  if (type === 'pipe-tool' || type === 'plumbing-fixture') {
    return [
      'Secure fit and clean output on common fittings',
      'Corrosion-resistant build for wet environments',
      'Comfortable handling for repeated tasks',
      'Built for routine plumbing maintenance',
    ];
  }

  if (seed.category === 'Electrical') {
    return [
      'Stable readings and consistent electrical response',
      'Durable housing for site conditions',
      'Simple setup for everyday maintenance',
      'Compact profile for toolbox storage',
    ];
  }

  return [
    'Reliable build for everyday site tasks',
    'Durable components for long service life',
    'Compact storage-friendly design',
    'Suitable for home and light professional use',
  ];
};

const getIncluded = (seed: ProductSeed) => {
  const type = getProductType(seed);

  if (seed.name.toLowerCase().includes('set') || seed.name.toLowerCase().includes('kit')) {
    return `${seed.name}, carrying case, and quick-start guide.`;
  }

  if (type === 'paint-liquid') {
    return `${seed.name}, application guide, and warranty card.`;
  }

  if (type === 'pipe-tool' || type === 'plumbing-fixture') {
    return `${seed.name}, fitting guide, and warranty card.`;
  }

  return `${seed.name}, warranty card, and quick-start guide.`;
};

const getDescription = (seed: ProductSeed) => {
  const type = getProductType(seed);

  if (type === 'drill' || type === 'driver' || type === 'saw' || type === 'grinder' || type === 'hacksaw') {
    return `${seed.name} is designed for dependable cutting, drilling, and fastening work on active job sites.`;
  }

  if (type === 'hammer' || type === 'tape' || type === 'screwdriver' || type === 'ladder' || type === 'pliers') {
    return `${seed.name} is built for daily construction and maintenance tasks with reliable handling and durability.`;
  }

  if (type === 'nails') {
    return 'Steel nails sold per kilo, available in multiple sizes for framing, woodwork, and general hardware applications.';
  }

  if (type === 'pipe-bender' || type === 'plunger') {
    return `${seed.name} is built for practical plumbing work with dependable control and durability.`;
  }

  if (seed.category === 'Electrical') {
    return `${seed.name} supports safe electrical setup and maintenance for home and commercial use.`;
  }

  if (seed.category === 'Plumbing') {
    return `${seed.name} handles common plumbing installs and service work with stable, repeatable results.`;
  }

  if (seed.category === 'Paint') {
    return `${seed.name} helps deliver clean and consistent paint prep and finishing results.`;
  }

  return `${seed.name} built for dependable daily maintenance and repair tasks.`;
};

const getReviewText = (seed: ProductSeed, variant: 1 | 2) => {
  const type = getProductType(seed);

  if (type === 'drill' || type === 'driver') {
    return variant === 1
      ? 'Good torque and smooth trigger control. It handled wood and metal projects without stalling.'
      : 'Battery life was enough for a full afternoon. The grip stayed comfortable during repeated use.';
  }

  if (type === 'saw' || type === 'grinder') {
    return variant === 1
      ? 'Cut quality stayed clean and the tool felt stable through thicker material.'
      : 'Blade and guard alignment were accurate. It made straight cuts with minimal vibration.';
  }

  if (type === 'hacksaw') {
    return variant === 1
      ? 'The frame stays rigid and cuts are straight on conduit and threaded rods.'
      : 'Blade tension is easy to adjust and the handle feels secure during long cuts.';
  }

  if (type === 'hammer') {
    return variant === 1
      ? 'Solid strike feel and good balance. It drove framing nails quickly without hand strain.'
      : 'Grip stayed secure even during longer use. The claw side pulls nails cleanly.';
  }

  if (type === 'tape') {
    return variant === 1
      ? 'The markings are clear and easy to read. Lock holds firmly while measuring alone.'
      : 'Retract is smooth and the case feels durable for daily site use.';
  }

  if (type === 'nails') {
    return variant === 1
      ? 'Nails are consistent in size and drove cleanly into lumber with minimal bending.'
      : 'Good value per kilo and easy to sort by size for framing and carpentry tasks.';
  }

  if (type === 'screwdriver') {
    return variant === 1
      ? 'Useful bit selection and solid tips. It handled cabinet and fixture screws well.'
      : 'Handles are comfortable and torque transfer is good for tight screws.';
  }

  if (type === 'pliers') {
    return variant === 1
      ? 'Great grip in tight spaces and very precise on wire bends.'
      : 'Jaw alignment is good and the handles stay comfortable during repetitive tasks.';
  }

  if (type === 'pipe-bender') {
    return variant === 1
      ? 'Bends came out smooth with no kinks on copper tubing.'
      : 'Angle marks are readable and it is easy to hit repeat bends.';
  }

  if (type === 'plunger') {
    return variant === 1
      ? 'Seals well and clears sink clogs quickly with a few pushes.'
      : 'Durable rubber cup and sturdy handle, works reliably for bathroom drains.';
  }

  if (type === 'paint-liquid' || type === 'paint-tool') {
    return variant === 1
      ? 'Coverage was even and the finish looked consistent after two coats.'
      : 'Dry time matched the listing and cleanup was straightforward after use.';
  }

  if (type === 'pipe-tool' || type === 'plumbing-fixture') {
    return variant === 1
      ? 'Cuts were clean and fittings sealed well on first install.'
      : 'Build quality feels solid and it worked reliably during sink and line replacement.';
  }

  if (seed.category === 'Electrical') {
    return variant === 1
      ? 'Readings and output were stable, and setup was simple to follow.'
      : 'Reliable for regular maintenance checks and wiring tasks.';
  }

  return variant === 1
    ? 'Solid quality and dependable performance for day-to-day projects.'
    : 'Good value and durable construction for regular use.';
};

const getGeneratedSeedImages = (seed: ProductSeed): string[] => {
  return [
    getProductImageUrl(seed.id, seed.imageKeywords[0], 0),
    getProductImageUrl(seed.id, seed.imageKeywords[1] ?? seed.imageKeywords[0], 1),
    getProductImageUrl(seed.id, seed.imageKeywords[2] ?? seed.imageKeywords[0], 2),
  ];
};

const getSeedImages = (seed: ProductSeed): string[] => {
  const localBySku = localProductImagesBySku[seed.sku];
  if (localBySku && localBySku.length > 0) return [localBySku[0]];

  const local = localProductImages[seed.name];
  if (local && local.length > 0) return [local[0]];

  const generated = getGeneratedSeedImages(seed);
  return [generated[0]];
};

const buildReviews = (seed: ProductSeed, index: number) => [
  {
    id: `${seed.id}-rev-1`,
    user: {
      name: `Buyer ${index + 1}`,
      roleOrTag: 'Verified Purchase',
      avatarUrl: getAvatarUrl(`${seed.id}-a`),
    },
    rating: Number((4.2 + ((index % 6) * 0.1)).toFixed(1)),
    text: getReviewText(seed, 1),
    weeksAgo: (index % 4) + 1,
    photos: [getGeneratedSeedImages(seed)[1], getGeneratedSeedImages(seed)[2]],
  },
  {
    id: `${seed.id}-rev-2`,
    user: {
      name: `User ${index + 4}`,
      roleOrTag: 'Repeat Customer',
      avatarUrl: getAvatarUrl(`${seed.id}-b`),
    },
    rating: Number((4.1 + ((index % 5) * 0.1)).toFixed(1)),
    text: getReviewText(seed, 2),
    weeksAgo: (index % 5) + 2,
    photos: [getGeneratedSeedImages(seed)[0]],
  },
];

const draft = seeds.map((seed, index) => {
  const soldCount = 420 + index * 61;
  const images = getSeedImages(seed);

  return {
    ...seed,
    image: images[0],
    images,
    stock: 20 + ((index * 3) % 35),
    isActive: true,
    soldCount,
    soldCountText: toSoldText(soldCount),
    rating: Number((4.1 + ((index % 8) * 0.1)).toFixed(1)),
    codAvailable: index % 6 !== 0,
    description: getDescription(seed),
    keyFeatures: getFeatures(seed),
    whatsIncluded: getIncluded(seed),
    specs: getSpecs(seed),
    reviews: buildReviews(seed, index),
    recommendations: [],
  };
});

export const products = draft.map((item, index, all) => {
  const sameCategory = all.filter((p) => p.category === item.category && p.id !== item.id).slice(0, 3);
  const crossCategory = [all[(index + 5) % all.length], all[(index + 11) % all.length]];
  const recommendations = [...sameCategory, ...crossCategory]
    .map((p) => p.id)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .slice(0, 5);

  return {
    ...item,
    recommendations,
  };
});
