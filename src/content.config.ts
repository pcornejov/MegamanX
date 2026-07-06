import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    order: z.number(),
    category: z.enum(['mainline', 'spinoff']),
    releaseYear: z.number(),
    platforms: z.array(z.string()),
    coverImage: z.string().optional(),
    accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
    rawgId: z.number().optional(),
    rawgSlug: z.string().optional(),
    description: z.string(),
    comingSoon: z.boolean().default(false),
    mechanics: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string(),
          newInThisGame: z.boolean().optional(),
        }),
      )
      .default([]),
    bossOrder: z
      .array(
        z.object({
          order: z.number(),
          character: reference('characters'),
          weakTo: reference('characters').optional(),
          weaponObtained: z.string().optional(),
          stageName: z.string().optional(),
          reasoning: z.string(),
          videoId: z.string().optional(),
          videoStart: z.number().optional(),
        }),
      )
      .default([]),
    fullWalkthroughVideoId: z.string().optional(),
    sourceAttribution: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .optional(),
  }),
});

const roleBase = {
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  portrait: z.string().optional(),
  games: z.array(reference('games')).default([]),
  bio: z.array(z.string()).default([]),
  sourceWikiUrl: z.string().url().optional(),
};

const characters = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/characters' }),
  schema: z.discriminatedUnion('role', [
    z.object({
      ...roleBase,
      role: z.literal('hero'),
      weapons: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
      specialAbility: z.string().optional(),
    }),
    z.object({
      ...roleBase,
      role: z.literal('maverick'),
      game: reference('games'),
      stageName: z.string().optional(),
      elementType: z.string().optional(),
      weakTo: reference('characters').optional(),
      weaponObtained: z.string().optional(),
    }),
    z.object({
      ...roleBase,
      role: z.literal('reploid'),
      affiliation: z.string().optional(),
      rank: z.string().optional(),
    }),
    z.object({
      ...roleBase,
      role: z.literal('human'),
      affiliation: z.string().optional(),
      occupation: z.string().optional(),
    }),
    z.object({
      ...roleBase,
      role: z.literal('other'),
      notes: z.string().optional(),
    }),
  ]),
});

const enemies = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/enemies' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    games: z.array(reference('games')).default([]),
    classification: z.enum(['aerial', 'ground', 'aquatic', 'turret', 'boss-minion', 'other']),
    description: z.string(),
    image: z.string().optional(),
    notes: z.string().optional(),
    sourceWikiUrl: z.string().url().optional(),
  }),
});

const collectibles = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/collectibles' }),
  schema: z.object({
    id: z.string(),
    game: reference('games'),
    type: z.enum(['heart-tank', 'sub-tank', 'armor-part', 'other-upgrade']),
    name: z.string(),
    stageName: z.string().optional(),
    locationDescription: z.string(),
    videoId: z.string().optional(),
    videoStart: z.number().optional(),
    order: z.number().default(0),
  }),
});

const trivia = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/trivia' }),
  schema: z.object({
    id: z.string(),
    game: reference('games').optional(),
    category: z.enum(['development', 'reference', 'glitch', 'easter-egg', 'design', 'other']),
    title: z.string(),
    body: z.string(),
    sourceUrl: z.string().url().optional(),
  }),
});

export const collections = { games, characters, enemies, collectibles, trivia };
