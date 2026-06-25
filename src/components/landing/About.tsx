import { ORG } from '@/config/org.config'

// Placeholder copy — the club can swap this wording without code changes.
export function About() {
  return (
    <section className="border-b border-clw-gold/10 bg-clw-black-2">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="font-display text-3xl text-clw-gold">About the club</h2>
        <div className="mt-6 space-y-4 text-clw-gray">
          <p>
            {ORG.name} develops young wrestlers of every level — from first-timers to seasoned competitors — in a
            disciplined, supportive environment. Our coaches focus on technique, work ethic, and sportsmanship both on
            and off the mat.
          </p>
          <p>
            Families register online, manage their wrestlers, sign up for tournaments, and handle dues all in one place.
            Create an account to get started, or sign in if you already have one.
          </p>
        </div>
      </div>
    </section>
  )
}
