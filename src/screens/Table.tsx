import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useT, roleName, roleDesc, useRoleById, useNightSteps, Sheet, Modal } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { resolveRound, checkWin, generateStory, seatLabel } from '../game/engine';
import type { Player } from '../types';

type SheetKind = 'picks' | 'left' | 'log' | null;

export function Table() {
  const t = useT();
  const players = useStore((s) => s.players);
  const game = useStore((s) => s.game);
  const settings = useStore((s) => s.settings);
  const roleById = useRoleById();
  const nightSteps = useNightSteps();
  const startGame = useStore((s) => s.startGame);
  const addPick = useStore((s) => s.addPick);
  const proceedStep = useStore((s) => s.proceedStep);
  const commitResolution = useStore((s) => s.commitResolution);
  const finishGame = useStore((s) => s.finishGame);

  const [selected, setSelected] = useState<number | null>(null);
  const [inspect, setInspect] = useState<Player | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [resolving, setResolving] = useState(false);
  const [finishStep, setFinishStep] = useState(0); // 0 none, 1 first warn, 2 second warn

  const steps = useMemo(() => [...nightSteps, 'city'], [nightSteps]);
  const stepIdx = game.stepIdx;
  const currentStep = steps[stepIdx];
  const allStepsDone = stepIdx >= steps.length;

  const requiredFor = (step: string) =>
    step === 'city' ? 1 : settings.actionsPerRole[step] ?? 1;
  const picksThisStep = game.picks.filter((p) => p.stepId === currentStep);
  const remaining = currentStep ? requiredFor(currentStep) - picksThisStep.length : 0;

  const win = checkWin(players, roleById, settings);

  // doctor self-heal off → can't target the doctor's own seat
  const blockedSeat = useMemo(() => {
    if (currentStep !== 'doctor' || settings.doctorSelfHeal) return null;
    return players.find((p) => p.roleId === 'doctor')?.seat ?? null;
  }, [currentStep, settings.doctorSelfHeal, players]);

  const onSeatTap = (p: Player) => {
    if (!game.started) { setInspect(p); return; }
    if (allStepsDone || p.dead) return;
    if (blockedSeat === p.seat) return;
    setSelected(p.seat);
  };

  const proceed = () => {
    if (selected == null || !currentStep) return;
    addPick({ stepId: currentStep, targetSeat: selected });
    const newCount = picksThisStep.length + 1;
    setSelected(null);
    if (newCount >= requiredFor(currentStep)) proceedStep();
  };

  const targetedSeats = new Set(game.picks.filter((p) => p.stepId === 'mafia').map((p) => p.targetSeat));

  return (
    <div className="screen fadein">
      <TopBar />

      {win && (
        <div className={'banner ' + win}>
          <span>{win === 'town' ? '🏛' : '🔪'}</span>
          <span>{win === 'town' ? t('win_townTitle') : t('win_mafiaTitle')}</span>
          <span className="mute" style={{ fontWeight: 400, fontSize: 12, marginLeft: 'auto' }}>{t('win_suggest')}</span>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20 }}>
          {game.started ? `${t('table_round')} ${game.round}` : t('eyebrow')}
        </h2>
        <span className="mute" style={{ fontSize: 13 }}>
          {players.filter((p) => !p.dead).length} {t('table_alive')}
        </span>
      </div>

      <TableRing
        players={players}
        targeted={targetedSeats}
        selected={selected}
        onTap={onSeatTap}
        roleName={(p) => roleName(roleById[p.roleId], t)}
      />

      {!game.started ? (
        <>
          <div className="note center">{t('table_inspect')}</div>
          <div className="spacer" />
          <button className="btn primary" onClick={startGame}>{t('table_start')}</button>
        </>
      ) : (
        <>
          {/* step tabs */}
          <div className="steptabs">
            {steps.map((s, i) => (
              <div key={s + i} className={'steptab' + (i === stepIdx ? ' active' : i < stepIdx ? ' done' : '')}>
                {s === 'city' ? t('step_cityVote') : roleName(roleById[s], t)}
              </div>
            ))}
          </div>

          {/* prompt + proceed */}
          {!allStepsDone ? (
            <>
              <div className="promptbar">
                {currentStep !== 'city' && <RoleArt roleId={currentStep} size={40} />}
                <div className="ptext">
                  <div className="lead">
                    {currentStep === 'city' ? t('step_cityVote') : roleName(roleById[currentStep], t)}
                  </div>
                  <div className="sub">
                    {selected != null
                      ? `${t('seat')} ${selected} — ${seatLabel(players[selected - 1])}`
                      : t('table_tapTarget')}
                    {remaining > 1 ? `  ·  ${remaining}` : ''}
                  </div>
                </div>
              </div>
              {/* police check result inline */}
              {currentStep === 'police' && selected != null && (
                <div className="note center" style={{ marginBottom: 12 }}>
                  {seatLabel(players[selected - 1])}:{' '}
                  <strong style={{ color: roleById[players[selected - 1].roleId]?.team === 'mafia' ? 'var(--mafia)' : 'var(--doctor)' }}>
                    {roleById[players[selected - 1].roleId]?.team === 'mafia' ? t('check_isMafia') : t('check_notMafia')}
                  </strong>
                </div>
              )}
              <button className="btn primary" disabled={selected == null} onClick={proceed}>
                {t('table_proceed')} →
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={() => setResolving(true)}>{t('table_resolve')} →</button>
          )}

          {/* toolbar: subwindows + finish */}
          <div className="toolrow">
            <button className="toolbtn" onClick={() => setSheet('picks')}>🎯 {t('table_picks')}</button>
            <button className="toolbtn" onClick={() => setSheet('left')}>👥 {t('table_whosLeft')}</button>
            <button className="toolbtn" onClick={() => setSheet('log')}>📜 {t('table_log')}</button>
          </div>
          <button className="btn ghost" style={{ marginTop: 8, color: 'var(--danger)' }} onClick={() => setFinishStep(1)}>
            {t('table_finish')}
          </button>
        </>
      )}

      {/* Inspect (pre-game) */}
      <Sheet open={!!inspect} onClose={() => setInspect(null)} title={inspect ? seatLabel(inspect) : ''}>
        {inspect && (
          <div className="center" style={{ padding: '8px 0 16px' }}>
            <RoleArt roleId={inspect.roleId} size={96} />
            <h2 style={{ marginTop: 10, color: roleById[inspect.roleId]?.color }}>{roleName(roleById[inspect.roleId], t)}</h2>
            <p className="mute">{roleDesc(roleById[inspect.roleId], t)}</p>
          </div>
        )}
      </Sheet>

      <PicksSheet open={sheet === 'picks'} onClose={() => setSheet(null)} />
      <WhosLeftSheet open={sheet === 'left'} onClose={() => setSheet(null)} />
      <LogSheet open={sheet === 'log'} onClose={() => setSheet(null)} />

      {resolving && <ResolutionModal onClose={() => setResolving(false)} onCommit={(d, s, story) => {
        commitResolution(d, s, story);
        setResolving(false);
        setSelected(null);
      }} />}

      {/* Finish — two sequential warnings */}
      <Modal open={finishStep === 1} title={t('finish_warn1_title')} body={t('finish_warn1_body')}>
        <button className="btn danger" onClick={() => setFinishStep(2)}>{t('finish_yes')}</button>
        <button className="btn ghost" onClick={() => setFinishStep(0)}>{t('cancel')}</button>
      </Modal>
      <Modal open={finishStep === 2} title={t('finish_warn2_title')} body={t('finish_warn2_body')}>
        <button className="btn danger" onClick={finishGame}>{t('finish_reallyYes')}</button>
        <button className="btn ghost" onClick={() => setFinishStep(0)}>{t('cancel')}</button>
      </Modal>
    </div>
  );
}

