import { ANNOUNCEMENTS } from "@/lib/announcements";

// One run of the messages is repeated so a wide screen is always filled, and the whole strip is doubled so it can slide half its length
// and start again without a jump. Only the very first run is meant to be read aloud, because every other copy is the same words again.
const REPEATS = 6;
const SECONDS_PER_MESSAGE = 4; // keeps the speed the same however many messages there are

const Run = ({ readable }: { readable: boolean }) => (
  <div aria-hidden={readable ? undefined : true} className="flex flex-shrink-0 items-center">
    {ANNOUNCEMENTS.map((a) => (
      <span key={a.text} className="flex flex-shrink-0 items-center whitespace-nowrap">
        {a.href ? (
          <a
            href={a.href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={readable ? undefined : -1}
            className="underline decoration-[#FFC516] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC516]"
          >
            {a.text}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span>{a.text}</span>
        )}
        <span aria-hidden="true" className="px-6 text-[#FFC516] md:px-10">✦</span>
      </span>
    ))}
  </div>
);

// The slim strip above the header. It slides slowly, stops while a pointer or the keyboard is on it, and stays still, with the first run
// shown in full, for people who ask for less motion.
const AnnouncementBar = () => {
  if (ANNOUNCEMENTS.length === 0) return null;
  const seconds = ANNOUNCEMENTS.length * REPEATS * SECONDS_PER_MESSAGE;
  const group = (readableFirst: boolean) =>
    Array.from({ length: REPEATS }, (_, i) => <Run key={i} readable={readableFirst && i === 0} />);

  return (
    <div
      role="region"
      aria-label="Shop announcements"
      className="marquee overflow-hidden bg-[#1E2235] pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-[11px] font-semibold uppercase tracking-[0.14em] text-white md:text-xs"
    >
      <div className="marquee-track flex w-max" style={{ animationDuration: `${seconds}s` }}>
        <div className="flex flex-shrink-0">{group(true)}</div>
        <div aria-hidden="true" className="flex flex-shrink-0">{group(false)}</div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
