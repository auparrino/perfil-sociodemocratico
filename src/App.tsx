import { useState, lazy, Suspense } from 'react';
import { useSurveyData } from './hooks/useSurveyData';
import { useKeyTopics } from './hooks/useKeyTopics';
import { readUrlState, useUrlState } from './hooks/useUrlState';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const VariableExplorer = lazy(() => import('./components/VariableExplorer').then(m => ({ default: m.VariableExplorer })));

const P = {
  navy: '#003049', steel: '#669BBC', cream: '#FDF0D5',
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
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 22, marginBottom: 8, color: P.navy, fontWeight: 700 }}>
            Latinobarómetro
          </div>
          <div style={{ color: '#7a9aad', fontSize: 13 }}>Cargando datos de Argentina, Paraguay y Uruguay...</div>
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
        <div style={{ textAlign: 'center', color: '#C1121F' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>Error al cargar datos</div>
          <div>{error}</div>
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
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: P.cream,
    }}>
      <header className="responsive-header" style={{
        background: P.navy,
        color: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        height: 54,
        flexShrink: 0,
        gap: 20,
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          Latinobarómetro
        </div>
        <div className="responsive-hide-mobile" style={{ fontSize: 13, color: P.steel }}>
          Argentina | Paraguay | Uruguay
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {([['dashboard', 'Temas clave'], ['explorer', 'Explorador']] as [AppView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: view === v ? 700 : 400,
                background: view === v ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: view === v ? '#fff' : P.steel,
              }}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, padding: 16, overflow: 'hidden', minHeight: 0 }}>
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
