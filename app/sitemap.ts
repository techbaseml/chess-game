import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://chess-game-one-henna.vercel.app/', changeFrequency: 'weekly', priority: 1 }];
}
