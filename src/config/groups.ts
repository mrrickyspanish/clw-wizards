/**
 * Single source of truth for the club's three training groups.
 * Ordered beginner-first so pages tell a progression story:
 * White -> Gold -> Black.
 */
export interface TrainingGroup {
  name: string
  label: string
  description: string
}

export const TRAINING_GROUPS: readonly TrainingGroup[] = [
  {
    name: 'White',
    label: 'Learning the Fundamentals',
    description:
      'For newer and younger wrestlers building stance, movement, discipline, confidence, and safe competition habits.',
  },
  {
    name: 'Gold',
    label: 'Developing Competitors',
    description:
      'For wrestlers strengthening technique, practice habits, mat confidence, and readiness for regular competition.',
  },
  {
    name: 'Black',
    label: 'Advanced Competition',
    description:
      'For experienced wrestlers training for more demanding practices, travel competition, and tougher tournament weekends.',
  },
]
