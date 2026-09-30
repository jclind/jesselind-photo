export type ProjectType = {
  id: string
  name: string
  date: string
  endDate?: string
  description: string
  posterUrl: string
  thumbnailUrl: string
  mobilePosterUrl: string
}

export const projects: ProjectType[] = [
  {
    id: 'out-west-trip',
    name: 'Out West Trip',
    date: '04-27-2021',
    description:
      'Three-week van trip out west with my brother Ben, visiting the Badlands, Yellowstone, Grand Teton, Bryce Canyon and more along the way.',
    posterUrl: '/images/projects/out-west-trip-poster.webp',
    thumbnailUrl: '/images/projects/out-west-trip-thumbnail.webp',
    mobilePosterUrl: '/images/projects/out-west-trip-poster-mobile.webp',
  },
  {
    id: 'japan-2023',
    name: 'Japan 2023',
    date: '04-25-2023',
    description:
      'Three-week solo trip to Japan exploring Sapporo, Tokyo, Kyoto, and Osaka.',
    posterUrl: '/images/projects/japan-2023-poster.webp',
    thumbnailUrl: '/images/projects/japan-2023-thumbnail.webp',
    mobilePosterUrl: '/images/projects/japan-2023-poster-mobile.webp',
  },
  {
    id: 'japan-2025',
    name: 'Japan 2025',
    date: '04-28-2025',
    description:
      'Two-month trip to Japan exploring Sapporo, Fukuoka, Nagasaki, Osaka, Kyoto, Tokyo and more.',
    posterUrl: '/images/projects/japan-2025-poster.webp',
    thumbnailUrl: '/images/projects/japan-2025-thumbnail.webp',
    mobilePosterUrl: '/images/projects/japan-2025-poster-mobile.webp',
  },
  {
    id: 'vietnam-2026',
    name: 'Vietnam 2026',
    date: '07-13-2026',
    endDate: '07-31-2026',
    description:
      "Spontaneous three-week trip through Vietnam with two friends, planned with about a week's notice. Explored the cities of Saigon and Hanoi and the countryside of Ninh Binh. We also embarked on a four-day motorcycle ride through the northern mountains of the Ha Giang Loop. Shot on Fujifilm X-T4.",
    posterUrl: '/images/projects/vietnam-2026-poster.webp',
    thumbnailUrl: '/images/projects/vietnam-2026-thumbnail.webp',
    mobilePosterUrl: '/images/projects/vietnam-2026-poster-mobile.webp',
  },
].sort((a, b) => {
  const dateA = new Date(a.date)
  const dateB = new Date(b.date)
  return dateB.getTime() - dateA.getTime() // newest first
})
