import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { useT, roleName, roleDesc, useRoleById } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { seatLabel } from '../game/engine';

export function Deal() {
  const t = useT();
  const players = useStore((s) => s.players);
  const dealIdx = useStore((s) => s.dealIdx);
  const nextDeal = useStore((s) => s.nextDeal);
  const roleById = useRoleById();

  const [flipped, setFlipped] = useState(false);
  const [notrans, setNotrans] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  const player = players[dealIdx];
  const role = player ? roleById[player.roleId] : undefined;

  // ensure each new seat starts on the blank face
  useEffect(() => { setFlipped(false); }, [dealIdx]);

  if (!player) return null;

  const hideAndPass = () => {
    // No-peek flip (critical):
    // 1. snap back to the blank face with the transition disabled (instant)
    setNotrans(true);
    setFlipped(false);
    // 2. repopulate the front while hidden, then restore the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNotrans(false);
        nextDeal(); // advances dealIdx (or routes to gate after the last seat)
      });
    });
  };

  return (
    <div className="screen fadein">
      <TopBar />
      <div className="center">
        <div className="eyebrow">{t('seat')} {player.seat}</div>
        <h2 style={{ fontSize: 22, marginTop: 4 }}>
          {t('deal_passTo')} {seatLabel(player)}
        </h2>
        <p className="mute" style={{ fontSize: 13 }}>{flipped ? t('deal_secret') : t('deal_tap')}</p>
      </div>

      <div className="deal-wrap">
        <div className="deal-card" onClick={() => !flipped && setFlipped(true)}>
          <div
            ref={innerRef}
            className={'deal-card-inner' + (flipped ? ' flipped' : '') + (notrans ? ' notrans' : '')}
          >
            {/* FRONT — always the blank question-mark face (no role leak) */}
            <div className="deal-face front">
              <span className="qmark">?</span>
              <span className="mute" style={{ fontSize: 13 }}>{t('deal_tap')}</span>
            </div>
            {/* BACK — the secret role for this seat */}
            <div
              className="deal-face back"
              style={{ borderColor: role?.color, boxShadow: `0 0 40px ${role?.color}22` }}
            >
              <RoleArt roleId={player.roleId} size={120} />
              <div style={{ textAlign: 'center' }}>
                <div className="role-name" style={{ color: role?.color }}>
                  {t('deal_the')} {roleName(role, t)}
                </div>
                <div className="role-desc">{roleDesc(role, t)}</div>
              </div>
            </div>
          </div>
        </div>

        {flipped && (
          <button className="btn primary fadein" style={{ maxWidth: 240 }} onClick={hideAndPass}>
            {t('deal_hide')} →
          </button>
        )}
      </div>

      <div className="center mute" style={{ fontSize: 12 }}>
        {dealIdx + 1} / {players.length}
      </div>
    </div>
  );
}
