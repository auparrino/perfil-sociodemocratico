import { useState, lazy, Suspense } from 'react';
import { useSurveyData } from './hooks/useSurveyData';
import { useKeyTopics } from './hooks/useKeyTopics';
import { readUrlState, useUrlState } from './hooks/useUrlState';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const VariableExplorer = lazy(() => import('./components/VariableExplorer').then(m => ({ default: m.VariableExplorer })));

const P = {
  navy: '#003049', cream: '#FDF0D5', gold: '#d4a800',
  border: 'rgba(0,48,73,0.12)', textMuted: 'rgba(0,48,73,0.50)',
};

type AppView = 'dashboard' | 'explorer';

const initialUrl = readUrlState();

function App() {
  const { keyData, variables, regions, fullData, loading, error, loadFullCountry } = useSurveyData();
  const keyTopics = useKeyTopics();
  const [view, setView] = useState<AppView>((initialUrl.view as AppView) || 'dashboard');

  useUrlState({ view });

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: P.cream,
      }}>
        <div style={{ textAlign: 'center' }} className="fade-in">
          <div className="loading-spinner-lg" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: P.navy, marginBottom: 4 }}>
            Sociodemocratic Profile
          </div>
          <div style={{ color: P.textMuted, fontSize: 12 }}>Loading data for Argentina, Paraguay and Uruguay...</div>
        </div>
      </div>
    );
  }

  if (error || !keyData || !variables || !regions) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: P.cream,
      }}>
        <div style={{
          textAlign: 'center', color: 'rgba(193,18,31,0.80)',
          background: 'rgba(193,18,31,0.05)', border: '1px solid rgba(193,18,31,0.15)',
          borderRadius: 6, padding: '16px 24px',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Error loading data</div>
          <div style={{ fontSize: 12 }}>{error}</div>
        </div>
      </div>
    );
  }

  const lazyFallback = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: P.cream,
    }}>
      <header className="responsive-header" style={{
        background: P.cream,
        color: P.navy,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: 56,
        flexShrink: 0,
        gap: 16,
        borderBottom: `1px solid ${P.border}`,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
            Sociodemocratic Profile
          </div>
          <div className="responsive-hide-mobile" style={{ fontSize: 10, color: P.textMuted, letterSpacing: '0.5px' }}>
            Latinobarómetro — Argentina | Paraguay | Uruguay
          </div>
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
          {([['dashboard', 'Key Topics'], ['explorer', 'Explorer']] as [AppView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '5px 16px', borderRadius: 100, cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                border: view === v ? 'none' : `1px solid ${P.border}`,
                background: view === v ? P.navy : 'transparent',
                color: view === v ? P.cream : P.navy,
              }}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, padding: 12, overflow: 'hidden', minHeight: 0 }}>
        <Suspense fallback={lazyFallback}>
          {view === 'dashboard' ? (
            <Dashboard
              keyData={keyData}
              variables={variables}
              regions={regions}
              keyTopics={keyTopics}
            />
          ) : (
            <VariableExplorer
              keyData={keyData}
              variables={variables}
              fullData={fullData}
              loadFullCountry={loadFullCountry}
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
