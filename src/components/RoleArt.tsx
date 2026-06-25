import { useRoleById } from './ui';

interface Props {
  roleId?: string;       // when omitted or 'unknown' -> question mark
  size?: number;
  color?: string;        // override
}

/**
 * Circular role emblem. Built-ins render inline SVG; custom roles render their
 * icon char/emoji. An unknown/blank role renders a "?" — used for unrevealed
 * cards and seats so nothing leaks before the mayor reveals.
 */
export function RoleArt({ roleId, size = 64, color }: Props) {
  const roleById = useRoleById();
  const role = roleId ? roleById[roleId] : undefined;
  const c = color ?? role?.color ?? '#8A93A8';
  const unknown = !role;

  return (
    <span
      className="roleart"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(120% 120% at 50% 30%, ${hex(c, 0.22)}, ${hex(c, 0.06)})`,
        border: `1.5px solid ${hex(c, 0.55)}`,
        boxShadow: `inset 0 0 ${size * 0.2}px ${hex(c, 0.15)}`,
        flex: '0 0 auto',
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
        {unknown ? <Unknown c={c} /> : <Emblem icon={role!.icon} c={c} char={role!.icon} />}
      </svg>
    </span>
  );
}

function Emblem({ icon, c, char }: { icon: string; c: string; char: string }) {
  switch (icon) {
    case 'mafia': return <Mafia c={c} />;
    case 'police': return <Police c={c} />;
    case 'doctor': return <Doctor c={c} />;
    case 'butterfly': return <Butterfly c={c} />;
    case 'citizen': return <Citizen c={c} />;
    default:
      // custom role: render the typed char/emoji centred
      return (
        <text x="24" y="24" dominantBaseline="central" textAnchor="middle" fontSize="26" fill={c}>
          {char}
        </text>
      );
  }
}

function Unknown({ c }: { c: string }) {
  return (
    <text x="24" y="25" dominantBaseline="central" textAnchor="middle" fontSize="30" fontWeight="700" fill={c}
      fontFamily="'Playfair Display', serif">?</text>
  );
}

function Mafia({ c }: { c: string }) {
  return (
    <g stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none">
      <path d="M8 18 C8 12 40 12 40 18 L42 21 L6 21 Z" fill={hex(c, 0.25)} />
      <ellipse cx="24" cy="21" rx="20" ry="3.5" />
      <path d="M16 27 a8 6 0 0 1 16 0" />
      <circle cx="18" cy="27" r="2.2" fill={c} />
      <circle cx="30" cy="27" r="2.2" fill={c} />
    </g>
  );
}

function Police({ c }: { c: string }) {
  // detective's magnifier — clean, valid geometry
  return (
    <g stroke={c} strokeWidth="2.4" strokeLinecap="round" fill="none">
      <circle cx="21" cy="20" r="8" fill={hex(c, 0.18)} />
      <line x1="27" y1="26" x2="37" y2="36" strokeWidth="3.2" />
    </g>
  );
}

function Doctor({ c }: { c: string }) {
  return (
    <g stroke={c} strokeWidth="2.4" strokeLinecap="round" fill="none">
      <rect x="10" y="14" width="28" height="22" rx="4" fill={hex(c, 0.18)} />
      <path d="M24 20 v10 M19 25 h10" />
    </g>
  );
}

function Butterfly({ c }: { c: string }) {
  return (
    <g stroke={c} strokeWidth="2" fill={hex(c, 0.22)}>
      <path d="M24 24 C14 10 6 16 10 24 C6 32 16 38 24 24" />
      <path d="M24 24 C34 10 42 16 38 24 C42 32 32 38 24 24" />
      <line x1="24" y1="14" x2="24" y2="34" stroke={c} fill="none" />
    </g>
  );
}

function Citizen({ c }: { c: string }) {
  return (
    <g stroke={c} strokeWidth="2.2" fill="none" strokeLinecap="round">
      <circle cx="24" cy="17" r="6" fill={hex(c, 0.18)} />
      <path d="M12 38 a12 10 0 0 1 24 0" fill={hex(c, 0.18)} />
    </g>
  );
}

/** Convert hex + alpha to rgba string. */
function hex(h: string, a: number): string {
  const m = h.replace('#', '');
  const full = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
