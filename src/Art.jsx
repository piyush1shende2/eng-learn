// Decorative SVGs inspired by the design board: airplane, leaves, mountains.
export const Plane = ({ size = 120 }) => (
  <svg width={size} viewBox="0 0 160 70" aria-hidden="true">
    <path d="M10 38 Q60 22 140 34 Q152 38 140 44 Q70 54 10 46Z" fill="#8fd1ae" />
    <path d="M70 36 L40 6 L58 6 L100 34Z" fill="#f2b8b0" />
    <path d="M70 46 L44 66 L60 66 L100 46Z" fill="#e8a79f" />
    <path d="M14 38 L4 22 L16 22 L28 36Z" fill="#6fb592" />
    <ellipse cx="108" cy="40" rx="9" ry="5" fill="#3f5b4e" />
    {[50, 64, 78, 92].map((x) => <circle key={x} cx={x} cy="39" r="2.4" fill="#fff" opacity=".9" />)}
  </svg>
);
export const Leaf = ({ size = 90, rot = 0, c1 = '#7fcf9e', c2 = '#4f9b78', style }) => (
  <svg width={size} viewBox="0 0 100 120" style={{ transform: `rotate(${rot}deg)`, ...style }} aria-hidden="true">
    <path d="M50 4 C95 30 95 90 50 116 C5 90 5 30 50 4Z" fill={c1} />
    <path d="M50 10 L50 114 M50 40 L24 28 M50 40 L76 28 M50 66 L20 54 M50 66 L80 54 M50 90 L28 80 M50 90 L72 80" stroke={c2} strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);
export const Mountains = ({ width = 220 }) => (
  <svg width={width} viewBox="0 0 220 90" aria-hidden="true">
    <path d="M0 90 L55 15 L95 70 L130 30 L220 90Z" fill="#f4a98a" />
    <path d="M55 15 L72 40 L60 36 L50 46Z" fill="#fbd9c8" />
    <path d="M0 90 Q50 60 110 80 T220 84 V90Z" fill="#8fd1ae" />
  </svg>
);
export const Scenery = () => (
  <div className="scenery" aria-hidden="true">
    <Leaf size={150} rot={-30} style={{ position: 'absolute', left: -40, top: 60 }} />
    <Leaf size={110} rot={25} c1="#a7e0bd" style={{ position: 'absolute', right: -20, top: 30 }} />
    <Leaf size={130} rot={-10} c1="#f4b9b0" c2="#d98f88" style={{ position: 'absolute', right: 10, bottom: 10 }} />
  </div>
);
