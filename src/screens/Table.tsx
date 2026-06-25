import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useT, roleName, roleDesc, useRoleById, useNightSteps, Sheet, Modal } from '../components/ui';
import { TopBar } from '../components/TopBar';
import { RoleArt } from '../components/RoleArt';
import { SeatTable, type TableView } from '../components/SeatTable';
import { resolveRound, checkWin, generateStory, seatLabel, topTwo, leaders, computeStats } from '../game/engine';
import type { Player } from '../types';

type SheetKind = 'picks' | 'left' | 'log' | 'stats' | null;

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
  const reorderSeats = useStore((s) => s.reorderSeats);
  const revealNight = useStore((s) => s.revealNight);
  const confirmNightDeaths = useStore((s) => s.confirmNightDeaths);
  const commitVote = useStore((s) => s.commitVote);
  const finishGame = useStore((s) => s.finishGame);

  const [selected, setSelected] = useState<number | null>(null);
  const [inspect, setInspect] = useState<Player | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [finishStep, setFinishStep] = useState(0);

  // table layout controls
  const [view, setView] = useState<TableView>('circle');
  const [zoom, setZoom] = useState(1);
  const [rearrange, setRearrange] = useState(false);
  const seatOrder = game.seatOrder.length ? game.seatOrder : players.map((p) => p.seat);

  // day-vote local state
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [voteStage, setVoteStage] = useState<1 | 2>(1);
  const [votes1, setVotes1] = useState<Record<number, number>>({});
  const [runoff, setRunoff] = useState<number[]>([]);
  const [confirmOut, setConfirmOut] = useState<number | null | undefined>(undefined); // undefined=closed

  const steps = nightSteps;
  const stepIdx = game.stepIdx;
  const currentStep = steps[stepIdx];
  const nightDone = stepIdx >= steps.length;
  const win = checkWin(players, roleById, settings);
  const alive = players.filter((p) => !p.dead);

  const requiredFor = (step: string) => settings.actionsPerRole[step] ?? 1;
  const picksThisStep = game.picks.filter((p) => p.stepId === currentStep);

  const blockedSeat = useMemo(() => {
    if (currentStep !== 'doctor' || settings.doctorSelfHeal) return null;
    return players.find((p) => p.roleId === 'doctor')?.seat ?? null;
  }, [currentStep, settings.doctorSelfHeal, players]);

  const targetedSeats = new Set(game.picks.filter((p) => p.stepId === 'mafia').map((p) => p.targetSeat));

  // ---- night handlers ----
  const onSeatTapNight = (p: Player) => {
    if (nightDone || p.dead || blockedSeat === p.seat) return;
    setSelected(p.seat);
  };
  const proceed = () => {
    if (selected == null || !currentStep) return;
    addPick({ stepId: currentStep, targetSeat: selected });
    const newCount = picksThisStep.length + 1;
    setSelected(null);
    if (newCount >= requiredFor(currentStep)) proceedStep();
  };

  // ---- vote handlers ----
  const addVote = (seat: number) => setVotes((v) => ({ ...v, [seat]: (v[seat] ?? 0) + 1 }));
  const lockVotes = () => {
    const pair = topTwo(votes);
    setVotes1(votes);
    if (pair.length <= 1) {
      // unanimous / single candidate -> straight to confirm
      setConfirmOut(pair[0] ?? null);
    } else {
      setRunoff(pair);
      setVotes({});
      setVoteStage(2);
    }
  };
  const finishRunoff = () => {
    const lead = leaders(votes);
    setConfirmOut(lead[0] ?? null);
  };
  const doCommit = (votedOut: number | null) => {
    const v2 = voteStage === 2 ? votes : {};
    const nightNames = game.nightDeaths.map((s) => seatLabel(players[s - 1]));
    const outName = votedOut != null ? [seatLabel(players[votedOut - 1])] : [];
    const savedNames = resolveRound(game.picks).saved.map((s) => seatLabel(players[s - 1]));
    const story = settings.storyEnabled
      ? generateStory(game.round, [...nightNames, ...outName], savedNames)
      : undefined;
    commitVote(votes1, v2, votedOut, story);
    // reset local vote state for next round
    setVotes({}); setVotes1({}); setVoteStage(1); setRunoff([]); setConfirmOut(undefined); setSelected(null);
  };

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
        <span className="mute" style={{ fontSize: 13 }}>{alive.length} {t('table_alive')}</span>
      </div>

      <SeatTable
        players={players}
        seatOrder={seatOrder}
        view={view}
        zoom={zoom}
        rearrange={rearrange}
        targeted={targetedSeats}
        selected={selected}
        votes={game.phase === 'vote' && game.started ? votes : undefined}
        runoff={game.phase === 'vote' && voteStage === 2 ? runoff : undefined}
        onReorder={reorderSeats}
        onTap={(p) => {
          if (!game.started) { setInspect(p); return; }
          if (game.phase === 'night') onSeatTapNight(p);
          else if (game.phase === 'vote' && !p.dead) {
            if (voteStage === 2 && !runoff.includes(p.seat)) return;
            addVote(p.seat);
          }
        }}
        label={(p) => `${p.seat}. ${roleName(roleById[p.roleId], t)}`}
      />

      <div className="table-controls">
        <div className="seg">
          <button className={view === 'circle' ? 'on' : ''} onClick={() => setView('circle')}>◯ {t('view_circle')}</button>
          <button className={view === 'square' ? 'on' : ''} onClick={() => setView('square')}>▢ {t('view_square')}</button>
        </div>
        <div className="seg">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}>−</button>
          <span className="zoomval">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))}>+</button>
        </div>
        {game.started && (
          <button className={'seg-btn' + (rearrange ? ' on' : '')} onClick={() => setRearrange((r) => !r)}>
            ⇅ {t('view_rearrange')}
          </button>
        )}
      </div>
      {rearrange && <div className="note center" style={{ marginBottom: 10 }}>{t('view_rearrangeHint')}</div>}

      {!game.started ? (
        <>
          <div className="note center">{t('table_inspect')}</div>
          <div className="spacer" />
          <button className="btn primary" onClick={startGame}>{t('table_start')}</button>
        </>
      ) : game.phase === 'night' ? (
        <NightControls
          steps={steps} stepIdx={stepIdx} nightDone={nightDone} currentStep={currentStep}
          selected={selected} players={players} roleById={roleById}
          onProceed={proceed} onReveal={revealNight}
        />
      ) : game.phase === 'dawn' ? (
        <DawnReport players={players} onConfirm={(deaths, saved) => confirmNightDeaths(deaths, saved)} />
      ) : (
        <VoteControls
          stage={voteStage} votes={votes} runoff={runoff} players={players}
          onReset={() => setVotes({})}
          onLock={lockVotes} onFinishRunoff={finishRunoff}
          onSkip={() => setConfirmOut(null)}
        />
      )}

      {game.started && (
        <>
          <div className="toolrow">
            <button className="toolbtn" onClick={() => setSheet('picks')}>🎯</button>
            <button className="toolbtn" onClick={() => setSheet('left')}>👥</button>
            <button className="toolbtn" onClick={() => setSheet('log')}>📜</button>
            <button className="toolbtn" onClick={() => setSheet('stats')}>📊</button>
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
      <StatsSheet open={sheet === 'stats'} onClose={() => setSheet(null)} />

      {/* Vote-out confirm */}
      <VoteOutConfirm
        open={confirmOut !== undefined}
        candidates={voteStage === 2 ? runoff : topTwo(votes1)}
        preselect={confirmOut ?? null}
        players={players}
        votes={voteStage === 2 ? votes : votes1}
        onCancel={() => setConfirmOut(undefined)}
        onConfirm={doCommit}
      />

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

// ---- Night controls -----------------------------------------------------
function NightControls({ steps, stepIdx, nightDone, currentStep, selected, players, roleById, onProceed, onReveal }: {
  steps: string[]; stepIdx: number; nightDone: boolean; currentStep: string | undefined;
  selected: number | null; players: Player[]; roleById: Record<string, any>;
  onProceed: () => void; onReveal: () => void;
}) {
  const t = useT();
  return (
    <>
      <div className="steptabs">
        {steps.map((s, i) => (
          <div key={s + i} className={'steptab' + (i === stepIdx ? ' active' : i < stepIdx ? ' done' : '')}>
            {roleName(roleById[s], t)}
          </div>
        ))}
        <div className={'steptab' + (nightDone ? ' active' : '')}>{t('step_cityVote')}</div>
      </div>

      {!nightDone ? (
        <>
          <div className="promptbar">
            <RoleArt roleId={currentStep} size={40} />
            <div className="ptext">
              <div className="lead">{roleName(roleById[currentStep!], t)}</div>
              <div className="sub">
                {selected != null
                  ? `${t('seat')} ${selected} — ${seatLabel(players[selected - 1])}`
                  : t('table_tapTarget')}
              </div>
            </div>
          </div>
          {currentStep === 'police' && selected != null && (
            <div className="note center" style={{ marginBottom: 12 }}>
              {seatLabel(players[selected - 1])}:{' '}
              <strong style={{ color: roleById[players[selected - 1].roleId]?.team === 'mafia' ? 'var(--mafia)' : 'var(--doctor)' }}>
                {roleById[players[selected - 1].roleId]?.team === 'mafia' ? t('check_isMafia') : t('check_notMafia')}
              </strong>
            </div>
          )}
          <button className="btn primary" disabled={selected == null} onClick={onProceed}>
            {t('table_proceed')} →
          </button>
        </>
      ) : (
        <>
          <div className="note center">{t('dawn_ready')}</div>
          <button className="btn primary" onClick={onReveal}>☀ {t('dawn_reveal')} →</button>
        </>
      )}
    </>
  );
}

// ---- Dawn report --------------------------------------------------------
function DawnReport({ players, onConfirm }: {
  players: Player[]; onConfirm: (deaths: number[], saved: number[]) => void;
}) {
  const t = useT();
  const game = useStore((s) => s.game);
  const res = useMemo(() => resolveRound(game.picks), [game.picks]);
  const [deaths, setDeaths] = useState<Set<number>>(new Set(res.suggestedDeaths));

  const candidates = useMemo(
    () => [...new Set([...res.suggestedDeaths, ...res.saved, ...res.mafiaTargets])].sort((a, b) => a - b),
    [res],
  );
  const savedSet = new Set(res.saved);
  const toggle = (s: number) => setDeaths((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  return (
    <>
      <div className="phase-head">
        <span className="icon">☀</span>
        <div><div className="lead">{t('dawn_title')}</div><div className="sub">{t('dawn_sub')}</div></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        {res.mafiaTargets.length === 0 && <div className="report-line"><span className="ic">🌙</span><span className="mute">{t('dawn_quiet')}</span></div>}
        {res.mafiaTargets.map((s) => (
          <div className="report-line" key={'m' + s}>
            <span className="ic">🔪</span>
            <span className="grow">{seatLabel(players[s - 1])}</span>
            <span className={'tag' + (savedSet.has(s) ? '' : ' danger')}>
              {savedSet.has(s) ? `🩺 ${t('res_saved')}` : t('tag_targeted')}
            </span>
          </div>
        ))}
      </div>

      <div className="mute" style={{ fontSize: 13, margin: '6px 0' }}>{t('dawn_confirm')}</div>
      {candidates.length === 0 && <p className="mute">{t('res_nobody')}</p>}
      {candidates.map((s) => {
        const on = deaths.has(s);
        return (
          <button key={s} className={'checkrow' + (on ? ' on' : '')} onClick={() => toggle(s)} style={{ width: '100%' }}>
            <span className="checkbox">{on ? '✓' : ''}</span>
            <span className="grow" style={{ textAlign: 'left' }}>{s}. {seatLabel(players[s - 1])}</span>
            {savedSet.has(s) && <span className="tag">🩺 {t('res_saved')}</span>}
          </button>
        );
      })}

      <button className="btn primary" style={{ marginTop: 12 }} onClick={() => onConfirm([...deaths], res.saved)}>
        {t('dawn_toVote')} →
      </button>
    </>
  );
}

// ---- Vote controls ------------------------------------------------------
function VoteControls({ stage, votes, runoff, players, onReset, onLock, onFinishRunoff, onSkip }: {
  stage: 1 | 2; votes: Record<number, number>; runoff: number[]; players: Player[];
  onReset: () => void; onLock: () => void; onFinishRunoff: () => void; onSkip: () => void;
}) {
  const t = useT();
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const tally = Object.entries(votes).map(([s, v]) => [Number(s), v] as [number, number])
    .filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="phase-head">
        <span className="icon">{stage === 1 ? '⚖' : '🥊'}</span>
        <div>
          <div className="lead">{stage === 1 ? t('vote_title') : t('vote_runoffTitle')}</div>
          <div className="sub">{stage === 1 ? t('vote_sub') : t('vote_runoffSub')}</div>
        </div>
      </div>

      {tally.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {tally.map(([s, v]) => (
            <div className="pick-row" key={s}>
              <span className="grow">{s}. {seatLabel(players[s - 1])}</span>
              <span className="tag">{v} {t('vote_votes')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="row">
        <button className="toolbtn" onClick={onReset}>↺ {t('vote_reset')}</button>
        {stage === 1 ? (
          <button className="btn primary grow" disabled={total === 0} onClick={onLock}>{t('vote_lock')} →</button>
        ) : (
          <button className="btn primary grow" disabled={total === 0} onClick={onFinishRunoff}>{t('vote_confirmOut')} →</button>
        )}
      </div>
      {stage === 1 && (
        <button className="btn ghost" style={{ marginTop: 8 }} onClick={onSkip}>{t('vote_skip')}</button>
      )}
      <div className="mute center" style={{ fontSize: 12, marginTop: 8 }}>
        {runoff.length > 0 && stage === 2 ? `${t('vote_between')} ${runoff.map((s) => seatLabel(players[s - 1])).join(' · ')}` : ''}
      </div>
    </>
  );
}

// ---- Vote-out confirm modal --------------------------------------------
function VoteOutConfirm({ open, candidates, preselect, players, votes, onCancel, onConfirm }: {
  open: boolean; candidates: number[]; preselect: number | null;
  players: Player[]; votes: Record<number, number>;
  onCancel: () => void; onConfirm: (seat: number | null) => void;
}) {
  const t = useT();
  const [sel, setSel] = useState<number | null>(preselect);
  // keep selection in sync when the modal (re)opens
  useEffect(() => { setSel(preselect); }, [preselect, open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal fadein" style={{ maxWidth: 400 }}>
        <h2>{t('vote_outTitle')}</h2>
        <p className="mute">{t('vote_outSub')}</p>
        <div style={{ marginTop: 10 }}>
          {candidates.length === 0 && <p className="mute">{t('res_nobody')}</p>}
          {candidates.map((s) => (
            <button key={s} className={'checkrow' + (sel === s ? ' on' : '')} onClick={() => setSel(s)} style={{ width: '100%' }}>
              <span className="checkbox">{sel === s ? '✓' : ''}</span>
              <span className="grow" style={{ textAlign: 'left' }}>{s}. {seatLabel(players[s - 1])}</span>
              <span className="tag">{votes[s] ?? 0} {t('vote_votes')}</span>
            </button>
          ))}
        </div>
        <div className="col" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={() => onConfirm(sel)}>{t('vote_eliminate')}</button>
          <button className="btn ghost" onClick={() => onConfirm(null)}>{t('vote_noOne')}</button>
          <button className="btn ghost" onClick={onCancel}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ---- Ring ---------------------------------------------------------------
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
      : { k: t('tag_targeted'), danger: false };

  return (
    <Sheet open={open} onClose={onClose} title={t('table_picks')}>
      {game.picks.length === 0 && <p className="mute">{t('table_noPick')}</p>}
      {game.picks.map((p, i) => {
        const target = players[p.targetSeat - 1];
        const tag = tagFor(p.stepId);
        return (
          <div className="pick-row" key={i}>
            <RoleArt roleId={p.stepId} size={32} />
            <div className="grow">
              <div style={{ fontWeight: 600 }}>{seatLabel(target)}</div>
              <div className="mute" style={{ fontSize: 12 }}>{roleName(roleById[p.stepId], t)}</div>
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
        const aliveN = members.filter((p) => !p.dead).length;
        return (
          <div key={r.id}>
            <div className="group-head" style={{ color: r.color }}>
              <span>{roleName(r, t)}</span><span>{aliveN}/{members.length}</span>
            </div>
            {members.map((p) => (
              <div className="left-row" key={p.seat} style={p.dead ? { opacity: 0.45 } : undefined}>
                <RoleArt roleId={p.roleId} size={28} />
                <span style={{ textDecoration: p.dead ? 'line-through' : 'none' }}>{p.seat}. {seatLabel(p)}</span>
                <span className="mute" style={{ marginLeft: 'auto', fontSize: 12 }}>{p.dead ? t('table_dead') : t('table_alive')}</span>
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
        const night = r.deaths.map((s) => seatLabel(players[s - 1])).join(', ') || '—';
        const out = r.votedOut != null ? seatLabel(players[r.votedOut - 1]) : '—';
        return (
          <div className="log-round" key={r.round}>
            <div className="lr-head"><span>{t('table_round')} {r.round}</span><span className="mute" style={{ fontSize: 12 }}>{dur}s</span></div>
            {r.story && <p className="story-p">{r.story}</p>}
            <div className="mute" style={{ fontSize: 13 }}>🌙 {t('dawn_title')}: {night}</div>
            <div className="mute" style={{ fontSize: 13 }}>⚖ {t('tag_voted')}: {out}</div>
          </div>
        );
      })}
    </Sheet>
  );
}

function StatsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const game = useStore((s) => s.game);
  const players = useStore((s) => s.players);
  const stats = useMemo(() => computeStats(game.rounds, players), [game.rounds, players]);
  return (
    <Sheet open={open} onClose={onClose} title={t('stats_title')}>
      <div className="stat-row head">
        <span className="nm">{t('seat')}</span>
        <span className="v" title={t('tag_targeted')}>🔪</span>
        <span className="v" title={t('tag_checked')}>🔍</span>
        <span className="v" title={t('tag_healed')}>🩺</span>
        <span className="v" title={t('tag_silenced')}>🦋</span>
        <span className="v" title={t('vote_votes')}>⚖</span>
        <span className="tot">Σ</span>
      </div>
      {players.map((p) => {
        const s = stats[p.seat];
        return (
          <div className={'stat-row' + (p.dead ? ' dead' : '')} key={p.seat}>
            <span className="nm"><RoleArt roleId={p.roleId} size={22} /><span>{p.seat}. {seatLabel(p)}</span></span>
            <span className="v">{s.targeted}</span>
            <span className="v">{s.checked}</span>
            <span className="v">{s.healed}</span>
            <span className="v">{s.silenced}</span>
            <span className="v">{s.votes}</span>
            <span className="tot">{s.total}</span>
          </div>
        );
      })}
      <p className="mute" style={{ fontSize: 12, marginTop: 12 }}>{t('stats_legend')}</p>
    </Sheet>
  );
}
