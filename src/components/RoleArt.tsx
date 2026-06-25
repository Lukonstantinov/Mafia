import { useRoleById } from './ui';

interface Props {
  roleId?: string;       // when omitted or unknown -> question mark
  size?: number;
  color?: string;        // override
}

// Built-in roles ship as real PNG art in /public/roles/<id>.png
const ART: Record<string, string> = {
  mafia: 'roles/mafia.png',
  police: 'roles/police.png',
  doctor: 'roles/doctor.png',
  butterfly: 'roles/butterfly.png',
  citizen: 'roles/citizen.png',
};

/**
 * Circular role emblem. Built-ins render the illustrated PNG art; custom roles
 * render their icon char/emoji; an unknown/blank role renders a "?" — used for
 * unrevealed cards and seats so nothing leaks before the mayor reveals.
 */
export function RoleArt({ roleId, size = 64, color }: Props) {
  const roleById = useRoleById();
  const role = roleId ? roleById[roleId] : undefined;
  const c = color ?? role?.color ?? '#8A93A8';
  const art = role && ART[role.id];

  // slight colored halo at the edge, in the role's own colour
  const glow = Math.max(2, Math.round(size * 0.05));
  const frame: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: `1.5px solid ${hex(c, 0.55)}`,
    filter: `drop-shadow(0 0 ${glow}px ${hex(c, 0.6)})`,
    flex: '0 0 auto',
  };

  if (art) {
    return (
      <span className="roleart" style={frame}>
        <img
          src={import.meta.env.BASE_URL + art}
          width={size}
          height={size}
          alt=""
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      </span>
    );
  }

  // custom role or unknown -> drawn circle
  return (
    <span
      className="roleart"
      style={{
        ...frame,
        background: `radial-gradient(120% 120% at 50% 30%, ${hex(c, 0.22)}, ${hex(c, 0.06)})`,
        boxShadow: `inset 0 0 ${size * 0.2}px ${hex(c, 0.15)}`,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
        {role ? (
          <text x="24" y="24" dominantBaseline="central" textAnchor="middle" fontSize="26" fill={c}>
            {role.icon}
          </text>
        ) : (
          <text x="24" y="25" dominantBaseline="central" textAnchor="middle" fontSize="30" fontWeight="700"
            fill={c} fontFamily="'Playfair Display', serif">?</text>
        )}
      </svg>
    </span>
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
