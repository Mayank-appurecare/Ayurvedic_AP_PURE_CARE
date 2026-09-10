// Rewrites src/data/indianCities.ts as a state -> cities map.
//
// Validates before writing: every city from the old flat list must be placed
// exactly once, every state key must exist in indianStates.ts, and no state may
// be left without at least one city.

import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'C:/Users/Sumiran/Downloads/Ayurvedic_AP_PURE_CARE-main/Ayurvedic_AP_PURE_CARE-main';

const oldSrc = readFileSync(`${ROOT}/src/data/indianCities.ts`, 'utf8');
const OLD_CITIES = [...oldSrc.matchAll(/^\s*'([^']+)',?\s*$/gm)].map((m) => m[1]);

const statesSrc = readFileSync(`${ROOT}/src/data/indianStates.ts`, 'utf8');
const STATES = [...statesSrc.matchAll(/^\s*'([^']+)',?\s*$/gm)].map((m) => m[1]);

/**
 * Every city in the previous flat list, placed under the state it belongs to.
 * Goa and Meghalaya had no city at all in that list, so their capitals are
 * added — otherwise picking either state would offer nothing.
 */
const BY_STATE = {
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Rajahmundry',
    'Kurnool',
    'Kadapa',
    'Kakinada',
    'Eluru',
  ],
  'Arunachal Pradesh': ['Itanagar'],
  Assam: ['Guwahati'],
  Bihar: ['Patna', 'Bhagalpur', 'Muzaffarpur', 'Bihar Sharif', 'Darbhanga', 'Purnia'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur'],
  Goa: ['Panaji', 'Margao'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh'],
  Haryana: [
    'Faridabad',
    'Gurugram',
    'Rohtak',
    'Hisar',
    'Panipat',
    'Karnal',
    'Sonipat',
    'Panchkula',
  ],
  'Himachal Pradesh': ['Shimla'],
  Jharkhand: ['Ranchi', 'Dhanbad', 'Jamshedpur', 'Bokaro'],
  Karnataka: [
    'Bengaluru',
    'Hubballi-Dharwad',
    'Mysuru',
    'Mangaluru',
    'Belagavi',
    'Gulbarga',
    'Bellary',
    'Bijapur',
    'Shimoga',
    'Tumkur',
  ],
  Kerala: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur'],
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagar',
    'Dewas',
    'Satna',
    'Rewa',
    'Ratlam',
  ],
  Maharashtra: [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Thane',
    'Pimpri-Chinchwad',
    'Nashik',
    'Kalyan-Dombivli',
    'Vasai-Virar',
    'Aurangabad',
    'Navi Mumbai',
    'Solapur',
    'Bhiwandi',
    'Amravati',
    'Nanded',
    'Kolhapur',
    'Akola',
    'Ulhasnagar',
    'Latur',
    'Dhule',
    'Ahmednagar',
    'Satara',
    'Chandrapur',
    'Parbhani',
    'Jalna',
    'Ichalkaranji',
  ],
  Manipur: ['Imphal'],
  Meghalaya: ['Shillong'],
  Mizoram: ['Aizawl'],
  Nagaland: ['Kohima'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Gopalpur'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  Rajasthan: [
    'Jaipur',
    'Jodhpur',
    'Kota',
    'Bikaner',
    'Ajmer',
    'Bhilwara',
    'Alwar',
    'Sikar',
    'Pali',
  ],
  Sikkim: ['Gangtok'],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tiruppur',
    'Erode',
    'Avadi',
    'Ambattur',
  ],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad'],
  Tripura: ['Agartala'],
  'Uttar Pradesh': [
    'Lucknow',
    'Kanpur',
    'Ghaziabad',
    'Agra',
    'Meerut',
    'Varanasi',
    'Allahabad',
    'Bareilly',
    'Aligarh',
    'Saharanpur',
    'Gorakhpur',
    'Noida',
    'Firozabad',
    'Loni',
    'Jhansi',
    'Muzaffarnagar',
    'Mathura',
    'Shahjahanpur',
    'Rampur',
    'Farrukhabad',
    'Mau',
  ],
  Uttarakhand: ['Dehradun'],
  'West Bengal': [
    'Kolkata',
    'Howrah',
    'Durgapur',
    'Asansol',
    'Siliguri',
    'South Dumdum',
    'Bhatpara',
    'Panihati',
    'Kamarhati',
    'Bardhaman',
    'Kulti',
    'Barasat',
    'Bally',
  ],
  'Andaman and Nicobar Islands': ['Port Blair'],
  Chandigarh: ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman'],
  Delhi: ['Delhi', 'Kirari Suleman Nagar'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  Ladakh: ['Leh'],
  Lakshadweep: ['Kavaratti'],
  Puducherry: ['Puducherry', 'Ozhukarai'],
};

// --- validation -------------------------------------------------------------
const problems = [];

for (const state of Object.keys(BY_STATE)) {
  if (!STATES.includes(state)) problems.push(`unknown state key: ${state}`);
}
for (const state of STATES) {
  if (!BY_STATE[state]?.length) problems.push(`state with no cities: ${state}`);
}

const placed = Object.values(BY_STATE).flat();
const placedSet = new Set(placed);
if (placedSet.size !== placed.length) {
  const dupes = placed.filter((c, i) => placed.indexOf(c) !== i);
  problems.push(`city placed twice: ${[...new Set(dupes)].join(', ')}`);
}
const missing = OLD_CITIES.filter((c) => !placedSet.has(c));
if (missing.length) problems.push(`city from the old list not placed: ${missing.join(', ')}`);

const added = placed.filter((c) => !OLD_CITIES.includes(c));

if (problems.length) {
  console.log('VALIDATION FAILED — nothing written:');
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}

// --- emit -------------------------------------------------------------------
const entries = Object.keys(BY_STATE)
  .sort((a, b) => a.localeCompare(b))
  .map((state) => {
    const key = /^[A-Za-z][A-Za-z0-9]*$/.test(state) ? state : `'${state}'`;
    const cities = [...BY_STATE[state]].sort((a, b) => a.localeCompare(b));
    return `  ${key}: [\n${cities.map((c) => `    '${c}',`).join('\n')}\n  ],`;
  })
  .join('\n');

const file = `// Major Indian cities, grouped by the state they belong to.
//
// Not exhaustive — India has thousands of towns — so the city picker also lets
// the customer confirm whatever they have typed if their city is not listed.
//
// Grouping matters for correctness, not just convenience: with one flat list a
// customer could pick Kerala and then Ludhiana, and the address would be
// undeliverable. The picker now offers only the cities of the chosen state.
//
// Both the state keys and the cities inside each are sorted alphabetically.

export const CITIES_BY_STATE: Record<string, string[]> = {
${entries}
};

/** Every city, alphabetically — used when no state has been chosen yet. */
export const INDIAN_CITIES: string[] = Object.values(CITIES_BY_STATE)
  .flat()
  .sort((a, b) => a.localeCompare(b));

/** Cities of one state, or the whole list when the state is unknown/unset. */
export function citiesForState(state: string | undefined | null): string[] {
  if (!state) return INDIAN_CITIES;
  return CITIES_BY_STATE[state] ?? INDIAN_CITIES;
}
`;

writeFileSync(`${ROOT}/src/data/indianCities.ts`, file);

console.log('validation passed, file written');
console.log(`  states covered : ${Object.keys(BY_STATE).length} / ${STATES.length}`);
console.log(`  cities placed  : ${placed.length} (was ${OLD_CITIES.length})`);
console.log(`  newly added    : ${added.length ? added.join(', ') : 'none'}`);
