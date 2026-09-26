import {
  ALLERGENS,
  DIETARY_TAGS,
  OTHER_AVOIDS,
  type Allergen,
  type DietaryTag,
  type OtherAvoid,
} from "@/lib/allergens";
import type { MenuItem } from "@/types/menu";

/** The spreadsheet's columns, in order. Only "name" is required when importing. */
export const CSV_COLUMNS = [
  "id",
  "section",
  "name",
  "description",
  "price",
  "calories",
  "spice",
  "allergens",
  "may_contain",
  "can_leave_out",
  "also_contains",
  "diet_labels",
  "notes",
  "special",
  "confirmed",
] as const;

export const MAX_IMPORT_ROWS = 1000;

// ---------------------------------------------------------------------------------------------
// Writing

/**
 * Spreadsheet apps run cells that start with these as formulas, so a dish name like
 * "=HYPERLINK(...)" could do something when opened. A leading apostrophe keeps it as text.
 */
function safeCell(value: string): string {
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const list = (values: readonly string[] | undefined) => (values ?? []).join("; ");
const yesNo = (value: boolean | undefined) => (value ? "yes" : "no");

/** The whole menu as a CSV file that Excel and Google Sheets open correctly. */
export function menuToCsv(dishes: MenuItem[]): string {
  const rows = dishes.map((dish) => [
    dish.id,
    dish.section ?? "",
    dish.name,
    dish.description,
    dish.price,
    dish.calories == null ? "" : String(dish.calories),
    dish.spice == null ? "" : String(dish.spice),
    list(dish.allergens),
    list(dish.may_contain),
    list(dish.removable),
    list(dish.also_contains),
    list(dish.dietary_tags),
    dish.notes,
    yesNo(dish.special),
    yesNo(dish.confirmed),
  ]);
  const lines = [[...CSV_COLUMNS], ...rows].map((row) => row.map(safeCell).join(","));
  // The byte order mark tells Excel the file is UTF-8, so accents and other scripts survive.
  return `﻿${lines.join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------------------------------------
// Reading

/** Splits CSV text into rows of cells, following the usual quoting rules. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Blank lines, like the one many apps add at the end, aren't rows.
  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

/** One spreadsheet row. Fields are undefined when the column isn't in the file. */
export type ImportRow = {
  line: number;
  id?: string;
  section?: string;
  name: string;
  description?: string;
  price?: string;
  calories?: number | null;
  spice?: number | null;
  allergens?: Allergen[];
  may_contain?: Allergen[];
  removable?: Allergen[];
  also_contains?: OtherAvoid[];
  dietary_tags?: DietaryTag[];
  notes?: string;
  special?: boolean;
};

export type ImportProblem = { line: number; message: string };

/** The words for problems in a file, so the dashboard can show them in the owner's language. */
export type ImportMessages = {
  empty: string;
  noName: string;
  tooMany: string;
  needsName: string;
  tooLong: string;
  notNumber: string;
  calories: string;
  spice: string;
  unknown: string;
  allergen: string;
  item: string;
  diet: string;
};

const ENGLISH: ImportMessages = {
  empty: "The file is empty.",
  noName: "There's no “name” column.",
  tooMany: "A spreadsheet can have up to {max} dishes.",
  needsName: "Every dish needs a name.",
  tooLong: "The {field} is longer than {max} characters.",
  notNumber: "{what} should be a whole number from {min} to {max}.",
  calories: "Calories",
  spice: "Spice",
  unknown: "Unknown {what} “{value}”.",
  allergen: "allergen",
  item: "item",
  diet: "diet label",
};

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );

const HEADER_ALIASES: Record<string, (typeof CSV_COLUMNS)[number]> = {
  dish: "name",
  dish_name: "name",
  heading: "section",
  category: "section",
  contains: "allergens",
  can_be_left_out: "can_leave_out",
  removable: "can_leave_out",
  diet: "diet_labels",
  dietary_tags: "diet_labels",
  tags: "diet_labels",
  kitchen_notes: "notes",
};

function columnFor(header: string): (typeof CSV_COLUMNS)[number] | null {
  const key = header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if ((CSV_COLUMNS as readonly string[]).includes(key)) return key as (typeof CSV_COLUMNS)[number];
  return HEADER_ALIASES[key] ?? null;
}

function readList<T extends string>(
  value: string,
  allowed: readonly T[],
  what: string,
  line: number,
  problems: ImportProblem[],
  messages: ImportMessages,
): T[] {
  const found: T[] = [];
  for (const raw of value.split(/[;,]/)) {
    const item = raw.trim().toLowerCase();
    if (!item) continue;
    if ((allowed as readonly string[]).includes(item)) {
      if (!found.includes(item as T)) found.push(item as T);
    } else {
      problems.push({ line, message: fill(messages.unknown, { what, value: raw.trim() }) });
    }
  }
  return found;
}

function readNumber(
  value: string,
  min: number,
  max: number,
  what: string,
  line: number,
  problems: ImportProblem[],
  messages: ImportMessages,
): number | null | undefined {
  const text = value.trim().replace(/,/g, "");
  if (text === "") return null;
  const number = Number(text);
  if (!Number.isInteger(number) || number < min || number > max) {
    problems.push({ line, message: fill(messages.notNumber, { what, min, max }) });
    return undefined;
  }
  return number;
}

const LIMITS = { name: 120, section: 80, description: 500, price: 20, notes: 2000 } as const;

/** Reads an uploaded spreadsheet into rows, listing anything it couldn't understand. */
export function readImport(
  text: string,
  messages: ImportMessages = ENGLISH,
): { rows: ImportRow[]; problems: ImportProblem[] } {
  const problems: ImportProblem[] = [];
  const [header, ...body] = parseCsv(text);
  if (!header) return { rows: [], problems: [{ line: 1, message: messages.empty }] };
  const columns = header.map(columnFor);
  if (!columns.includes("name")) {
    return { rows: [], problems: [{ line: 1, message: messages.noName }] };
  }
  if (body.length > MAX_IMPORT_ROWS) {
    return {
      rows: [],
      problems: [{ line: 1, message: fill(messages.tooMany, { max: MAX_IMPORT_ROWS }) }],
    };
  }

  const rows: ImportRow[] = [];
  body.forEach((cells, index) => {
    const line = index + 2;
    const cell = (column: (typeof CSV_COLUMNS)[number]) => {
      const at = columns.indexOf(column);
      // A leading apostrophe is how spreadsheets keep text from being read as a formula.
      return at === -1 ? undefined : (cells[at] ?? "").trim().replace(/^'(?=[=+\-@])/, "");
    };
    const before = problems.length;
    const name = cell("name") ?? "";
    if (!name) problems.push({ line, message: messages.needsName });
    for (const field of ["name", "section", "description", "price", "notes"] as const) {
      const value = cell(field);
      if (value !== undefined && value.length > LIMITS[field]) {
        problems.push({
          line,
          message: fill(messages.tooLong, { field, max: LIMITS[field] }),
        });
      }
    }
    const row: ImportRow = { line, name };
    const id = cell("id");
    if (id) row.id = id;
    const text = (field: "section" | "description" | "price" | "notes") => {
      const value = cell(field);
      if (value !== undefined) row[field] = value;
    };
    text("section");
    text("description");
    text("price");
    text("notes");
    const calories = cell("calories");
    if (calories !== undefined) {
      const value = readNumber(calories, 0, 5000, messages.calories, line, problems, messages);
      if (value !== undefined) row.calories = value;
    }
    const spice = cell("spice");
    if (spice !== undefined) {
      const value = readNumber(spice, 0, 3, messages.spice, line, problems, messages);
      if (value !== undefined) row.spice = value;
    }
    const allergens = cell("allergens");
    if (allergens !== undefined)
      row.allergens = readList(allergens, ALLERGENS, messages.allergen, line, problems, messages);
    const mayContain = cell("may_contain");
    if (mayContain !== undefined)
      row.may_contain = readList(
        mayContain,
        ALLERGENS,
        messages.allergen,
        line,
        problems,
        messages,
      );
    const removable = cell("can_leave_out");
    if (removable !== undefined)
      row.removable = readList(removable, ALLERGENS, messages.allergen, line, problems, messages);
    const also = cell("also_contains");
    if (also !== undefined)
      row.also_contains = readList(also, OTHER_AVOIDS, messages.item, line, problems, messages);
    const tags = cell("diet_labels");
    if (tags !== undefined)
      row.dietary_tags = readList(tags, DIETARY_TAGS, messages.diet, line, problems, messages);
    const special = cell("special");
    if (special !== undefined) row.special = /^(yes|y|true|1|x)$/i.test(special);
    if (problems.length === before) rows.push(row);
  });
  return { rows, problems };
}

// ---------------------------------------------------------------------------------------------
// Planning

/** A dish with a spreadsheet row's values applied; columns missing from the file stay as they were. */
export function applyRow(dish: MenuItem, row: ImportRow): MenuItem {
  const allergens = row.allergens ?? dish.allergens;
  return {
    ...dish,
    name: row.name,
    section: row.section ?? dish.section,
    description: row.description ?? dish.description,
    price: row.price ?? dish.price,
    calories: row.calories !== undefined ? row.calories : dish.calories,
    spice: row.spice !== undefined ? row.spice : dish.spice,
    allergens,
    // Kept consistent with the dish's own allergens, as the database requires.
    removable: (row.removable ?? dish.removable ?? []).filter((a) => allergens.includes(a)),
    may_contain: (row.may_contain ?? dish.may_contain ?? []).filter((a) => !allergens.includes(a)),
    also_contains: row.also_contains ?? dish.also_contains ?? [],
    dietary_tags: row.dietary_tags ?? dish.dietary_tags,
    notes: row.notes ?? dish.notes,
    special: row.special ?? dish.special,
  };
}

const COMPARED = [
  "name",
  "section",
  "description",
  "price",
  "calories",
  "spice",
  "allergens",
  "may_contain",
  "removable",
  "also_contains",
  "dietary_tags",
  "notes",
  "special",
] as const;

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export type ImportPlan = {
  add: ImportRow[];
  change: { dish: MenuItem; updated: MenuItem; fields: string[] }[];
  unchanged: number;
};

/**
 * What importing would do: rows with the id of an existing dish update it, other rows add new
 * dishes. Dishes missing from the spreadsheet are left alone.
 */
export function planImport(rows: ImportRow[], existing: MenuItem[]): ImportPlan {
  const byId = new Map(existing.map((dish) => [dish.id, dish]));
  const plan: ImportPlan = { add: [], change: [], unchanged: 0 };
  const seen = new Set<string>();
  for (const row of rows) {
    const dish = row.id && !seen.has(row.id) ? byId.get(row.id) : undefined;
    if (!dish) {
      plan.add.push(row);
      continue;
    }
    seen.add(dish.id);
    const updated = applyRow(dish, row);
    const fields = COMPARED.filter((field) => !same(dish[field], updated[field]));
    if (fields.length === 0) plan.unchanged++;
    else plan.change.push({ dish, updated: { ...updated, confirmed: false }, fields });
  }
  return plan;
}
