import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Missa, MissaSongRef, Song } from '../types';

const REPERTOIRE_FIELDS = [
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

type MassEditorState = {
  nome: string;
  data: string;
  repertorio: Record<string, string>;
};

const EMPTY_EDITOR: MassEditorState = {
  nome: '',
  data: '',
  repertorio: {}
};

function normalizeSongRef(value: MissaSongRef | string | null | undefined): string {
  if (!value || typeof value === 'string') {
    return typeof value === 'string' ? value : '';
  }

  return value._id ?? '';
}

function toEditorState(mass: Missa): MassEditorState {
  return {
    nome: mass.nome,
    data: mass.data ? mass.data.slice(0, 10) : '',
    repertorio: Object.entries(mass.repertorio ?? {}).reduce<Record<string, string>>((acc, [key, song]) => {
      acc[key] = normalizeSongRef(song);
      return acc;
    }, {})
  };
}

export function MassArchive() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [missas, setMissas] = useState<Missa[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingMass, setEditingMass] = useState<Missa | null>(null);
  const [formData, setFormData] = useState<MassEditorState>(EMPTY_EDITOR);

  const title = useMemo(() => (
    editingMass ? 'Atualizar missa selecionada' : 'Cadastrar nova missa'
  ), [editingMass]);

  const loadData = async () => {
    try {
      const [songsResponse, missasResponse] = await Promise.all([
        api.get('/songs'),
        api.get('/missas')
      ]);

      setSongs(songsResponse.data);
      setMissas(missasResponse.data);
    } catch (error) {
      console.error('[frontend][missa-archive] load error', error);
      setMessage('Erro ao carregar missas.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await loadData();
  };

  useEffect(() => {
    void Promise.all([
      api.get('/songs'),
      api.get('/missas')
    ])
      .then(([songsResponse, missasResponse]) => {
        setSongs(songsResponse.data);
        setMissas(missasResponse.data);
      })
      .catch(error => {
        console.error('[frontend][missa-archive] load error', error);
        setMessage('Erro ao carregar missas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const startEdit = (mass: Missa) => {
    setEditingMass(mass);
    setFormData(toEditorState(mass));
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingMass(null);
    setFormData(EMPTY_EDITOR);
  };

  const updateRepertoire = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      repertorio: { ...prev.repertorio, [key]: value }
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      nome: formData.nome,
      data: formData.data,
      repertorio: formData.repertorio
    };

    try {
      if (editingMass) {
        await api.put(`/missas/${editingMass._id}`, payload);
        setMessage('Missa atualizada com sucesso.');
      } else {
        await api.post('/missas', payload);
        setMessage('Missa cadastrada com sucesso.');
      }

      cancelEdit();
      setLoading(true);
      await loadData();
    } catch (error) {
      console.error('[frontend][missa-archive] save error', error);
      setMessage('Erro ao salvar missa.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta missa?')) {
      return;
    }

    try {
      await api.delete(`/missas/${id}`);
      setLoading(true);
      await loadData();
      if (editingMass?._id === id) {
        cancelEdit();
      }
      setMessage('Missa excluída com sucesso.');
    } catch (error) {
      console.error('[frontend][missa-archive] delete error', error);
      setMessage('Erro ao excluir missa.');
    }
  };

  const handlePdf = async (massId: string) => {
    const response = await api.get(`/missas/${massId}/pdf`, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = `missa-${massId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <section className="archive-shell">
      <div className="archive-card">
        <div className="archive-header">
          <div>
            <p className="archive-eyebrow">Acervo de missas</p>
            <h2>Visualize, edite e gere o PDF das missas salvas</h2>
          </div>
          <button type="button" className="archive-secondary" onClick={() => { void refreshData(); }}>
            Atualizar lista
          </button>
        </div>

        {message && <p className="archive-message">{message}</p>}

        <div className="archive-layout">
          <form className="archive-form" onSubmit={handleSubmit}>
            <h3>{title}</h3>

            <label>
              Nome
              <input
                type="text"
                value={formData.nome}
                placeholder='Ex: Missa de Domingo'
                onChange={event => setFormData({ ...formData, nome: event.target.value })}
                required
              />
            </label>

            <label>
              Data
              <input
                type="date"
                value={formData.data}
                onChange={event => setFormData({ ...formData, data: event.target.value })}
                required
              />
            </label>

            <div className="archive-repertoire">
              {REPERTOIRE_FIELDS.map(item => (
                <label key={item.key}>
                  {item.label}
                  <select
                    value={formData.repertorio[item.key] || ''}
                    onChange={event => updateRepertoire(item.key, event.target.value)}
                  >
                    <option value="">Selecione uma música...</option>
                    {songs.map(song => (
                      <option key={song._id} value={song._id}>
                        {song.titulo}{song.tom ? ` (${song.tom})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="archive-actions">
              <button type="submit" className="archive-primary">
                {editingMass ? 'Atualizar missa' : 'Cadastrar missa'}
              </button>
              {editingMass && (
                <button type="button" className="archive-secondary" onClick={cancelEdit}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="archive-list">
            <h3>Missas cadastradas</h3>
            {loading ? (
              <p>Carregando missas...</p>
            ) : missas.length === 0 ? (
              <p>Nenhuma missa cadastrada ainda.</p>
            ) : (
              missas.map(mass => (
                <article key={mass._id} className="archive-item">
                  <div>
                    <strong>{mass.nome}</strong>
                    <p>{new Date(mass.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="archive-item-actions">
                    <button type="button" className="archive-secondary" onClick={() => startEdit(mass)}>
                      Editar
                    </button>
                    <button type="button" className="archive-secondary" onClick={() => { void handlePdf(mass._id); }}>
                      PDF
                    </button>
                    <button type="button" className="archive-danger" onClick={() => { void handleDelete(mass._id); }}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}