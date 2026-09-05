/*
  Brand illustration — a flat, low-bandwidth scene echoing the NayaGhar logo:
  Himalayan peaks, a warm house, city buildings and green hills, in the logo's
  own palette (orange / blue / gold / green + a Nepal-flag swoosh). Inline SVG,
  no network cost. Colors are hard-coded hex so the illustration always reads as
  the logo combo regardless of theme resolution.
*/

const C = {
  sun: "#E6A81E",
  gold: "#F2C230",
  blueDeep: "#0B5997",
  blueMid: "#2E7DA6",
  blueBright: "#1E6FA8",
  orange: "#CC560C",
  roof: "#A8450A",
  door: "#7A3208",
  green: "#3F8E3F",
  greenLight: "#5FA83F",
  snow: "#F7F3EA",
  red: "#C23B2B",
};

export function CityscapeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a home and city buildings nestled in the Himalayan hills"
    >
      {/* sun */}
      <circle cx="66" cy="62" r="26" fill={C.sun} />
      <circle cx="66" cy="62" r="26" fill={C.gold} opacity="0.35" />

      {/* mountains */}
      <path d="M-10 178 L96 70 L196 178 Z" fill={C.blueMid} />
      <path d="M120 178 L236 46 L352 178 Z" fill={C.blueDeep} />
      <path d="M300 178 L404 78 L500 178 Z" fill={C.blueMid} />
      {/* snow caps */}
      <path d="M214 66 L236 46 L258 66 L246 60 L236 71 L226 60 Z" fill={C.snow} />
      <path d="M386 96 L404 78 L422 96 L413 91 L404 100 L395 91 Z" fill={C.snow} />

      {/* city buildings (behind the house line) */}
      <rect x="120" y="104" width="30" height="80" rx="3" fill={C.blueDeep} />
      <rect x="156" y="122" width="26" height="62" rx="3" fill={C.greenLight} />
      <rect x="316" y="112" width="28" height="72" rx="3" fill={C.blueBright} />
      <rect x="348" y="126" width="24" height="58" rx="3" fill={C.blueDeep} />
      {/* lit windows (gold) */}
      {[112, 128, 144, 160].map((y) =>
        [126, 138].map((x) => (
          <rect key={`a${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" fill={C.gold} />
        ))
      )}
      {[130, 146, 162].map((y) => (
        <rect key={`b${y}`} x="164" y={y} width="6" height="8" rx="1" fill={C.gold} />
      ))}
      {[120, 136, 152, 168].map((y) =>
        [322, 334].map((x) => (
          <rect key={`c${x}-${y}`} x={x} y={y} width="6" height="8" rx="1" fill={C.snow} opacity="0.85" />
        ))
      )}

      {/* house (the warm heart of the scene) */}
      <rect x="224" y="128" width="72" height="54" rx="4" fill={C.orange} />
      <path d="M216 130 L260 94 L304 130 Z" fill={C.roof} />
      <rect x="252" y="150" width="16" height="32" rx="2" fill={C.door} />
      <rect x="232" y="140" width="14" height="14" rx="2" fill={C.gold} />
      <rect x="274" y="140" width="14" height="14" rx="2" fill={C.gold} />

      {/* green hills, foreground — softly overlap the building/house bases */}
      <path d="M-10 176 Q110 152 240 172 T500 168 L500 260 L-10 260 Z" fill={C.green} />
      <path d="M-10 196 Q160 178 320 194 T500 190 L500 260 L-10 260 Z" fill={C.greenLight} opacity="0.55" />

      {/* Nepal-flag swoosh */}
      <path d="M-10 224 Q240 198 500 224" stroke={C.red} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M-10 236 Q240 210 500 236" stroke={C.blueDeep} strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* Full-bleed soft sky + clouds — a calm backdrop for the auth screens.
   Uses the logo's sky blue fading to warm paper, with clouds rising from the
   base. Rendered as one SVG (gradient + shapes) so it stays crisp full-screen. */
export function CloudsBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ng-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A6D0EC" />
          <stop offset="0.42" stopColor="#CBE3F3" />
          <stop offset="0.72" stopColor="#EAF3F9" />
          <stop offset="1" stopColor="#FBF7EF" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#ng-sky)" />
      {/* faint horizon arc, echoing the reference */}
      <path d="M-60 640 Q720 400 1500 640" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.5" fill="none" />
      {/* clouds rising from the base */}
      <g fill="#FFFFFF">
        <ellipse cx="230" cy="900" rx="420" ry="180" opacity="0.72" />
        <ellipse cx="760" cy="930" rx="560" ry="210" opacity="0.9" />
        <ellipse cx="1250" cy="895" rx="440" ry="185" opacity="0.72" />
        <ellipse cx="470" cy="820" rx="220" ry="96" opacity="0.5" />
        <ellipse cx="1030" cy="805" rx="240" ry="96" opacity="0.5" />
      </g>
    </svg>
  );
}

/* Compact roofline motif for empty states / quiet spots. */
export function RooflineMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 74 L34 40 L64 74 Z" fill={C.blueMid} />
      <path d="M44 74 L78 34 L112 74 Z" fill={C.blueDeep} />
      <path d="M66 60 L86 48 L86 74 L66 74 Z" fill={C.orange} />
      <path d="M60 60 L86 44 L112 60 Z" fill={C.roof} />
      <path d="M0 74 Q60 66 120 74" stroke={C.green} strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
