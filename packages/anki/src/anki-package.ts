import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const fieldSeparator = "\u001f";

export interface AnkiPackage {
  decks: AnkiDeck[];
  media: Record<string, string>;
}

export interface AnkiDeck {
  id: number;
  name: string;
  notes: AnkiNote[];
}

export interface AnkiNote {
  cards: AnkiCard[];
  checksum: number;
  data: string;
  fieldNames: string[];
  fields: string[];
  flags: number;
  guid: string;
  id: number;
  modelId: number;
  modelName: string | null;
  modifiedAt: number;
  sortField: string;
  tags: string[];
  updateSequenceNumber: number;
}

export interface AnkiCard {
  cardType: string | null;
  data: string;
  deckId: number;
  due: number;
  factor: number;
  flags: number;
  id: number;
  interval: number;
  lapses: number;
  left: number;
  modifiedAt: number;
  noteId: number;
  order: number;
  originalDeckId: number;
  originalDue: number;
  queue: number;
  repetitions: number;
  type: number;
  updateSequenceNumber: number;
}

interface CollectionDeck {
  id: number;
  name: string;
}

interface CollectionModel {
  flds?: Array<{ name?: string }>;
  id?: number | string;
  name?: string;
  tmpls?: CollectionTemplate[];
}

interface CollectionTemplate {
  name?: string;
  ord?: number | string;
}

interface RawNote {
  csum: number;
  data: string;
  flds: string;
  flags: number;
  guid: string;
  id: number;
  mid: number;
  mod: number;
  sfld: string | number;
  tags: string;
  usn: number;
}

interface RawCard {
  data: string;
  did: number;
  due: number;
  factor: number;
  flags: number;
  id: number;
  ivl: number;
  lapses: number;
  left: number;
  mod: number;
  nid: number;
  odid: number;
  odue: number;
  ord: number;
  queue: number;
  reps: number;
  type: number;
  usn: number;
}

interface CollectionRow {
  decks: string;
  models: string;
}

