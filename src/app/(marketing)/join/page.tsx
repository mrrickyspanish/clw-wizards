import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  Award,
  Check,
  HeartHandshake,
  Mail,
  MapPin,
  Navigation,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'

import { ORG } from '@/config/org.config'

const MAP_URL = 'https://www.google.com/maps/search/?api=1&query=975+Nimco+Dr+Unit+L+Crystal+Lake+IL+60014'
const SECTION_HEADING_CLASS = 'mt-4 font-display text-4xl uppercase leading-[0.96] text-clw-white sm:text-5xl'

const FIT_POINTS = [
  'Young wrestlers learning the sport for the first time',
  'Developing athletes ready for more structure and consistency',
  'Experienced competitors preparing for tougher tournament weekends',
  'Families looking for discipline, confidence, teamwork, and growth',
]

const EXPECTATIONS = [
  {
    title: 'Safety First',
    body: 'A structured room where coaches set clear expectations and every wrestler is taught to train responsibly.',
    icon: ShieldCheck,
  },
  {
    title: 'Students First',
    body: 'Athletes are expected to carry discipline, effort, and accountability beyond the wrestling mat.',
    icon: Award,
  },
  {
    title: 'Real Coaching',
    body: 'Wrestlers receive focused instruction, honest feedback, and support appropriate for their current stage.',
    icon: Users,
  },
  {
    title: 'Room to Compete',
    body: 'Tournament opportunities give wrestlers a chance to test their progress when they are ready.',
    icon: Trophy,
  },
]

const GROUPS = [
  {
    name: 'White',
    label: 'Learning the fundamentals',
    body: 'For newer and younger wrestlers building stance, movement, discipline, confidence, and safe competition habits.',
  },
  {
    name: 'Gold',
    label: 'Developing consistent competitors',
    body: 'For wrestlers strengthening technique, practice habits, mat confidence, and readiness for regular competition.',
  },
  {
    name: 'Black',
    label: 'Preparing for higher-level competition',
    body: 'For experienced wrestlers training for more demanding practices, travel competition, and tougher tournament weekends.',
  },
]

const GEAR = [
  'Athletic shorts and a T-shirt without hoods, snaps, or zippers',
  'A labeled water bottle',
  'Wrestling shoes and headgear when the wrestler begins regular practice',
  'A positive attitude and willingness to listen, learn, and work',
]

const COST_CATEGORIES = [
  'Club registration or fundraising requirements',
  'A current USA Wrestling athlete membership',
  'A singlet deposit when a competition uniform is issued',
  'Optional tournament entry fees throughout the season',
]

const FIRST_WEEKS = [
  {
    number: '01',
    title: 'Meet the Room',
    body: 'Your wrestler learns the facility, mat rules, coaching expectations, and the rhythm of practice.',
  },
  {
    number: '02',
    title: 'Build the Base',
    body: 'Coaches focus on movement, stance, positioning, effort, and the fundamentals appropriate for the wrestler.',
  },
  {
    number: '03',
    title: 'Find the Fit',
    body: 'The coaching staff evaluates where the wrestler will be challenged, supported, and able to develop safely.',
  },
  {
    number: '04',
    title: 'Take the Next Step',
    body: 'Families receive guidance on schedules, equipment, club requirements, and competition opportunities.',
  },
]

export const metadata: Metadata = {
  title: 'New Families',
  description: 'What new families can expect when exploring Wizards Wrestling Club, from training groups and first practices to equipment and next steps.',
}

