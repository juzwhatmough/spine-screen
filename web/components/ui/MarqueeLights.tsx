// Decorative row of 14 marquee bulbs across the top of the shelf and auth
// screens — see web/REDESIGN_SPEC.md section 4.1. Every third bulb
// (index % 3 === 1) is unlit. The twinkle animation lives in globals.css
// (.mq-bulb's `animation`) and is disabled under prefers-reduced-motion
// by the existing global `* { animation-duration: 0.001ms !important }`
// rule, so there's nothing extra to gate here.
export function MarqueeLights() {
  const bulbs = Array.from({ length: 14 }, (_, i) => i % 3 === 1);

  return (
    <div className="marquee-lights" aria-hidden="true">
      {bulbs.map((off, i) => (
        <span
          key={i}
          className={off ? "mq-bulb mq-bulb-off" : "mq-bulb"}
          style={off ? undefined : { animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}
