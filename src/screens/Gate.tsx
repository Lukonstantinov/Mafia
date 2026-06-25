import { useState } from 'react';
import { useStore } from '../store';
import { useT, Modal } from '../components/ui';
import { TopBar } from '../components/TopBar';

export function Gate() {
  const t = useT();
  const go = useStore((s) => s.go);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="screen fadein">
      <TopBar />
      <div className="spacer" />
      <div className="center">
        <div style={{ fontSize: 52 }}>🔒</div>
        <h1 style={{ fontSize: 28, marginTop: 10 }}>{t('gate_title')}</h1>
        <p className="mute">{t('gate_sub')}</p>
      </div>
      <div className="note center" style={{ marginTop: 18 }}>{t('instr_short')}</div>
      <div className="spacer" />

      <button className="btn primary" onClick={() => setConfirm(true)}>{t('gate_imMayor')}</button>

      <Modal open={confirm} title={t('gate_confirmTitle')} body={t('gate_confirmBody')}>
        <button className="btn primary" onClick={() => go('table')}>{t('gate_confirmYes')}</button>
        <button className="btn ghost" onClick={() => setConfirm(false)}>{t('cancel')}</button>
      </Modal>
    </div>
  );
}