export function loadAnkiPackage(filePath: string): AnkiPackage {
  if (isAnkiCollectionPath(filePath)) {
    const database = new Database(filePath, getDatabaseOptions({ readonly: true }));

    try {
      return {
        decks: loadDecksFromDatabase(database),
        media: {},
      };
    } finally {
      database.close();
    }
  }

  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-"));

  try {
    const zip = new AdmZip(filePath);
    const collectionEntry = zip.getEntry("collection.anki21") ?? zip.getEntry("collection.anki2");

    if (!collectionEntry) {
      throw new Error("Anki package is missing collection.anki2 or collection.anki21.");
    }

    const collectionPath = join(workdir, "collection.anki2");
    writeFileSync(collectionPath, collectionEntry.getData());

    const database = new Database(collectionPath, getDatabaseOptions({ readonly: true }));

    try {
      return {
        decks: loadDecksFromDatabase(database),
        media: readMediaManifest(zip),
      };
    } finally {
      database.close();
    }
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
}

function loadDecksFromDatabase(database: Database.Database) {
  const collection = database
    .prepare("select decks, models from col limit 1")
    .get() as CollectionRow;
  const deckMap = JSON.parse(collection.decks) as Record<string, CollectionDeck>;
  const models = parseModels(collection.models);
  const decks = Object.values(deckMap).map((deck) => ({
    id: Number(deck.id),
    name: deck.name,
    notes: [] as AnkiNote[],
  }));
  const deckById = new Map(decks.map((deck) => [deck.id, deck]));
  const notes = database
    .prepare("select id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data from notes")
    .all() as RawNote[];
  const cards = database
    .prepare(
      `select id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses,
              left, odue, odid, flags, data
       from cards`,
    )
    .all() as RawCard[];
  const cardsByNoteId = groupCardsByNoteId(cards);

  for (const note of notes) {
    const noteCards = cardsByNoteId.get(note.id) ?? [];
    const firstDeckId = noteCards[0]?.did;
    const model = models.get(note.mid);

    if (!firstDeckId) {
      continue;
    }

    deckById.get(firstDeckId)?.notes.push({
      cards: noteCards.map((card) => ({
        cardType: getCardType(model, card.ord),
        data: card.data,
        deckId: card.did,
        due: card.due,
        factor: card.factor,
        flags: card.flags,
        id: card.id,
        interval: card.ivl,
        lapses: card.lapses,
        left: card.left,
        modifiedAt: card.mod,
        noteId: card.nid,
        order: card.ord,
        originalDeckId: card.odid,
        originalDue: card.odue,
        queue: card.queue,
        repetitions: card.reps,
        type: card.type,
        updateSequenceNumber: card.usn,
      })),
      checksum: note.csum,
      data: note.data,
      fieldNames: model?.flds?.map((field) => field.name ?? "") ?? [],
      fields: note.flds.split(fieldSeparator),
      flags: note.flags,
      guid: note.guid,
      id: note.id,
      modelId: note.mid,
      modelName: model?.name ?? null,
      modifiedAt: note.mod,
      sortField: String(note.sfld),
      tags: note.tags.trim() ? note.tags.trim().split(/\s+/u) : [],
      updateSequenceNumber: note.usn,
    });
  }

  return decks;
}

function parseModels(modelsJson: string) {
  const models = JSON.parse(modelsJson) as Record<string, CollectionModel>;

  return new Map(
    Object.entries(models).map(([modelId, model]) => [Number(model.id ?? modelId), model]),
  );
}

function getCardType(model: CollectionModel | undefined, order: number) {
  const template = model?.tmpls?.find((candidate) => Number(candidate.ord) === order);

  return template?.name ?? null;
}

export function saveAnkiPackage(filePath: string, ankiPackage: AnkiPackage) {
  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-"));

  try {
    const collectionPath = join(workdir, "collection.anki2");
    const database = new Database(collectionPath, getDatabaseOptions());

    try {
      createAnkiSchema(database);
      writeCollection(database, ankiPackage.decks);
      writeDeckRows(database, ankiPackage.decks);
    } finally {
      database.close();
    }

    const zip = new AdmZip();
    zip.addLocalFile(collectionPath, "", "collection.anki2");
    zip.addFile("media", Buffer.from(JSON.stringify(ankiPackage.media), "utf8"));
    zip.writeZip(filePath);
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
}

function getDatabaseOptions(options: Database.Options = {}) {
  return {
    ...options,
    nativeBinding: process.env.ORBIT_BETTER_SQLITE3_NATIVE_BINDING,
  };
}

function groupCardsByNoteId(cards: RawCard[]) {
  const grouped = new Map<number, RawCard[]>();

  for (const card of cards) {
    const group = grouped.get(card.nid) ?? [];
    group.push(card);
    grouped.set(card.nid, group);
  }

  return grouped;
}

function readMediaManifest(zip: AdmZip) {
  const entry = zip.getEntry("media");

  if (!entry) {
    return {};
  }

  return JSON.parse(entry.getData().toString("utf8")) as Record<string, string>;
}

function createAnkiSchema(database: Database.Database) {
  database.exec(`
    create table col (
      id integer primary key,
      crt integer not null,
      mod integer not null,
      scm integer not null,
      ver integer not null,
      dty integer not null,
      usn integer not null,
      ls integer not null,
      conf text not null,
      models text not null,
      decks text not null,
      dconf text not null,
      tags text not null
    );
    create table notes (
      id integer primary key,
      guid text not null,
      mid integer not null,
      mod integer not null,
      usn integer not null,
      tags text not null,
      flds text not null,
      sfld integer not null,
      csum integer not null,
      flags integer not null,
      data text not null
    );
    create table cards (
      id integer primary key,
      nid integer not null,
      did integer not null,
      ord integer not null,
      mod integer not null,
      usn integer not null,
      type integer not null,
      queue integer not null,
      due integer not null,
      ivl integer not null,
      factor integer not null,
      reps integer not null,
      lapses integer not null,
      left integer not null,
      odue integer not null,
      odid integer not null,
      flags integer not null,
      data text not null
    );
    create table revlog (
      id integer primary key,
      cid integer not null,
      usn integer not null,
      ease integer not null,
      ivl integer not null,
      lastIvl integer not null,
      factor integer not null,
      time integer not null,
      type integer not null
    );
    create table graves (
      usn integer not null,
      oid integer not null,
      type integer not null
    );
  `);
}

function writeCollection(database: Database.Database, decks: AnkiDeck[]) {
  const now = Math.floor(Date.now() / 1000);
  const deckConfigId = 1;
  const modelsJson = buildModelsJson(decks);
  const decksJson = Object.fromEntries(
    decks.map((deck) => [
      String(deck.id),
      {
        collapsed: false,
        conf: deckConfigId,
        desc: "",
        dyn: 0,
        extendNew: 10,
        extendRev: 50,
        id: deck.id,
        mod: now,
        name: deck.name,
        newToday: [0, 0],
        revToday: [0, 0],
        timeToday: [0, 0],
        usn: 0,
      },
    ]),
  );

  database
    .prepare(
      `insert into col
       (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
       values (1, ?, ?, ?, 11, 0, 0, 0, '{}', ?, ?, ?, '{}')`,
    )
    .run(
      now,
      now,
      now,
      modelsJson,
      JSON.stringify(decksJson),
      JSON.stringify({
        [deckConfigId]: {
          id: deckConfigId,
          name: "Default",
        },
      }),
    );
}

function buildModelsJson(decks: AnkiDeck[]) {
  const models = new Map<number, CollectionModel>();

  for (const deck of decks) {
    for (const note of deck.notes) {
      if (!models.has(note.modelId)) {
        models.set(note.modelId, {
          flds: note.fieldNames.map((name) => ({ name })),
          id: note.modelId,
          name: note.modelName ?? String(note.modelId),
          tmpls: note.cards.map((card) => ({
            name: card.cardType ?? String(card.order),
            ord: card.order,
          })),
        });
      }
    }
  }

  return JSON.stringify(Object.fromEntries(models.entries()));
}

function writeDeckRows(database: Database.Database, decks: AnkiDeck[]) {
  const insertNote = database.prepare(
    `insert into notes
     (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertCard = database.prepare(
    `insert into cards
     (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const deck of decks) {
    for (const note of deck.notes) {
      insertNote.run(
        note.id,
        note.guid,
        note.modelId,
        note.modifiedAt,
        note.updateSequenceNumber,
        ` ${note.tags.join(" ")} `,
        note.fields.join(fieldSeparator),
        note.sortField,
        note.checksum,
        note.flags,
        note.data,
      );

      for (const card of note.cards) {
        insertCard.run(
          card.id,
          card.noteId,
          card.deckId,
          card.order,
          card.modifiedAt,
          card.updateSequenceNumber,
          card.type,
          card.queue,
          card.due,
          card.interval,
          card.factor,
          card.repetitions,
          card.lapses,
          card.left,
          card.originalDue,
          card.originalDeckId,
          card.flags,
          card.data,
        );
      }
    }
  }
}

export function isAnkiPackagePath(filePath: string) {
  return (
    existsSync(filePath) &&
    [".apkg", ".colpkg", ".anki2", ".anki21"].includes(extname(filePath).toLowerCase())
  );
}

function isAnkiCollectionPath(filePath: string) {
  return [".anki2", ".anki21"].includes(extname(filePath).toLowerCase());
}