// ---- Ring ---------------------------------------------------------------
function TableRing({ players, targeted, selected, onTap, roleName }: {
  players: Player[];
  targeted: Set<number>;
  selected: number | null;
  onTap: (p: Player) => void;
  roleName: (p: Player) => string;
}) {
  const n = players.length;
  const R = 40;
  return (
    <div className="table-ring">
      {players.map((p, i) => {
        const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + R * Math.cos(ang);
        const y = 50 + R * Math.sin(ang);
        const cls = 'tseat'
          + (p.dead ? ' dead' : '')
          + (targeted.has(p.seat) ? ' targeted' : '')
          + (selected === p.seat ? ' selected' : '');
        return (
          <div key={p.seat} className={cls} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => onTap(p)}>
            <RoleArt roleId={p.roleId} size={48} />
            <span className="nm">{p.seat}. {roleName(p)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Subwindows ---------------------------------------------------------
function PicksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const game = useStore((s) => s.game);
  const players = useStore((s) => s.players);
  const roleById = useRoleById();

  const tagFor = (stepId: string) =>
    stepId === 'mafia' ? { k: t('tag_targeted'), danger: true }
      : stepId === 'police' ? { k: t('tag_checked'), danger: false }
      : stepId === 'doctor' ? { k: t('tag_healed'), danger: false }
      : stepId === 'butterfly' ? { k: t('tag_silenced'), danger: false }
      : stepId === 'city' ? { k: t('tag_voted'), danger: true }
      : { k: t('tag_targeted'), danger: false };

  return (
    <Sheet open={open} onClose={onClose} title={t('table_picks')}>
      {game.picks.length === 0 && <p className="mute">{t('table_noPick')}</p>}
      {game.picks.map((p, i) => {
        const target = players[p.targetSeat - 1];
        const tag = tagFor(p.stepId);
        return (
          <div className="pick-row" key={i}>
            <RoleArt roleId={p.stepId === 'city' ? undefined : p.stepId} size={32} />
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{seatLabel(target)}</div>
              <div className="mute" style={{ fontSize: 12 }}>
                {p.stepId === 'city' ? t('step_cityVote') : roleName(roleById[p.stepId], t)}
              </div>
            </div>
            <span className={'tag' + (tag.danger ? ' danger' : '')}>{tag.k}</span>
          </div>
        );
      })}
    </Sheet>
  );
}

function WhosLeftSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const players = useStore((s) => s.players);
  const roleDefs = useStore((s) => s.roleDefs);

  const present = roleDefs.filter((r) => players.some((p) => p.roleId === r.id));

  return (
    <Sheet open={open} onClose={onClose} title={t('table_whosLeft')}>
      {present.map((r) => {
        const members = players.filter((p) => p.roleId === r.id);
        const alive = members.filter((p) => !p.dead).length;
        return (
          <div key={r.id}>
            <div className="group-head" style={{ color: r.color }}>
              <span>{roleName(r, t)}</span>
              <span>{alive}/{members.length}</span>
            </div>
            {members.map((p) => (
              <div className="left-row" key={p.seat} style={p.dead ? { opacity: 0.45 } : undefined}>
                <RoleArt roleId={p.roleId} size={28} />
                <span style={{ textDecoration: p.dead ? 'line-through' : 'none' }}>
                  {p.seat}. {seatLabel(p)}
                </span>
                <span className="mute" style={{ marginLeft: 'auto', fontSize: 12 }}>
                  {p.dead ? t('table_dead') : t('table_alive')}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </Sheet>
  );
}

function LogSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const game = useStore((s) => s.game);
  const players = useStore((s) => s.players);

  return (
    <Sheet open={open} onClose={onClose} title={t('table_log')}>
      {game.rounds.length === 0 && <p className="mute">{t('table_noPick')}</p>}
      {game.rounds.map((r) => {
        const dur = r.endTs ? Math.round((r.endTs - r.startTs) / 1000) : 0;
        const dead = r.deaths.map((s) => seatLabel(players[s - 1])).join(', ') || '—';
        return (
          <div className="log-round" key={r.round}>
            <div className="lr-head">
              <span>{t('table_round')} {r.round}</span>
              <span className="mute" style={{ fontSize: 12 }}>{dur}s</span>
            </div>
            {r.story && <p className="story-p">{r.story}</p>}
            <div className="mute" style={{ fontSize: 13 }}>☠ {dead}</div>
          </div>
        );
      })}
    </Sheet>
  );
}

// ---- Resolution ---------------------------------------------------------
function ResolutionModal({ onClose, onCommit }: {
  onClose: () => void;
  onCommit: (deaths: number[], saved: number[], story: string | undefined) => void;
}) {
  const t = useT();
  const game = useStore((s) => s.game);
  const players = useStore((s) => s.players);
  const settings = useStore((s) => s.settings);

  const res = useMemo(() => resolveRound(game.picks), [game.picks]);
  const [deaths, setDeaths] = useState<Set<number>>(new Set(res.suggestedDeaths));

  // candidate rows: anyone targeted/voted/saved, plus suggested
  const candidates = useMemo(() => {
    const set = new Set<number>([...res.suggestedDeaths, ...res.saved, ...res.cityVotes, ...res.mafiaTargets]);
    return [...set].sort((a, b) => a - b);
  }, [res]);

  const savedSet = new Set(res.saved);

  const toggle = (seat: number) => {
    setDeaths((prev) => {
      const next = new Set(prev);
      next.has(seat) ? next.delete(seat) : next.add(seat);
      return next;
    });
  };

  const confirm = () => {
    const deathArr = [...deaths];
    const deadNames = deathArr.map((s) => seatLabel(players[s - 1]));
    const savedNames = res.saved.map((s) => seatLabel(players[s - 1]));
    const story = settings.storyEnabled ? generateStory(game.round, deadNames, savedNames) : undefined;
    onCommit(deathArr, res.saved, story);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal fadein" style={{ maxWidth: 420 }}>
        <h2>{t('res_title')}</h2>
        <p className="mute">{t('res_sub')}</p>

        {res.saved.length > 0 && (
          <div className="note" style={{ margin: '12px 0' }}>
            🩺 {res.saved.map((s) => `${seatLabel(players[s - 1])} ${t('res_saved')}`).join(', ')}
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          {candidates.length === 0 && <p className="mute">{t('res_nobody')}</p>}
          {candidates.map((seat) => {
            const on = deaths.has(seat);
            const wasSaved = savedSet.has(seat);
            return (
              <button key={seat} className={'checkrow' + (on ? ' on' : '')} onClick={() => toggle(seat)}
                style={{ width: '100%', textAlign: 'left' }}>
                <span className="checkbox">{on ? '✓' : ''}</span>
                <span className="grow">{seat}. {seatLabel(players[seat - 1])}</span>
                {wasSaved && <span className="tag">🩺 {t('res_saved')}</span>}
              </button>
            );
          })}
        </div>

        <div className="col" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={confirm}>
            {deaths.size === 0 ? t('res_nobody') : t('res_confirmDeaths')}
          </button>
          <button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}
