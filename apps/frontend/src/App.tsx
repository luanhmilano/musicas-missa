import { useState } from 'react';
import './App.css';
import { SongForm } from './components/song-form.component';
import { MassBuilder } from './components/montagem-missa.component';

function App() {
  const [activeTab, setActiveTab] = useState<'songs' | 'mass'>('songs');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1>Plataforma SM</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button 
            onClick={() => setActiveTab('songs')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'songs' ? 'bold' : 'normal' }}
          >
            Acervo de Músicas
          </button>
          <button 
            onClick={() => setActiveTab('mass')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'mass' ? 'bold' : 'normal' }}
          >
            Montar Missa
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'songs' && <SongForm />}
        {activeTab === 'mass' && <MassBuilder />}
      </main>
    </div>
  );
}

export default App;