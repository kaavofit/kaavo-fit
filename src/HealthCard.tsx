import {HeartPulse} from 'lucide-react';
import type {useHealth} from './health';

type T = (en: string, hi: string) => string;

export default function HealthCard({t, health}: {t: T; health: ReturnType<typeof useHealth>}) {
  const {status, snapshot, detail, sync, source} = health;
  const busy = status === 'working';
  const time = snapshot ? new Date(snapshot.at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '';

  const msg: Record<string, string> = {
    web: t('Apple Health and Health Connect work only in the installed iOS or Android app, not in this browser.',
           'Apple Health और Health Connect सिर्फ़ इंस्टॉल किए गए iOS या Android ऐप में काम करते हैं, इस ब्राउज़र में नहीं।'),
    idle: t('Not synced yet. Syncing is manual: it asks your permission, then reads today\u2019s totals.',
            'अभी सिंक नहीं हुआ। सिंक मैन्युअल है: यह आपकी अनुमति माँगता है, फिर आज का कुल डेटा पढ़ता है।'),
    working: t('Syncing\u2026', 'सिंक हो रहा है\u2026'),
    denied: t('Permission was denied. Allow KAAVO FIT in your phone\u2019s health settings, then tap Sync again.',
              'अनुमति नहीं मिली। फ़ोन की हेल्थ सेटिंग्स में KAAVO FIT को अनुमति दें, फिर दोबारा सिंक दबाएँ।'),
    unavailable: t('Health data is not available on this device (the health service may be missing or disabled).',
                   'इस डिवाइस पर हेल्थ डेटा उपलब्ध नहीं है (हेल्थ सेवा मौजूद नहीं या बंद हो सकती है)।'),
    empty: t('Connected, but no steps, distance or calories were returned for today. Permission may be off, or nothing has been recorded yet.',
             'कनेक्ट हुआ, पर आज के कदम, दूरी या कैलोरी नहीं मिले। अनुमति बंद हो सकती है, या अभी कुछ दर्ज नहीं हुआ।'),
    error: t('Sync failed. Please try again.', 'सिंक नहीं हो पाया। कृपया फिर कोशिश करें।')
  };

  return (
    <div className="card">
      <div className="between">
        <b><HeartPulse size={14} style={{verticalAlign: '-2px'}} /> {t('Health data', 'स्वास्थ्य डेटा')}</b>
        <small className="gold">{source || t('Not available here', 'यहाँ उपलब्ध नहीं')}</small>
      </div>

      {status === 'synced' && snapshot ? (
        <>
          <p className="kw-ok">{t(`Synced from ${snapshot.source} at ${time}`, `${snapshot.source} से ${time} पर सिंक हुआ`)}</p>
          <div className="stats">
            <div><small>{t('Steps', 'कदम')}</small><b>{snapshot.steps ?? '—'}</b></div>
            <div><small>{t('Distance', 'दूरी')}</small><b>{snapshot.distanceM != null ? (snapshot.distanceM / 1000).toFixed(2) + ' ' + t('km', 'किमी') : '—'}</b></div>
            <div><small>{t('Active cal.', 'सक्रिय कैलोरी')}</small><b>{snapshot.kcal ?? '—'}</b></div>
          </div>
        </>
      ) : (
        <p>{msg[status] || ''}{detail && status === 'error' ? ` (${detail.slice(0, 120)})` : ''}</p>
      )}

      {status !== 'web' && (
        <div className="controls">
          <button className="primary" disabled={busy} onClick={sync}>
            {busy ? t('Syncing\u2026', 'सिंक हो रहा है\u2026') : t('Sync from Health', 'हेल्थ से सिंक करो')}
          </button>
        </div>
      )}
      <p className="note">{t('Read-only: steps, distance and active calories for today. Data stays on this device and is not shared.',
                             'सिर्फ़ पढ़ने के लिए: आज के कदम, दूरी और सक्रिय कैलोरी। डेटा इसी डिवाइस पर रहता है और साझा नहीं होता।')}</p>
    </div>
  );
}
