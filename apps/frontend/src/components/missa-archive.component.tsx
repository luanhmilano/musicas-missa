import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Missa, MissaSongRef, Song } from '../types';
import { ConfirmationModal } from './confirmation-modal.component';

const MASSES_PER_PAGE = 2;

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

function normalizeSongLabel(value: MissaSongRef | string | null | undefined, songsById: Map<string, Song>): string {
  const songId = normalizeSongRef(value);

  if (!songId) {
    return 'Sem música';
  }

  const song = songsById.get(songId);

  if (song) {
    return `${song.titulo}${song.tom ? ` (${song.tom})` : ''}`;
  }

  if (value && typeof value !== 'string' && value.titulo) {
    return `${value.titulo}${value.tom ? ` (${value.tom})` : ''}`;
  }

  return 'Música não encontrada';
}

function buildRepertoireSummary(mass: Missa, songsById: Map<string, Song>) {
  return REPERTOIRE_FIELDS
    .map(field => {
      const songLabel = normalizeSongLabel(mass.repertorio?.[field.key], songsById);

      return songLabel === 'Sem música'
        ? null
        : { key: field.key, label: field.label, songLabel };
    })
    .filter((item): item is { key: string; label: string; songLabel: string } => item !== null);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function MassArchive() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [missas, setMissas] = useState<Missa[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingMass, setEditingMass] = useState<Missa | null>(null);
  const [massToDelete, setMassToDelete] = useState<Missa | null>(null);
  const [formData, setFormData] = useState<MassEditorState>(EMPTY_EDITOR);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const selectedMassId = editingMass?._id ?? null;
  const songsById = useMemo(() => new Map(songs.map(song => [song._id, song])), [songs]);
  const normalizedSearchTerm = normalizeText(searchTerm.trim());

  const filteredMissas = useMemo(() => {
    if (!normalizedSearchTerm) {
      return missas;
    }

    return missas.filter(mass => {
      const repertoireSummary = buildRepertoireSummary(mass, songsById)
        .map(item => `${item.label} ${item.songLabel}`)
        .join(' ');
      const searchable = [
        mass.nome,
        new Date(mass.data).toLocaleDateString('pt-BR'),
        repertoireSummary
      ].join(' ');

      return normalizeText(searchable).includes(normalizedSearchTerm);
    });
  }, [missas, normalizedSearchTerm, songsById]);

  const selectedMassPage = useMemo(() => {
    if (!editingMass) {
      return null;
    }

    const index = filteredMissas.findIndex(mass => mass._id === editingMass._id);

    if (index < 0) {
      return null;
    }

    return Math.floor(index / MASSES_PER_PAGE) + 1;
  }, [editingMass, filteredMissas]);

  const totalMassPages = Math.max(1, Math.ceil(filteredMissas.length / MASSES_PER_PAGE));
  const currentMassPage = selectedMassPage ?? Math.min(currentPage, totalMassPages);
  const pagedMissas = filteredMissas.slice((currentMassPage - 1) * MASSES_PER_PAGE, currentMassPage * MASSES_PER_PAGE);

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

  const closeDeleteModal = () => {
    setMassToDelete(null);
  };

  const confirmDelete = async () => {
    if (!massToDelete) {
      return;
    }

    try {
      await api.delete(`/missas/${massToDelete._id}`);
      setLoading(true);
      await loadData();
      if (editingMass?._id === massToDelete._id) {
        cancelEdit();
      }
      setMessage('Missa excluída com sucesso.');
    } catch (error) {
      console.error('[frontend][missa-archive] delete error', error);
      setMessage('Erro ao excluir missa.');
    } finally {
      closeDeleteModal();
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
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
    const mass = missas.find(item => item._id === id);

    if (mass) {
      setMassToDelete(mass);
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
            <div className="archive-list-header">
              <h3>Missas cadastradas</h3>
              <label className="archive-search">
                <span>Buscar missa</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nome, data ou música"
                />
              </label>
            </div>
            {loading ? (
              <p>Carregando missas...</p>
            ) : missas.length === 0 ? (
              <p>Nenhuma missa cadastrada ainda.</p>
            ) : filteredMissas.length === 0 ? (
              <p>Missa não encontrada.</p>
            ) : (
              pagedMissas.map(mass => (
                <article
                  key={mass._id}
                  className={`archive-item${selectedMassId === mass._id ? ' archive-item--selected' : ''}`}
                >
                  <div className="archive-item-content">
                    <strong>{mass.nome}</strong>
                    <p>{new Date(mass.data).toLocaleDateString('pt-BR')}</p>
                    <ul className="archive-summary">
                      {buildRepertoireSummary(mass, songsById).map(item => (
                        <li key={item.key}>
                          <span>{item.label}</span>
                          <span>{item.songLabel}</span>
                        </li>
                      ))}
                    </ul>
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

            {filteredMissas.length > 0 && (
              <div className="archive-pagination">
                <button
                  type="button"
                  className="archive-secondary"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentMassPage === 1}
                >
                  Anterior
                </button>
                <span>
                  Página {currentMassPage} de {totalMassPages}
                </span>
                <button
                  type="button"
                  className="archive-secondary"
                  onClick={() => setCurrentPage(page => Math.min(totalMassPages, page + 1))}
                  disabled={currentMassPage === totalMassPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>

        {massToDelete && (
          <ConfirmationModal
            title="Confirmar exclusão"
            description={`Deseja excluir a missa "${massToDelete.nome}"? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir missa"
            cancelLabel="Cancelar"
            onConfirm={() => { void confirmDelete(); }}
            onCancel={closeDeleteModal}
          />
        )}
      </div>
    </section>
  );
}