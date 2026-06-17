import AdmZip from "adm-zip";
import Database from "better-sqlite3";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  fields: string[];
  id: number;
  modelId: number;
  tags: string[];
}

export interface AnkiCard {
  deckId: number;
  due: number;
  factor: number;
  id: number;
  interval: number;
  lapses: number;
  noteId: number;
  repetitions: number;
}

interface CollectionDeck {
  id: number;
  name: string;
}

interface RawNote {
  flds: string;
  id: number;
  mid: number;
  tags: string;
}

interface RawCard {
  did: number;
  due: number;
  factor: number;
  id: number;
  ivl: number;
  lapses: number;
  nid: number;
  reps: number;
}

interface CollectionRow {
  decks: string;
}

export function loadAnkiPackage(filePath: string): AnkiPackage {
  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-"));

  try {
    const zip = new AdmZip(filePath);
    const collectionEntry = zip.getEntry("collection.anki21") ?? zip.getEntry("collection.anki2");

    if (!collectionEntry) {
      throw new Error("Anki package is missing collection.anki2 or collection.anki21.");
    }

    const collectionPath = join(workdir, "collection.anki2");
    writeFileSync(collectionPath, collectionEntry.getData());

    const database = new Database(collectionPath, { readonly: true });

    try {
      const collection = database.prepare("select decks from col limit 1").get() as CollectionRow;
      const deckMap = JSON.parse(collection.decks) as Record<string, CollectionDeck>;
      const decks = Object.values(deckMap).map((deck) => ({
        id: Number(deck.id),
        name: deck.name,
        notes: [] as AnkiNote[],
      }));
      const deckById = new Map(decks.map((deck) => [deck.id, deck]));
      const notes = database.prepare("select id, mid, flds, tags from notes").all() as RawNote[];
      const cards = database
        .prepare("select id, nid, did, due, ivl, factor, reps, lapses from cards")
        .all() as RawCard[];
      const cardsByNoteId = groupCardsByNoteId(cards);

      for (const note of notes) {
        const noteCards = cardsByNoteId.get(note.id) ?? [];
        const firstDeckId = noteCards[0]?.did;

        if (!firstDeckId) {
          continue;
        }

        deckById.get(firstDeckId)?.notes.push({
          cards: noteCards.map((card) => ({
            deckId: card.did,
            due: card.due,
            factor: card.factor,
            id: card.id,
            interval: card.ivl,
            lapses: card.lapses,
            noteId: card.nid,
            repetitions: card.reps,
          })),
          fields: note.flds.split(fieldSeparator),
          id: note.id,
          modelId: note.mid,
          tags: note.tags.trim() ? note.tags.trim().split(/\s+/u) : [],
        });
      }

      return {
        decks,
        media: readMediaManifest(zip),
      };
    } finally {
      database.close();
    }
  } finally {
    rmSync(workdir, { force: true, recursive: true });
  }
}

export function saveAnkiPackage(filePath: string, ankiPackage: AnkiPackage) {
  const workdir = mkdtempSync(join(tmpdir(), "orbit-anki-"));

  try {
    const collectionPath = join(workdir, "collection.anki2");
    const database = new Database(collectionPath);

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
       values (1, ?, ?, ?, 11, 0, 0, 0, '{}', '{}', ?, ?, '{}')`,
    )
    .run(
      now,
      now,
      now,
      JSON.stringify(decksJson),
      JSON.stringify({
        [deckConfigId]: {
          id: deckConfigId,
          name: "Default",
        },
      }),
    );
}

function writeDeckRows(database: Database.Database, decks: AnkiDeck[]) {
  const now = Math.floor(Date.now() / 1000);
  const insertNote = database.prepare(
    `insert into notes
     (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
     values (?, ?, ?, ?, 0, ?, ?, 0, 0, 0, '')`,
  );
  const insertCard = database.prepare(
    `insert into cards
     (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
     values (?, ?, ?, 0, ?, 0, 0, 0, ?, ?, ?, ?, ?, 0, 0, 0, 0, '')`,
  );

  for (const deck of decks) {
    for (const note of deck.notes) {
      insertNote.run(
        note.id,
        `orbit-${note.id}`,
        note.modelId,
        now,
        ` ${note.tags.join(" ")} `,
        note.fields.join(fieldSeparator),
      );

      for (const card of note.cards) {
        insertCard.run(
          card.id,
          card.noteId,
          card.deckId,
          now,
          card.due,
          card.interval,
          card.factor,
          card.repetitions,
          card.lapses,
        );
      }
    }
  }
}

export function isAnkiPackagePath(filePath: string) {
  return existsSync(filePath) && filePath.endsWith(".apkg");
}
