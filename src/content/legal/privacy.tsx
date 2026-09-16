const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@fiqr.app'
const EFFECTIVE_DATE = '17 September 2026'

const headingClass = 'text-[28px] font-bold leading-tight tracking-[-0.6px]'
const sectionClass = 'mt-8 text-[17px] font-bold'
const paragraphClass = 'mt-3 text-[15.5px] font-normal leading-[1.5] text-ink-80'
const listClass = 'mt-3 list-disc space-y-2 pl-5 text-[15.5px] leading-[1.5] text-ink-80'
const linkClass = 'font-semibold text-accent'

export function PrivacyContent() {
  return (
    <article>
      <h1 className={headingClass}>FIQR privacy policy</h1>
      <p className={paragraphClass}>Effective {EFFECTIVE_DATE}</p>

      <p className={paragraphClass}>
        FIQR is a fitness and nutrition coaching app. Its coach, Geo, uses what you log to give you a plan and daily advice. This policy explains what we collect, why, who processes it, and how to delete it.
      </p>

      <h2 className={sectionClass}>What we collect</h2>
      <ul className={listClass}>
        <li>Account: your email address and a password (stored by our authentication provider, never by us in plain text).</li>
        <li>Profile: name, date of birth, sex, height, weight, target weight, activity level, goals, training experience, equipment, injuries, dietary style, allergies and dietary restrictions.</li>
        <li>Logs: food, water, weight, sleep, mood, energy and workout entries, including the dates and times you choose.</li>
        <li>Photos: meal, menu and workout-program photos you choose to upload.</li>
        <li>Messages: what you write to Geo and Geo&apos;s replies.</li>
        <li>Device: a push-notification token if you turn notifications on, your app version and time zone.</li>
        <li>Usage: request logs (endpoint, status, timing) kept for reliability. We do not run advertising or analytics trackers.</li>
      </ul>

      <h2 className={sectionClass}>Why we use it</h2>
      <p className={paragraphClass}>
        To create and adjust your plan, estimate nutrition from photos and descriptions, run your weekly check-in, answer your questions, send the notifications you opt into, and keep the service secure. We do not sell personal data and we do not use health data for advertising.
      </p>

      <h2 className={sectionClass}>Who processes it</h2>
      <ul className={listClass}>
        <li>Supabase — database, authentication and file storage.</li>
        <li>Vercel — application hosting.</li>
        <li>Google (Gemini models), reached through OpenRouter — generates Geo&apos;s replies, plans and photo estimates. Your messages, logs, profile details and photos are sent to them for that purpose only. They act as our processors under their API terms and do not use this data to train models.</li>
        <li>Open Food Facts and USDA FoodData Central — food database lookups; only the food name you search is sent.</li>
        <li>Firebase Cloud Messaging (Google) and Apple Push Notification service — deliver notifications to your device if you opt in.</li>
      </ul>

      <h2 className={sectionClass}>Where it lives and how long</h2>
      <p className={paragraphClass}>
        Data is stored with Supabase on cloud infrastructure they operate. Photos are kept in private storage linked to your account. Everything is kept until you delete it or your account. Request logs are kept for 30 days.
      </p>

      <h2 className={sectionClass}>Your choices</h2>
      <ul className={listClass}>
        <li>Turn off AI processing in Settings › Data &amp; AI. Geo stops until you turn it back on.</li>
        <li>Turn off notifications in Settings or in your phone&apos;s settings.</li>
        <li>Download everything we hold about you from Settings › Data &amp; AI › Download my data.</li>
        <li>
          Delete your account from Settings › Delete account, or by visiting{' '}
          <a href="/delete-account" className={linkClass}>fiqr.app/delete-account</a>. Deletion removes your profile, logs, plans, check-ins, photos and messages within 24 hours; backups roll off within 30 days.
        </li>
      </ul>

      <h2 className={sectionClass}>Children</h2>
      <p className={paragraphClass}>FIQR is for people 18 and over.</p>

      <h2 className={sectionClass}>Security</h2>
      <p className={paragraphClass}>
        Data is encrypted in transit. Access to production systems is limited to the people who run FIQR.
      </p>

      <h2 className={sectionClass}>Changes</h2>
      <p className={paragraphClass}>
        We will update this page and the effective date when the policy changes.
      </p>

      <h2 className={sectionClass}>Contact</h2>
      <p className={paragraphClass}>
        <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>{SUPPORT_EMAIL}</a>
      </p>
    </article>
  )
}
