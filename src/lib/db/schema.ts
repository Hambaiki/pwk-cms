import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const entryStatusEnum = pgEnum("entry_status", [
  "draft",
  "published",
  "archived",
]);

export const fieldTypeEnum = pgEnum("field_type", [
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "date",
  "media",
  "relation",
  "select",
  "tags",
]);

export const apiKeyScopeEnum = pgEnum("api_key_scope", ["public", "private"]);

export const teamRoleEnum = pgEnum("team_role", ["admin", "editor", "viewer"]);

// ─── Profiles ──────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  email: text("email").unique().notNull(),
  avatarUrl: text("avatar_url"),
  role: teamRoleEnum("role").default("editor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Collections ───────────────────────────────────────────────────────────────

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    icon: text("icon"),
    isPage: boolean("is_page").default(false).notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("collections_slug_idx").on(t.slug)],
);

// ─── Fields ────────────────────────────────────────────────────────────────────
// options JSON shape per type:
//   select   → { choices: string[] }
//   relation → { targetCollectionId: string; labelField: string }
//   media    → { accept?: string }
//   number   → { min?: number; max?: number; step?: number }

export const fields = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: fieldTypeEnum("type").notNull(),
    required: boolean("required").default(false).notNull(),
    multiple: boolean("multiple").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    options: jsonb("options"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("fields_collection_slug_idx").on(t.collectionId, t.slug),
    index("fields_collection_id_idx").on(t.collectionId),
  ],
);

// ─── Entries ───────────────────────────────────────────────────────────────────
// content JSONB keyed by field slug:
//   { title: "Hello", body: [...BlockNote blocks], cover_image: "media-uuid" }

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    status: entryStatusEnum("status").default("draft").notNull(),
    content: jsonb("content").notNull().default({}),
    authorId: uuid("author_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("entries_collection_slug_idx").on(t.collectionId, t.slug),
    index("entries_collection_id_idx").on(t.collectionId),
    index("entries_status_idx").on(t.status),
    index("entries_author_id_idx").on(t.authorId),
  ],
);

// ─── Tags ──────────────────────────────────────────────────────────────────────

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("tags_slug_idx").on(t.slug)],
);

// ─── Entry ↔ Tags ──────────────────────────────────────────────────────────────

export const entryTags = pgTable(
  "entry_tags",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("entry_tags_entry_tag_idx").on(t.entryId, t.tagId),
    index("entry_tags_tag_id_idx").on(t.tagId),
  ],
);

// ─── Media ─────────────────────────────────────────────────────────────────────

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: text("filename").notNull(),
    storagePath: text("storage_path").notNull(),
    publicUrl: text("public_url").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    folder: text("folder").default("/").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("media_folder_idx").on(t.folder),
    index("media_uploaded_by_idx").on(t.uploadedBy),
    index("media_mime_type_idx").on(t.mimeType),
  ],
);

// ─── API Keys ──────────────────────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    scope: apiKeyScopeEnum("scope").notNull(),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("api_keys_created_by_idx").on(t.createdBy)],
);

// ─── Relations ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  entries: many(entries),
  collections: many(collections),
  media: many(media),
  apiKeys: many(apiKeys),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  createdBy: one(profiles, {
    fields: [collections.createdBy],
    references: [profiles.id],
  }),
  fields: many(fields),
  entries: many(entries),
}));

export const fieldsRelations = relations(fields, ({ one }) => ({
  collection: one(collections, {
    fields: [fields.collectionId],
    references: [collections.id],
  }),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
  collection: one(collections, {
    fields: [entries.collectionId],
    references: [collections.id],
  }),
  author: one(profiles, {
    fields: [entries.authorId],
    references: [profiles.id],
  }),
  entryTags: many(entryTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  entryTags: many(entryTags),
}));

export const entryTagsRelations = relations(entryTags, ({ one }) => ({
  entry: one(entries, {
    fields: [entryTags.entryId],
    references: [entries.id],
  }),
  tag: one(tags, { fields: [entryTags.tagId], references: [tags.id] }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  uploadedBy: one(profiles, {
    fields: [media.uploadedBy],
    references: [profiles.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  createdBy: one(profiles, {
    fields: [apiKeys.createdBy],
    references: [profiles.id],
  }),
}));

// ─── Exported Types ────────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type EntryTag = typeof entryTags.$inferSelect;

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type SelectFieldOptions = { choices: string[] };
export type RelationFieldOptions = {
  targetCollectionId: string;
  labelField: string;
};
export type MediaFieldOptions = { accept?: string };
export type NumberFieldOptions = { min?: number; max?: number; step?: number };
