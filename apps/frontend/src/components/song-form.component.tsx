import React, { useState } from 'react';
import styles from '../components/styles/song-form.module.css';
import { api } from '../services/api';

const MOMENTS = [
  'ENTRADA', 'ATO_PENITENCIAL', 'SALMO', 'ACLAMACAO', 
  'OFERTORIO', 'SANTO', 'CORDEIRO', 'COMUNHAO', 'FINAL'
];

export function SongForm() {
  const [formData, setFormData] = useState({
    titulo: '',
    tom: '',
    momentoLiturgico: 'ENTRADA',
    letra: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lyricsArray = formData.letra.split('\n\n').filter(p => p.trim() !== '');
    const payload = {
      titulo: formData.titulo,
      tom: formData.tom,
      momentoLiturgico: formData.momentoLiturgico,
      letra: lyricsArray,
    };

    console.debug('[frontend][song-form] submit', {
      payload,
      lyricsParts: lyricsArray.length,
    });

    try {
      const response = await api.post('/songs', payload);
      console.debug('[frontend][song-form] created song', response.data);
      
      setStatus('Música cadastrada com sucesso!');
      setFormData({ titulo: '', tom: '', momentoLiturgico: 'ENTRADA', letra: '' });
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Erro ao cadastrar música.');
      console.error('[frontend][song-form] submit error', error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Cadastrar Músicas</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Título da Música</label>
          <input 
            type="text" 
            value={formData.titulo} 
            onChange={e => setFormData({...formData, titulo: e.target.value})} 
            required 
          />
        </div>

        <div className={styles.formGroup}>
          <label>Tom Padrão (Ex: C, Am, G#)</label>
          <input 
            type="text" 
            value={formData.tom} 
            onChange={e => setFormData({...formData, tom: e.target.value})} 
            required 
          />
        </div>

        <div className={styles.formGroup}>
          <label>Momento Litúrgico</label>
          <select 
            value={formData.momentoLiturgico} 
            onChange={e => setFormData({...formData, momentoLiturgico: e.target.value})}
          >
            {MOMENTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Letra (Pule uma linha vazia entre cada estrofe)</label>
          <textarea 
            value={formData.letra} 
            onChange={e => setFormData({...formData, letra: e.target.value})} 
            required 
          />
        </div>

        {status && <p className={styles.successMessage}>{status}</p>}

        <button type="submit" className={styles.submitBtn}>Salvar nova música</button>
      </form>
    </div>
  );
}