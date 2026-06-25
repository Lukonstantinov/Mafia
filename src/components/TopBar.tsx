import { useStore } from '../store';
import { useT } from './ui';
import type { Lang } from '../types';

const LANGS: Lang[] = ['EN', 'RU', 'LT'];

export function TopBar({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className="topbar">
      {onBack ? (
        <button className="btn ghost" style={{ width: 'auto', padding: '7px 12px' }} onClick={onBack}>
          ← {t('back')}
        </button>
      ) : (
        <span className="brand">{t('brand')}</span>
      )}
      <div className="langtoggle">
        {LANGS.map((l) => (
          <button key={l} className={l === lang ? 'active' : ''} onClick={() => setLang(l)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
