import axios from 'axios';

const WB_BASE = 'https://api.worldbank.org/v2/country/WLD/indicator';

const INDICATORS = {
  GDP: 'NY.GDP.MKTP.KD.ZG',
  CO2: 'EN.GHG.CO2.AG.MT.CE.AR5',
  AGRI: 'AG.LND.AGRI.ZS',
};

async function fetchIndicator(indicator) {
  const url = `${WB_BASE}/${indicator}?format=json&per_page=100&mrv=60`;
  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Unexpected World Bank API response');
  }
  const records = data[1] || [];
  return records
    .filter((r) => r.value !== null)
    .map((r) => ({ year: parseInt(r.date, 10), value: parseFloat(r.value) }))
    .sort((a, b) => a.year - b.year);
}

export async function fetchGDP() {
  return fetchIndicator(INDICATORS.GDP);
}

export async function fetchCO2() {
  return fetchIndicator(INDICATORS.CO2);
}

export async function fetchAgriLand() {
  return fetchIndicator(INDICATORS.AGRI);
}

export const DOW_TOP_10 = [
  { name: 'Apple', percentage: 9.2 },
  { name: 'UnitedHealth', percentage: 7.7 },
  { name: 'Home Depot', percentage: 6.6 },
  { name: 'Goldman Sachs', percentage: 5.4 },
  { name: 'Microsoft', percentage: 5.2 },
  { name: 'Visa', percentage: 5.1 },
  { name: 'Boeing', percentage: 5.1 },
  { name: "McDonald's", percentage: 5.0 },
  { name: '3M Co', percentage: 4.2 },
  { name: 'J&J', percentage: 3.6 },
];

export const CO2_DESCRIPTION = `Carbon dioxide (CO₂) emissions are largely by-products of energy production and use, accounting for the largest share of greenhouse gases associated with global warming.

Anthropogenic CO₂ emissions result primarily from fossil fuel combustion and cement manufacturing:
• Oil releases ~50% more CO₂ than natural gas
• Coal releases ~twice as much CO₂ as natural gas
• Cement manufacturing releases ~0.5 metric tons of CO₂ per metric ton produced

Data includes gases from burning fossil fuels and cement manufacture, but excludes land-use emissions such as deforestation.

Source: World Bank – World Development Indicators (EN.ATM.CO2E.PC)`;
