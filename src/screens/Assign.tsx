import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useT } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';

export function Assign() {
  const t = useT();
  const players = useStore((s) => s.players);
  const doReshuffle = useStore((s) => s.doReshuffle);
  const go = useStore((s) => s.go);

  const [spinning, setSpinning] = useState(true);

  useEffect(() => {
    setSpinning(true);
    const id = setTimeout(() => setSpinning(false), 1200);
    return () => clearTimeout(id);
  }, [players]);

  const n = players.length;
  const R = 42; // percent radius

  return (
    <div className="screen fadein">
      <TopBar />
      <div className="center">
        <div className="eyebrow">{t('assign_title')}</div>
        <p className="mute">{t('assign_spinning')}</p>
      </div>

      <div className="ring-wrap">
        <div className={'ring-rotor' + (spinning ? ' spinning' : '')} style={{ position: 'absolute', inset: 0 }}>
          {players.map((p, i) => {
            const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + R * Math.cos(ang);
            const y = 50 + R * Math.sin(ang);
            return (
              <div className="ring-seat" key={p.seat} style={{ left: `${x}%`, top: `${y}%` }}>
                {spinning ? (
                  <div className="seat-num">{p.seat}</div>
                ) : (
                  // settle to question marks — roles stay secret until the deal
                  <RoleArt roleId={undefined} size={56} />
                )}
              </div>
            );
          })}
        </div>
        <div className="ring-center">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: 'var(--lamp)' }}>{n}</div>
          <div className="mute" style={{ fontSize: 12 }}>{t('home_players')}</div>
        </div>
      </div>

      <div className="note center">{t('instr_short')}</div>

      <div className="spacer" />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn ghost grow" onClick={doReshuffle}>⟲ {t('reshuffle')}</button>
        <button className="btn primary grow" disabled={spinning} onClick={() => go('tally')}>{t('assign_seeResult')} →</button>
      </div>
    </div>
  );
}
