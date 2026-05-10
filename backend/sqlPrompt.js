const COLUMN_DESCRIPTIONS = {
  facility_name: 'Data center or project name. High-cardinality text.',
  address: 'Street address or site description. High-cardinality text.',
  city: 'City or locality. High-cardinality text.',
  state: 'Two-letter US state abbreviation, such as IL or VA.',
  zip: 'ZIP code as text.',
  county: 'County name. High-cardinality text.',
  lat: 'Latitude as numeric-looking text.',
  long: 'Longitude as numeric-looking text.',
  status: 'Project status. Categorical text.',
  location_confidence: 'Confidence in mapped location. Categorical text.',
  purpose: 'Reported purpose, such as AI, cloud, or crypto. Categorical/free text.',
  operator_name: 'Company or organization operating/developing the facility. High-cardinality text.',
  tenant: 'Known tenant or customer. Categorical/free text.',
  mw: 'Power capacity in megawatts, stored as messy numeric-looking text.',
  sizerank: 'Size category. Categorical text.',
  power_source: 'Reported power source. Categorical/free text.',
  dedicated_power_plant: 'Dedicated power plant notes. Free text.',
  number_of_generators: 'Generator count or notes. Numeric-looking/free text.',
  number_of_buildings: 'Building count or notes. Numeric-looking/free text.',
  cooling_source: 'Cooling source. Categorical text.',
  cooling_type: 'Cooling technology/type. Categorical text.',
  facility_size_sqft: 'Facility size in square feet, stored as messy numeric-looking text.',
  property_size_acres: 'Property size in acres, stored as messy numeric-looking text.',
  project_cost: 'Reported project cost. Money-like text.',
  expected_date_online: 'Expected online date or year. Date-like text.',
  community_pushback: 'Known community pushback. Blank means unknown, not necessarily no.',
  advocacy_information: 'Community advocacy notes. Free text.',
  resistance_status: 'Community resistance status. Categorical text.',
  nda: 'NDA or secrecy notes. Free text.',
  community_group_website_1: 'Community group website URL.',
  community_group_website_2: 'Second community group website URL.',
  petition_url: 'Petition URL.',
  other_info: 'Additional notes. Free text.',
  information_source: 'Broad source type. Categorical text.',
  info_source_1: 'Source URL or citation.',
  info_source_2: 'Source URL or citation.',
  info_source_3: 'Source URL or citation.',
  info_source_4: 'Source URL or citation.',
  info_source_5: 'Source URL or citation.',
  info_source_6: 'Source URL or citation.',
  info_source_7: 'Source URL or citation.',
  info_source_8: 'Source URL or citation.',
  date_created: 'Record creation date. Date-like text.',
  date_updated: 'Record update date. Date-like text.',
};

const DERIVED_COLUMN_DESCRIPTIONS = {
  lat_num: 'Parsed numeric latitude derived from lat. Use for coordinate comparisons.',
  long_num: 'Parsed numeric longitude derived from long. Use for coordinate comparisons.',
  mw_min: 'Parsed minimum megawatts derived from mw. Use for numeric MW filters and sorting.',
  mw_max: 'Parsed maximum megawatts derived from mw. Use for numeric MW filters and sorting.',
  facility_size_sqft_num: 'Parsed square footage derived from facility_size_sqft. Use for numeric size filters and sorting.',
  property_size_acres_num: 'Parsed acres derived from property_size_acres. Use for numeric land-size filters and sorting.',
  project_cost_min: 'Parsed minimum project cost in dollars derived from project_cost. Use for numeric cost filters and sorting.',
  project_cost_max: 'Parsed maximum project cost in dollars derived from project_cost. Use for numeric cost filters and sorting.',
  expected_year_min: 'Parsed earliest expected online year derived from expected_date_online.',
  expected_year_max: 'Parsed latest expected online year derived from expected_date_online.',
  date_created_iso: 'Parsed ISO date derived from date_created, formatted YYYY-MM-DD.',
  date_updated_iso: 'Parsed ISO date derived from date_updated, formatted YYYY-MM-DD.',
  number_of_buildings_min: 'Parsed minimum building count derived from number_of_buildings. Sparse and approximate.',
  number_of_buildings_max: 'Parsed maximum building count derived from number_of_buildings. Sparse and approximate.',
};

