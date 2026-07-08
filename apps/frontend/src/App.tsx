import { useState } from 'react';
import './App.css';
import { SongArchive } from './components/song-archive.component';
import { MassArchive } from './components/missa-archive.component';

function App() {
  const [activeTab, setActiveTab] = useState<'song-archive' | 'mass-archive'>('song-archive');

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Repertório para Missas</h1>
        <p>Acervos e formulários separados para visualizar, editar e criar músicas e missas.</p>
        <div className="app-tabs">
          <button 
            onClick={() => setActiveTab('song-archive')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'song-archive' ? 'bold' : 'normal' }}
          >
            Acervo de Músicas
          </button>
          <button 
            onClick={() => setActiveTab('mass-archive')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'mass-archive' ? 'bold' : 'normal' }}
          >
            Acervo de Missas
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'song-archive' && <SongArchive />}
        {activeTab === 'mass-archive' && <MassArchive />}
      </main>
    </div>
  );
}

export default App;