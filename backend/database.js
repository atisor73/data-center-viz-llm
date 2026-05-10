import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { csvParse } from 'd3';

const DERIVED_COLUMNS = [
  { name: 'lat_num', type: 'REAL' },
  { name: 'long_num', type: 'REAL' },
  { name: 'mw_min', type: 'REAL' },
  { name: 'mw_max', type: 'REAL' },
  { name: 'facility_size_sqft_num', type: 'REAL' },
  { name: 'property_size_acres_num', type: 'REAL' },
  { name: 'project_cost_min', type: 'REAL' },
  { name: 'project_cost_max', type: 'REAL' },
  { name: 'expected_year_min', type: 'INTEGER' },
  { name: 'expected_year_max', type: 'INTEGER' },
  { name: 'date_created_iso', type: 'TEXT' },
  { name: 'date_updated_iso', type: 'TEXT' },
  { name: 'number_of_buildings_min', type: 'REAL' },
  { name: 'number_of_buildings_max', type: 'REAL' },
];

const UNKNOWN_AS_MISSING_COLUMNS = new Set([
  'community_pushback',
  'sizerank',
]);

export const DERIVED_TO_SOURCE_COLUMN = {
  lat_num: 'lat',
  long_num: 'long',
  mw_min: 'mw',
  mw_max: 'mw',
  facility_size_sqft_num: 'facility_size_sqft',
  property_size_acres_num: 'property_size_acres',
  project_cost_min: 'project_cost',
  project_cost_max: 'project_cost',
  expected_year_min: 'expected_date_online',
  expected_year_max: 'expected_date_online',
  date_created_iso: 'date_created',
  date_updated_iso: 'date_updated',
  number_of_buildings_min: 'number_of_buildings',
  number_of_buildings_max: 'number_of_buildings',
};

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeOriginalValue(column, value) {
  const text = String(value || '').trim();

  if (UNKNOWN_AS_MISSING_COLUMNS.has(column) && text.toLowerCase() === 'unknown') {
    return null;
  }

  return text || null;
}

function parseFloatValue(value) {
  const parsed = Number(String(value || '').replaceAll(',', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function extractNumbers(value) {
  return [...String(value || '').replaceAll(',', '').matchAll(/\d*\.?\d+/g)]
    .map((match) => Number(match[0]))
    .filter(Number.isFinite);
}

function parseNumberRange(value) {
  const numbers = extractNumbers(value);
  if (!numbers.length) {
    return [null, null];
  }

  return [numbers[0], numbers.length > 1 ? numbers[1] : numbers[0]];
}

function parseMoneyRange(value) {
  const text = String(value || '').toLowerCase();
  const multiplier = text.includes('billion')
    ? 1_000_000_000
    : text.includes('million')
      ? 1_000_000
      : 1;
  const [min, max] = parseNumberRange(text);

  return [
    min === null ? null : min * multiplier,
    max === null ? null : max * multiplier,
  ];
}

function parseYearRange(value) {
  const matches = [...String(value || '').matchAll(/\b20\d{2}\b|\b\d{2}\b/g)]
    .map((match) => Number(match[0]))
    .map((year) => year < 100 ? 2000 + year : year)
    .filter((year) => year >= 2000 && year <= 2100);

  if (!matches.length) {
    return [null, null];
  }

  return [Math.min(...matches), Math.max(...matches)];
}

function parseIsoDate(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10) === iso ? iso : null;
}

function parseBuildingRange(value) {
  const text = String(value || '').toLowerCase();

  if (!text || text === 'multiple') {
    return [null, null];
  }

  const largeSmall = text.match(/(\d+)\s+large,\s*(\d+)\s+small/);
  if (largeSmall) {
    const total = Number(largeSmall[1]) + Number(largeSmall[2]);
    return [total, total];
  }

  return parseNumberRange(text);
}

function getDerivedValues(row) {
  const [mwMin, mwMax] = parseNumberRange(row.mw);
  const [projectCostMin, projectCostMax] = parseMoneyRange(row.project_cost);
  const [expectedYearMin, expectedYearMax] = parseYearRange(row.expected_date_online);
  const [numberOfBuildingsMin, numberOfBuildingsMax] = parseBuildingRange(row.number_of_buildings);

  return {
    lat_num: parseFloatValue(row.lat),
    long_num: parseFloatValue(row.long),
    mw_min: mwMin,
    mw_max: mwMax,
    facility_size_sqft_num: parseFloatValue(row.facility_size_sqft),
    property_size_acres_num: parseFloatValue(row.property_size_acres),
    project_cost_min: projectCostMin,
    project_cost_max: projectCostMax,
    expected_year_min: expectedYearMin,
    expected_year_max: expectedYearMax,
    date_created_iso: parseIsoDate(row.date_created),
    date_updated_iso: parseIsoDate(row.date_updated),
    number_of_buildings_min: numberOfBuildingsMin,
    number_of_buildings_max: numberOfBuildingsMax,
  };
}

function getMissingStats(rows, columns) {
  return Object.fromEntries(columns.map((column) => {
    const missing = rows.filter((row) => !row[column]).length;
    return [column, {
      missing,
      nonEmpty: rows.length - missing,
      total: rows.length,
      missingRatio: missing / rows.length,
    }];
  }));
}

export function loadDataCenters(dataPath) {
  const csv = readFileSync(dataPath, 'utf8');
  const rows = csvParse(csv);
  const columns = rows.columns;
  const normalizedRows = rows.map((row) => Object.fromEntries(
    columns.map((column) => [column, normalizeOriginalValue(column, row[column])]),
  ));
  const derivedColumnNames = DERIVED_COLUMNS.map((column) => column.name);
  const allColumns = [...columns, ...derivedColumnNames];
  const db = new DatabaseSync(':memory:');
  const originalColumnSql = columns.map((column) => `${quoteIdentifier(column)} TEXT`);
  const derivedColumnSql = DERIVED_COLUMNS.map((column) => `${quoteIdentifier(column.name)} ${column.type}`);
  const columnSql = [...originalColumnSql, ...derivedColumnSql].join(', ');

  db.exec(`CREATE TABLE data_centers (${columnSql})`);

  const placeholders = allColumns.map(() => '?').join(', ');
  const insert = db.prepare(
    `INSERT INTO data_centers (${allColumns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders})`,
  );

  for (const row of normalizedRows) {
    const derivedValues = getDerivedValues(row);
    insert.run(
      ...columns.map((column) => row[column]),
      ...derivedColumnNames.map((column) => derivedValues[column]),
    );
  }

  return {
    db,
    rows: normalizedRows,
    columns,
    derivedColumns: DERIVED_COLUMNS,
    missingStats: getMissingStats(normalizedRows, columns),
  };
}