const STATE_GUIDE = `
State names should be converted to two-letter abbreviations:
Alabama AL, Alaska AK, Arizona AZ, Arkansas AR, California CA, Colorado CO,
Connecticut CT, Delaware DE, Florida FL, Georgia GA, Idaho ID, Illinois IL,
Indiana IN, Iowa IA, Kansas KS, Kentucky KY, Louisiana LA, Maine ME,
Maryland MD, Massachusetts MA, Michigan MI, Minnesota MN, Mississippi MS,
Missouri MO, Montana MT, Nebraska NE, Nevada NV, New Hampshire NH,
New Jersey NJ, New Mexico NM, New York NY, North Carolina NC, North Dakota ND,
Ohio OH, Oklahoma OK, Oregon OR, Pennsylvania PA, South Carolina SC,
South Dakota SD, Tennessee TN, Texas TX, Utah UT, Vermont VT, Virginia VA,
Washington WA, West Virginia WV, Wisconsin WI, Wyoming WY.
`;

export const EXAMPLE_VALUE_LIMIT = 8;

export const LOW_CARDINALITY_COLUMNS = [
  'status',
  'location_confidence',
  'purpose',
  'tenant',
  'sizerank',
  'power_source',
  'cooling_source',
  'cooling_type',
  'community_pushback',
  'resistance_status',
  'information_source',
];

export const EXAMPLE_COLUMNS = [
  'facility_name',
  'city',
  'county',
  'operator_name',
];

export const MESSY_EXAMPLE_COLUMNS = [
  'mw',
  'project_cost',
  'expected_date_online',
  'number_of_buildings',
  'number_of_generators',
];

function getUniqueValues(rows, column) {
  return [...new Set(rows.map((row) => row[column]).filter(Boolean))];
}

function getValues(rows, column) {
  return getUniqueValues(rows, column).join(', ');
}

function getExampleValues(rows, column) {
  return getUniqueValues(rows, column).slice(0, EXAMPLE_VALUE_LIMIT).join(', ');
}

function getSparseColumns(rows, columns, missingStats) {
  return columns
    .map((column) => ({
      column,
      stats: missingStats[column],
    }))
    .filter(({ stats }) => stats && stats.missing / rows.length > 0.5)
    .map(({ column, stats }) => `- ${column}: ${stats.nonEmpty} non-empty / ${stats.total} rows`)
    .join('\n');
}

export function buildSqlPrompt({ rows, columns, derivedColumns, missingStats }) {
  const columnLines = columns
    .map((column) => `- ${column}: ${COLUMN_DESCRIPTIONS[column] || 'Text column.'}`)
    .join('\n');

  const derivedColumnLines = derivedColumns
    .map((column) => `- ${column.name} (${column.type}): ${DERIVED_COLUMN_DESCRIPTIONS[column.name]}`)
    .join('\n');

  const valueLines = LOW_CARDINALITY_COLUMNS
    .map((column) => `- ${column}: ${getValues(rows, column) || 'mostly blank'}`)
    .join('\n');

  const exampleLines = EXAMPLE_COLUMNS
    .map((column) => `- ${column}: ${getExampleValues(rows, column)}`)
    .join('\n');

  const messyExampleLines = MESSY_EXAMPLE_COLUMNS
    .map((column) => `- ${column}: ${getExampleValues(rows, column)}`)
    .join('\n');

  const sparseLines = getSparseColumns(rows, columns, missingStats);

  return `
You generate SQLite SELECT queries for a data center dataset.
Return JSON only, in this exact shape: {"sql":"SELECT ..."}
If the user's question is not about this dataset, return {"sql":null}.

Rules:
- Use only the table data_centers.
- Generate exactly one read-only SELECT query.
- Do not use SELECT *. Select only the columns relevant to the user's question.
- Use exact column names.
- For counts, use COUNT(*) AS count.
- Use case-insensitive matching for names and text, like LOWER(city) LIKE '%ashburn%'.
- Blanks mean unknown or missing, not necessarily no.
- Original CSV columns are stored as TEXT.
- Numeric/date helper columns are derived from the original CSV values. Prefer these helper columns for numeric and date questions, but select the original text column too when showing reported values.
- number_of_generators is not parsed because it mixes generator counts and power-capacity text.

${STATE_GUIDE}

Original CSV columns:
${columnLines}

Derived helper columns:
${derivedColumnLines}

Categorical values:
${valueLines}

Example high-cardinality values:
${exampleLines}

Messy numeric-like examples:
${messyExampleLines}

Sparse columns with many missing values:
${sparseLines}
`.trim();
}
