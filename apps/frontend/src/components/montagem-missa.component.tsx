import { useState, useEffect } from 'react';
import styles from '../components/styles/montagem-missa.module.css';
import { api } from '../services/api';

const REPERTOIRE_MAP = [
  { key: 'entrada', label: 'ENTRADA' },
  { key: 'atoPenitencial', label: 'ATO_PENITENCIAL' },
  { key: 'salmo', label: 'SALMO' },
  { key: 'aclamacao', label: 'ACLAMACAO' },
  { key: 'ofertorio', label: 'OFERTORIO' },
  { key: 'santo', label: 'SANTO' },
  { key: 'cordeiro', label: 'CORDEIRO' },
  { key: 'comunhao', label: 'COMUNHAO' },
  { key: 'final', label: 'FINAL' }
];

export function MassBuilder() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [songs, setSongs] = useState<any[]>([]);
  const [massData, setMassData] = useState({
    nome: 'Missa de Domingo',
    data: '',
    repertorio: {} as Record<string, string>
  });

  useEffect(() => {
    api.get('/songs').then(response => {
      console.log('[frontend][mass-builder] songs loaded', {
        count: Array.isArray(response.data) ? response.data.length : 0,
        data: response.data,
      });
      setSongs(response.data);
    }).catch(error => {
      console.error('[frontend][mass-builder] load songs error', error);
    });
  }, []);

  const handleSelectSong = (key: string, songId: string) => {
    setMassData(prev => ({
      ...prev,
      repertorio: { ...prev.repertorio, [key]: songId }
    }));
  };

  const handleSaveMass = async () => {
    try {
      console.log('[frontend][mass-builder] saving mass', massData);
      const response = await api.post('/missas', massData);
      console.log('[frontend][mass-builder] mass saved', response.data);
      alert('Missa salva com sucesso! ID: ' + response.data._id);
      return response.data._id;
    } catch (error) {
      alert('Erro ao salvar missa');
      console.error('[frontend][mass-builder] save mass error', error);
    }
  };

  const handleGenerateDocument = async () => {
    console.debug('[frontend][mass-builder] generate document requested');
    const massId = await handleSaveMass();
    if (!massId) return;

    console.log(`Disparando geração de PDF para a missa: ${massId}`);
    alert(`Preparado para chamar: GET /masses/${massId}/pdf`);
  };

  return (
    <div className={styles.container}>
      <h2>Montar Repertório da Missa</h2>
      
      <div className={styles.headerInfo}>
        <div className={styles.formGroup}>
          <label>Nome / Grupo</label>
          <input 
            type="text" 
            value={massData.nome} 
            onChange={e => setMassData({...massData, nome: e.target.value})} 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Data</label>
          <input 
            type="date" 
            value={massData.data} 
            onChange={e => setMassData({...massData, data: e.target.value})} 
          />
        </div>
      </div>

      <div className={styles.repertoireGrid}>
        {REPERTOIRE_MAP.map((item) => {
          const availableSongs = songs.filter(s => s.momentoLiturgico === item.label);
          
          return (
            <div key={item.key} className={styles.momentCard}>
              <h4>{item.label.replace('_', ' ')}</h4>
              <div className={styles.formGroup}>
                <select 
                  onChange={e => handleSelectSong(item.key, e.target.value)}
                  value={massData.repertorio[item.key] || ''}
                >
                  <option value="">Selecione uma música...</option>
                  {availableSongs.map(song => (
                    <option key={song._id} value={song._id}>
                      {song.titulo} ({song.tom})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button onClick={handleSaveMass} className={styles.saveBtn}>
          Apenas Salvar
        </button>
        <button onClick={handleGenerateDocument} className={styles.generateBtn}>
          Salvar e Gerar Documento (PDF)
        </button>
      </div>
    </div>
  );
}