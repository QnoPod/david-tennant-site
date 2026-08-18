import fs from "node:fs/promises";
import path from "node:path";

const DATA_FILE = path.resolve(
  process.cwd(),
  "app/data/autoConventionHistory.json",
);
const SNAPSHOT_URL = process.env.CONVENTION_SNAPSHOT_URL;
const CRON_SECRET = process.env.CRON_SECRET;
const TODAY = new Date().toISOString().slice(0, 10);

function normalize(value = "") {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[()\[\]{}–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidEventName(value = "") {
  const normalized = normalize(value);
  return Boolean(normalized)
    && !/^(?:site|website|official site|official website)$/.test(normalized);
}

function identity(event) {
  return `${normalize(event.name)}::${event.date}`;
}

async function loadPrevious() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function fetchSnapshot() {
  if (!SNAPSHOT_URL) throw new Error("CONVENTION_SNAPSHOT_URL is not configured.");
  if (!CRON_SECRET) throw new Error("CRON_SECRET is not configured.");

  const response = await fetch(SNAPSHOT_URL, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  if (!response.ok) throw new Error(`Convention snapshot failed: ${response.status}`);
  const body = await response.json();
  if (!body?.ok || !Array.isArray(body.events)) throw new Error("Invalid convention snapshot response.");
  return body.events;
}

function mergeCancelled(previous, currentEvents) {
  const merged = new Map(
    previous
      .filter((event) => isValidEventName(event.name))
      .map((event) => [identity(event), event]),
  );

  for (const event of currentEvents) {
    if (event.status !== "cancelled") continue;
    const key = identity(event);
    const old = merged.get(key);
    merged.set(key, {
      ...old,
      ...event,
      status: "cancelled",
      isHistorical: true,
      updatedAt: old?.updatedAt || event.updatedAt || TODAY,
    });
  }

  return [...merged.values()].sort((a, b) => {
    const left = a.appearanceDate || a.updatedAt || "0000-00-00";
    const right = b.appearanceDate || b.updatedAt || "0000-00-00";
    return right.localeCompare(left) || b.date.localeCompare(a.date);
  });
}

const previous = await loadPrevious();
const currentEvents = await fetchSnapshot();
const next = mergeCancelled(previous, currentEvents);
const serialized = `${JSON.stringify(next, null, 2)}\n`;
const oldSerialized = `${JSON.stringify(previous, null, 2)}\n`;

if (serialized === oldSerialized) {
  console.log("No convention cancellation changes.");
  process.exit(0);
}

await fs.writeFile(DATA_FILE, serialized, "utf8");
console.log(`Saved ${next.length} cancelled convention event(s).`);
