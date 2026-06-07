import { ArrowLeft, Users, Clock, Navigation, MapPin } from "lucide-react";
import { DateTime } from "luxon";
import { useStore } from "@/store/useStore";
import { useRoute, navigate, hrefFor } from "@/lib/router";
import { VenueCard } from "@/components/VenueCard";
import { MatchCard } from "@/components/MatchCard";
import { StadiumArt } from "@/components/StadiumArt";
import { SectionTitle } from "@/components/ui";
import { STAGE_LABEL } from "@/components/ui";
import { sortedMatches } from "@/store/useStore";

const FLAG: Record<string, string> = { USA: "🇺🇸", Canada: "🇨🇦", Mexico: "🇲🇽" };

function VenueDetail({ id }: { id: string }) {
  const data = useStore((s) => s.data)!;
  const venue = data.venues.find((v) => v.id === id);
  if (!venue) return <p className="text-ink-muted">Venue not found.</p>;

  const matches = sortedMatches(data.matches.filter((m) => m.venueId === venue.id));
  const stages = [...new Set(matches.map((m) => m.stage))];
  const localNow = DateTime.now().setZone(venue.tz).toFormat("HH:mm");

  const facts: { label: string; value: string }[] = [
    { label: "City", value: `${venue.city}, ${venue.country}` },
    { label: "Capacity", value: venue.capacity.toLocaleString("en-US") },
    { label: "Coordinates", value: `${venue.lat.toFixed(4)}, ${venue.lng.toFixed(4)}` },
    { label: "Timezone", value: `${venue.tz} · ${localNow} now` },
    { label: "Matches hosted", value: String(matches.length) },
    { label: "Stages", value: stages.map((s) => STAGE_LABEL[s]).join(", ") || "—" },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/venues")} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> All venues
      </button>

      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="relative">
          <StadiumArt venue={venue} className="h-48 w-full sm:h-56" />
          <div className="absolute inset-0 bg-gradient-to-t from-pitch-900 to-transparent" />
          <div className="absolute bottom-4 left-5">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span>{FLAG[venue.country]}</span> {venue.city}, {venue.country}
            </div>
            <h1 className="h-display text-2xl text-ink sm:text-3xl">{venue.stadium}</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          <div className="chip"><Users size={13} /> {venue.capacity.toLocaleString("en-US")}</div>
          <div className="chip"><Clock size={13} /> {localNow} local</div>
          <a
            className="chip hover:border-gold/40 hover:text-gold"
            href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={13} /> Open in maps
          </a>
        </div>
      </div>

      <div className="glass p-5">
        <h2 className="mb-3 h-display text-lg text-ink">Stadium facts</h2>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="bg-pitch-900/60 p-3">
              <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{f.label}</dt>
              <dd className="mt-0.5 text-sm text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <SectionTitle title="Hosted matches" subtitle={`${matches.length} matches at ${venue.stadium}`} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Venues() {
  const data = useStore((s) => s.data)!;
  const { params } = useRoute();
  const v = params.get("v");
  if (v) return <VenueDetail id={v} />;

  const byCountry = (c: string) => data.venues.filter((venue) => venue.country === c);

  return (
    <div className="space-y-6">
      <SectionTitle title="Host venues" subtitle="16 stadiums across three nations" />
      {(["USA", "Canada", "Mexico"] as const).map((country) => (
        <section key={country}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <MapPin size={14} /> {FLAG[country]} {country}
            <span className="text-ink-faint">· {byCountry(country).length} venues</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byCountry(country).map((venue) => (
              <VenueCard key={venue.id} venue={venue} matches={data.matches} />
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-ink-faint">
        Tip: open any venue from a <a className="text-gold hover:underline" href={hrefFor("/matches")}>match</a> to see all its fixtures.
      </p>
    </div>
  );
}
