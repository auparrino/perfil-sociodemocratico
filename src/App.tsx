import { useState } from 'react';
import { useSurveyData } from './hooks/useSurveyData';
import { useKeyTopics } from './hooks/useKeyTopics';
import { Dashboard } from './components/Dashboard';
import { VariableExplorer } from './components/VariableExplorer';

const P = {
  navy: '#003049', steel: '#669BBC', cream: '#FDF0D5',
};

type AppView = 'dashboard' | 'explorer';

function App() {
  const { keyData, variables, regions, fullData, loading, error, loadFullCountry } = useSurveyData();
  const keyTopics = useKeyTopics();
  const [view, setView] = useState<AppView>('dashboard');

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: P.cream,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, color: P.navy, fontWeight: 700 }}>
            Cargando datos...
          </div>
          <div style={{ color: '#4a6a7f' }}>Latinobarómetro — Argentina, Paraguay, Uruguay</div>
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

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: P.cream,
    }}>
      <header style={{
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
        <div style={{ fontSize: 13, color: P.steel }}>
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
      </main>
    </div>
  );
}

export default App;