export default function JoinPage() {
  return (
    <main className="relative overflow-hidden bg-clw-black text-clw-white">
      <section className="relative isolate min-h-[690px] overflow-hidden border-b border-clw-gold/20 lg:min-h-[760px]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- real club team photography */}
          <img
            src="/images/real/clw_wizards_hero_landscape.png"
            alt="Wizards wrestlers and coaches together"
            className="h-full w-full object-cover object-center"
            style={{ filter: 'saturate(.58) contrast(1.08) brightness(.72)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-clw-black via-clw-black/80 to-clw-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-clw-black via-transparent to-clw-black/20" />
        </div>

        <div className="mission-frame relative flex min-h-[690px] items-end pb-14 pt-20 sm:pb-16 lg:min-h-[760px] lg:items-center lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <p className="font-cond text-sm uppercase tracking-[0.34em] text-clw-gold">New Families</p>
            <h1 className="mt-5 uppercase leading-[0.88]">
              <span className="block font-cond text-[clamp(3.25rem,10vw,6.5rem)] font-light tracking-[-0.045em] text-clw-white">
                Interested in
              </span>
              <span className="block font-display text-[clamp(4rem,12vw,8rem)] font-black tracking-[-0.04em] text-clw-gold">
                Wizards Wrestling?
              </span>
              <span className="mt-2 block font-cond text-[clamp(2.75rem,8vw,5.3rem)] font-light tracking-[-0.04em] text-clw-white">
                Start here.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-clw-gray sm:text-2xl sm:leading-relaxed">
              Whether your child is stepping onto a mat for the first time or looking for a more serious place to compete, this page will help your family understand the room, the expectations, and the next conversation to have.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${ORG.contactEmail}?subject=Interested%20in%20Wizards%20Wrestling`}
                className="chamfer-sm inline-flex min-h-[52px] items-center justify-center gap-2 bg-clw-gold px-7 py-4 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
              >
                Ask About Joining
                <Mail className="h-4 w-4" />
              </a>
              <Link
                href="/signup"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-clw-white/35 px-7 py-4 font-cond text-base uppercase tracking-[0.16em] text-clw-white transition hover:border-clw-gold hover:text-clw-gold"
              >
                Create Parent Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-clw-gray/80">
              Not sure which path applies? Start with a question. Club staff can confirm the right next step for your wrestler.
            </p>
          </div>
        </div>
      </section>

      <section className="section-light relative isolate overflow-hidden border-b border-clw-gold/25 bg-[#F7F7F7] py-14 text-clw-ink sm:py-16 lg:py-20">
        <div className="mission-frame relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Is This the Right Fit?</p>
            <h2 className="mt-5 uppercase leading-[0.92]">
              <span className="block font-cond text-[clamp(2.8rem,8vw,5rem)] font-light tracking-[-0.04em]">A place to learn.</span>
              <span className="block font-display text-[clamp(3.2rem,9vw,5.7rem)] font-black tracking-[-0.04em] text-clw-gold">A room to grow.</span>
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-clw-muted-dark sm:text-2xl sm:leading-relaxed lg:text-xl">
              Wizards Wrestling helps young athletes take the next step, whether they are learning the basics, building confidence, or chasing bigger competitive goals.
            </p>
            <ul className="mt-7 space-y-4">
              {FIT_POINTS.map((point) => (
                <li key={point} className="flex gap-3 text-lg leading-relaxed text-clw-muted-dark">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative aspect-[5/4] w-full">
            <div className="absolute left-0 top-0 z-10 h-[58%] w-[62%] overflow-hidden border border-clw-ink/30 bg-clw-black">
              {/* eslint-disable-next-line @next/next/no-img-element -- real club team photography */}
              <img src="/images/real/clw-wizards-youth-team-photo.jpg" alt="Wizards youth wrestlers gathered as a team" className="h-full w-full object-cover" />
            </div>
            <div className="absolute right-0 top-[18%] z-20 h-[56%] w-[55%] overflow-hidden border border-clw-ink/30 bg-clw-black shadow-2xl shadow-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element -- real club family photography */}
              <img src="/images/real/clw-wizards-family-photo.jpg" alt="Wizards wrestling families together" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-[14%] z-30 h-[43%] w-[43%] overflow-hidden border border-clw-ink/30 bg-clw-black shadow-2xl shadow-black/25">
              {/* eslint-disable-next-line @next/next/no-img-element -- real club wrestler photography */}
              <img src="/images/real/clw-wizards-trio-featured-photo.jpg" alt="Three Wizards wrestlers together" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mission-frame relative py-14 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch lg:gap-6">
          <div className="overflow-hidden border border-clw-gold/20 bg-clw-black-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- real coach and team photography */}
            <img
              src="/images/real/clw-wizards-coach-team-photo.jpg"
              alt="Wizards coaches and wrestlers together"
              className="h-full min-h-[420px] w-full object-cover object-center contrast-105 saturate-[0.8] lg:min-h-[620px]"
            />
          </div>

          <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">What Families Can Expect</p>
            <h2 className={SECTION_HEADING_CLASS}>
              <span className="block">High Standards.</span>
              <span className="block">Real Support.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-clw-gray sm:text-xl">
              The goal is not simply to create better wrestlers. It is to help young athletes become more confident, disciplined, coachable, and prepared to respond when things get difficult.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {EXPECTATIONS.map(({ title, body, icon: Icon }) => (
                <article key={title} className="border border-clw-gold/15 bg-clw-black/45 p-5">
                  <Icon className="h-6 w-6 text-clw-gold" />
                  <h3 className="mt-5 font-display text-3xl uppercase leading-none text-clw-white">{title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-clw-gray">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-light relative isolate overflow-hidden border-y border-clw-gold/25 bg-[#F7F7F7] py-14 text-clw-ink sm:py-16 lg:py-20">
        <div className="mission-frame relative">
          <div className="max-w-4xl">
            <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Finding the Right Training Group</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] sm:text-5xl">
              Coaches help place each wrestler where they can develop.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-clw-muted-dark sm:text-xl">
              Age and experience matter, but so do confidence, maturity, technique, and practice readiness. Families do not need to solve placement alone, and group assignments may change as a wrestler improves.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {GROUPS.map((group) => (
              <article key={group.name} className="chamfer-md border border-clw-ink/15 bg-[#FFFDF7] p-7 shadow-xl shadow-black/5">
                <p className="font-cond text-sm uppercase tracking-[0.24em] text-clw-gold">Practice Group</p>
                <h3 className="mt-5 font-display text-5xl uppercase leading-none text-clw-ink">{group.name}</h3>
                <p className="mt-4 font-semibold text-clw-ink">{group.label}</p>
                <p className="mt-3 text-lg leading-relaxed text-clw-muted-dark">{group.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mission-frame relative py-14 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black-2 p-7 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="flex items-center gap-3">
              <HeartHandshake className="h-6 w-6 text-clw-gold" />
              <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Your First Step</p>
            </div>
            <h2 className={SECTION_HEADING_CLASS}>
              <span className="block">Start With the Path</span>
              <span className="block">That Fits Your Family.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-clw-gray sm:text-xl">
              Some parents want to visit the facility, meet a coach, or ask questions before taking the next step. Others have already spoken with the club and are ready to begin setting up their family account.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-clw-gold/20 bg-clw-black/45 p-6">
                <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Not Sure Yet?</p>
                <h3 className="mt-4 font-display text-3xl uppercase leading-none text-clw-white">Ask About Joining</h3>
                <p className="mt-4 text-base leading-relaxed text-clw-gray">
                  Ask about visiting, beginner readiness, schedules, placement, or anything else your family needs to understand first.
                </p>
                <a
                  href={`mailto:${ORG.contactEmail}?subject=Interested%20in%20Wizards%20Wrestling`}
                  className="mt-6 inline-flex items-center gap-2 font-cond text-base uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l"
                >
                  Email the Club <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="border border-clw-gold/20 bg-clw-black/45 p-6">
                <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">Ready to Begin?</p>
                <h3 className="mt-4 font-display text-3xl uppercase leading-none text-clw-white">Create Your Account</h3>
                <p className="mt-4 text-base leading-relaxed text-clw-gray">
                  Create the parent account used for wrestler information, club communication, documents, dues, schedules, and tournaments.
                </p>
                <Link
                  href="/signup"
                  className="mt-6 inline-flex items-center gap-2 font-cond text-base uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l"
                >
                  Create Parent Account <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <p className="mt-6 border-l-2 border-clw-gold pl-4 text-sm leading-relaxed text-clw-gray">
              Completely new to the club? Contact us before arriving so we can confirm the appropriate visit or registration step for your family.
            </p>
          </div>

          <div className="overflow-hidden border border-clw-gold/20 bg-clw-black-2 lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- real club team outing photography */}
            <img
              src="/images/real/clw-wizards-youth-outing.jpg"
              alt="Wizards wrestlers enjoying time together away from the mat"
              className="h-full min-h-[440px] w-full object-cover object-center contrast-105 saturate-[0.85] lg:min-h-[650px]"
            />
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-y border-clw-gold/25 bg-clw-black-2 py-14 sm:py-16 lg:py-20">
        <div className="mission-frame relative grid gap-6 lg:grid-cols-12">
          <article className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black p-7 sm:p-8 lg:col-span-6 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">What to Bring</p>
            <h2 className={SECTION_HEADING_CLASS}>
              <span className="block">Keep the First Day</span>
              <span className="block">Simple.</span>
            </h2>
            <ul className="mt-7 space-y-5">
              {GEAR.map((item) => (
                <li key={item} className="flex gap-3 text-lg leading-relaxed text-clw-gray">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="chamfer-md card-depth border border-clw-gold/15 bg-clw-black p-7 sm:p-8 lg:col-span-6 lg:p-10">
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Understanding the Costs</p>
            <h2 className={SECTION_HEADING_CLASS}>
              <span className="block">Know the Categories</span>
              <span className="block">Before You Commit.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-clw-gray">
              Final seasonal amounts and deadlines should be confirmed directly with the club. New families should generally expect the following categories:
            </p>
            <ul className="mt-7 space-y-5">
              {COST_CATEGORIES.map((item) => (
                <li key={item} className="flex gap-3 text-lg leading-relaxed text-clw-gray">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/faq" className="mt-7 inline-flex items-center gap-2 font-cond text-base uppercase tracking-[0.16em] text-clw-gold hover:text-clw-gold-l">
              Review Current FAQ Details <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>

      <section className="mission-frame relative py-14 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">The First Few Weeks</p>
            <h2 className={SECTION_HEADING_CLASS}>
              <span className="block">Learn the Room.</span>
              <span className="block">Build From There.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-clw-gray sm:text-xl">
              Every wrestler develops at a different pace. The early goal is to establish comfort, coachability, safe habits, and a foundation the athlete can keep building on.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FIRST_WEEKS.map((step) => (
              <article key={step.number} className="border border-clw-gold/15 bg-clw-black-2 p-6">
                <p className="font-cond text-sm uppercase tracking-[0.22em] text-clw-gold">{step.number}</p>
                <h3 className="mt-4 font-display text-3xl uppercase leading-none text-clw-white">{step.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-clw-gray">{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { src: '/images/real/clw-wizards-youth-team-photo-2.jpg', alt: 'Wizards youth wrestling team together' },
            { src: '/images/real/clw-wizards-teen-photo.jpg', alt: 'Wizards teenage wrestlers together' },
            { src: '/images/real/clw-wizards-youth-win.jpg', alt: 'Wizards wrestlers celebrating a win' },
            { src: '/images/real/team_march2025.jpg', alt: 'Wizards wrestling team gathered together' },
          ].map((photo) => (
            <div key={photo.src} className="aspect-[4/3] overflow-hidden border border-clw-gold/20 bg-clw-black-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- real club photography */}
              <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
            </div>
          ))}
        </div>
      </section>

      <section className="section-light relative isolate overflow-hidden border-t border-clw-gold/25 bg-[#F7F7F7] py-14 text-clw-ink sm:py-16 lg:py-20">
        <div className="mission-frame relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div>
            <p className="font-cond text-sm uppercase tracking-[0.28em] text-clw-gold">Visit the Facility</p>
            <h2 className="mt-4 font-display text-4xl uppercase leading-[0.96] sm:text-5xl">
              See where the work happens.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-clw-muted-dark sm:text-xl">
              The Wizards train at 975 Nimco Drive, Unit L in Crystal Lake. Contact the club before arriving so someone can confirm the appropriate time and next step for your family.
            </p>

            <div className="mt-7 space-y-4 text-lg text-clw-muted-dark">
              <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-clw-ink">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-clw-gold" />
                <span>975 Nimco Dr, Unit L<br />Crystal Lake, IL 60014</span>
              </a>
              <a href={`mailto:${ORG.contactEmail}`} className="flex items-center gap-3 break-all hover:text-clw-ink">
                <Mail className="h-5 w-5 shrink-0 text-clw-gold" />
                <span>{ORG.contactEmail}</span>
              </a>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="chamfer-sm inline-flex min-h-12 items-center justify-center gap-2 bg-clw-gold px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
              >
                Get Directions <Navigation className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${ORG.contactEmail}?subject=Interested%20in%20Wizards%20Wrestling`}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-clw-ink/25 px-6 py-3 font-cond text-base uppercase tracking-[0.16em] text-clw-ink transition hover:border-clw-gold hover:text-clw-gold"
              >
                Ask a Question <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="overflow-hidden border border-clw-ink/20 bg-clw-black shadow-2xl shadow-black/15">
            {/* eslint-disable-next-line @next/next/no-img-element -- real facility photography */}
            <img src="/images/real/facility_pano.jpg" alt="Wizards Wrestling training facility" className="h-80 w-full object-cover contrast-105 saturate-[0.75] sm:h-[30rem]" />
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-clw-gold/25 bg-clw-black py-16 sm:py-20">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_50%_0%,rgba(240,192,32,.18),transparent_32%)]" />
        <div className="mission-frame relative text-center">
          <p className="font-cond text-sm uppercase tracking-[0.3em] text-clw-gold">Ready When You Are</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-5xl uppercase leading-[0.92] text-clw-white sm:text-6xl lg:text-7xl">
            Give your wrestler a room to work, compete, and grow.
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`mailto:${ORG.contactEmail}?subject=Interested%20in%20Wizards%20Wrestling`}
              className="chamfer-sm inline-flex min-h-[52px] items-center justify-center gap-2 bg-clw-gold px-7 py-4 font-cond text-base uppercase tracking-[0.16em] text-clw-black transition hover:bg-clw-gold-l"
            >
              Ask About Joining <Mail className="h-4 w-4" />
            </a>
            <Link
              href="/signup"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-clw-white/35 px-7 py-4 font-cond text-base uppercase tracking-[0.16em] text-clw-white transition hover:border-clw-gold hover:text-clw-gold"
            >
              Create Parent Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
