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
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const entryStatusEnum = pgEnum('entry_status', [
  'draft',
  'published',
  'archived',
])

export const fieldTypeEnum = pgEnum('field_type', [
  'text', 'textarea', 'richtext', 'number', 'boolean',
  'date', 'media', 'relation', 'select', 'tags',
])

export const apiKeyScopeEnum = pgEnum('api_key_scope', ['public', 'private'])

// Collection-scoped member roles.
// owner   — created the collection; can delete it, manage members, manage API keys
// editor  — can create/edit/delete entries and upload media within the collection
// viewer  — read-only access within the CMS for this collection
export const memberRoleEnum = pgEnum('member_role', ['owner', 'editor', 'viewer'])

// ─── Profiles ──────────────────────────────────────────────────────────────────
// No global role — access is determined per-collection via collection_members.

export const profiles = pgTable('profiles', {
  id:          uuid('id').primaryKey(), // matches auth.users.id
  displayName: text('display_name'),
  email:       text('email').unique().notNull(),
  avatarUrl:   text('avatar_url'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Collections ───────────────────────────────────────────────────────────────

export const collections = pgTable('collections', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        text('name').notNull(),
  slug:        text('slug').notNull(),
  description: text('description'),
  icon:        text('icon'),
  isPage:      boolean('is_page').default(false).notNull(),
  ownerId:     uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('collections_owner_slug_idx').on(t.ownerId, t.slug),
  index('collections_owner_id_idx').on(t.ownerId),
])

// ─── Collection members ────────────────────────────────────────────────────────

export const collectionMembers = pgTable('collection_members', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  userId:       uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  role:         memberRoleEnum('role').notNull().default('viewer'),
  invitedBy:    uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('collection_members_collection_user_idx').on(t.collectionId, t.userId),
  index('collection_members_user_id_idx').on(t.userId),
  index('collection_members_collection_id_idx').on(t.collectionId),
])

// ─── Fields ────────────────────────────────────────────────────────────────────

export const fields = pgTable('fields', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  slug:         text('slug').notNull(),
  type:         fieldTypeEnum('type').notNull(),
  required:     boolean('required').default(false).notNull(),
  multiple:     boolean('multiple').default(false).notNull(),
  sortOrder:    integer('sort_order').default(0).notNull(),
  options:      jsonb('options'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('fields_collection_slug_idx').on(t.collectionId, t.slug),
  index('fields_collection_id_idx').on(t.collectionId),
])

// ─── Entries ───────────────────────────────────────────────────────────────────

export const entries = pgTable('entries', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  slug:         text('slug').notNull(),
  status:       entryStatusEnum('status').default('draft').notNull(),
  content:      jsonb('content').notNull().default({}),
  authorId:     uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
  publishedAt:  timestamp('published_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('entries_collection_slug_idx').on(t.collectionId, t.slug),
  index('entries_collection_id_idx').on(t.collectionId),
  index('entries_status_idx').on(t.status),
  index('entries_author_id_idx').on(t.authorId),
])

// ─── Tags ──────────────────────────────────────────────────────────────────────
// Tags are scoped to a collection.

export const tags = pgTable('tags', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  slug:         text('slug').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('tags_collection_slug_idx').on(t.collectionId, t.slug),
  index('tags_collection_id_idx').on(t.collectionId),
])

// ─── Entry ↔ Tags ──────────────────────────────────────────────────────────────

export const entryTags = pgTable('entry_tags', {
  entryId: uuid('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  tagId:   uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [
  uniqueIndex('entry_tags_entry_tag_idx').on(t.entryId, t.tagId),
  index('entry_tags_tag_id_idx').on(t.tagId),
])

// ─── Media ─────────────────────────────────────────────────────────────────────
// Scoped to a collection — each collection has its own media pool.

export const media = pgTable('media', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  filename:     text('filename').notNull(),
  storagePath:  text('storage_path').notNull(),
  publicUrl:    text('public_url').notNull(),
  mimeType:     text('mime_type').notNull(),
  size:         integer('size').notNull(),
  width:        integer('width'),
  height:       integer('height'),
  alt:          text('alt'),
  uploadedBy:   uuid('uploaded_by').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('media_collection_id_idx').on(t.collectionId),
  index('media_uploaded_by_idx').on(t.uploadedBy),
  index('media_mime_type_idx').on(t.mimeType),
])

// ─── API Keys ──────────────────────────────────────────────────────────────────
// Scoped to a collection.

export const apiKeys = pgTable('api_keys', {
  id:           uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  name:         text('name').notNull(),
  keyHash:      text('key_hash').notNull().unique(),
  scope:        apiKeyScopeEnum('scope').notNull(),
  createdBy:    uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  expiresAt:    timestamp('expires_at', { withTimezone: true }),
  lastUsedAt:   timestamp('last_used_at', { withTimezone: true }),
  revokedAt:    timestamp('revoked_at', { withTimezone: true }),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('api_keys_collection_id_idx').on(t.collectionId),
  index('api_keys_created_by_idx').on(t.createdBy),
])

// ─── Relations ─────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  ownedCollections: many(collections, { relationName: 'owner' }),
  memberships:      many(collectionMembers),
  entries:          many(entries),
  uploadedMedia:    many(media),
}))

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  owner:   one(profiles, { fields: [collections.ownerId], references: [profiles.id], relationName: 'owner' }),
  members: many(collectionMembers),
  fields:  many(fields),
  entries: many(entries),
  tags:    many(tags),
  media:   many(media),
  apiKeys: many(apiKeys),
}))

export const collectionMembersRelations = relations(collectionMembers, ({ one }) => ({
  collection: one(collections, { fields: [collectionMembers.collectionId], references: [collections.id] }),
  user:       one(profiles,    { fields: [collectionMembers.userId],       references: [profiles.id] }),
  invitedBy:  one(profiles,    { fields: [collectionMembers.invitedBy],    references: [profiles.id] }),
}))

export const fieldsRelations = relations(fields, ({ one }) => ({
  collection: one(collections, { fields: [fields.collectionId], references: [collections.id] }),
}))

export const entriesRelations = relations(entries, ({ one, many }) => ({
  collection: one(collections, { fields: [entries.collectionId], references: [collections.id] }),
  author:     one(profiles,    { fields: [entries.authorId],     references: [profiles.id] }),
  entryTags:  many(entryTags),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  collection: one(collections, { fields: [tags.collectionId], references: [collections.id] }),
  entryTags:  many(entryTags),
}))

export const entryTagsRelations = relations(entryTags, ({ one }) => ({
  entry: one(entries, { fields: [entryTags.entryId], references: [entries.id] }),
  tag:   one(tags,    { fields: [entryTags.tagId],   references: [tags.id] }),
}))

export const mediaRelations = relations(media, ({ one }) => ({
  collection: one(collections, { fields: [media.collectionId], references: [collections.id] }),
  uploadedBy: one(profiles,    { fields: [media.uploadedBy],   references: [profiles.id] }),
}))

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  collection: one(collections, { fields: [apiKeys.collectionId], references: [collections.id] }),
  createdBy:  one(profiles,    { fields: [apiKeys.createdBy],    references: [profiles.id] }),
}))

// ─── Exported Types ────────────────────────────────────────────────────────────

export type Profile             = typeof profiles.$inferSelect
export type NewProfile          = typeof profiles.$inferInsert

export type Collection          = typeof collections.$inferSelect
export type NewCollection       = typeof collections.$inferInsert

export type CollectionMember    = typeof collectionMembers.$inferSelect
export type NewCollectionMember = typeof collectionMembers.$inferInsert
export type MemberRole          = 'owner' | 'editor' | 'viewer'

export type Field               = typeof fields.$inferSelect
export type NewField            = typeof fields.$inferInsert

export type Entry               = typeof entries.$inferSelect
export type NewEntry            = typeof entries.$inferInsert

export type Tag                 = typeof tags.$inferSelect
export type NewTag              = typeof tags.$inferInsert

export type EntryTag            = typeof entryTags.$inferSelect

export type Media               = typeof media.$inferSelect
export type NewMedia            = typeof media.$inferInsert

export type ApiKey              = typeof apiKeys.$inferSelect
export type NewApiKey           = typeof apiKeys.$inferInsert

export type SelectFieldOptions   = { choices: string[] }
export type RelationFieldOptions = { targetCollectionId: string; labelField: string }
export type MediaFieldOptions    = { accept?: string }
export type NumberFieldOptions   = { min?: number; max?: number; step?: number }
