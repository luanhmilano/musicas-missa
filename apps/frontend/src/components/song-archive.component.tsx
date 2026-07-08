import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { LiturgicalMoment, Song } from '../types';
import { ConfirmationModal } from './confirmation-modal.component';

const SONGS_PER_PAGE = 10;

const MOMENTS: LiturgicalMoment[] = [
  'ENTRADA',
  'ATO_PENITENCIAL',
  'SALMO',
  'ACLAMACAO',
  'OFERTORIO',
  'SANTO',
  'CORDEIRO',
  'COMUNHAO',
  'FINAL'
];

type SongEditorState = {
  titulo: string;
  tom: string;
  momentoLiturgico: LiturgicalMoment;
  letra: string;
};

const EMPTY_EDITOR: SongEditorState = {
  titulo: '',
  tom: '',
  momentoLiturgico: 'ENTRADA',
  letra: ''
};

function toEditorState(song: Song): SongEditorState {
  return {
    titulo: song.titulo,
    tom: song.tom ?? '',
    momentoLiturgico: song.momentoLiturgico,
    letra: Array.isArray(song.letra) ? song.letra.join('\n\n') : ''
  };
}

function parseLyrics(text: string): string[] {
  return text
    .split('\n\n')
    .map(part => part.trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function SongArchive() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [formData, setFormData] = useState<SongEditorState>(EMPTY_EDITOR);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const selectedSongId = editingSong?._id ?? null;
  const normalizedSearchTerm = normalizeText(searchTerm.trim());

  const filteredSongs = useMemo(() => {
    if (!normalizedSearchTerm) {
      return songs;
    }

    return songs.filter(song => {
      const searchable = [song.titulo, song.tom, song.momentoLiturgico].filter(Boolean).join(' ');
      return normalizeText(searchable).includes(normalizedSearchTerm);
    });
  }, [normalizedSearchTerm, songs]);

  const totalSongPages = Math.max(1, Math.ceil(filteredSongs.length / SONGS_PER_PAGE));
  const currentSongPage = Math.min(currentPage, totalSongPages);
  const pagedSongs = filteredSongs.slice((currentSongPage - 1) * SONGS_PER_PAGE, currentSongPage * SONGS_PER_PAGE);

  const title = useMemo(() => (
    editingSong ? 'Atualizar música selecionada' : 'Cadastrar nova música'
  ), [editingSong]);

  const loadSongs = async () => {
    try {
      const response = await api.get('/songs');
      setSongs(response.data);
    } catch (error) {
      console.error('[frontend][song-archive] load error', error);
      setMessage('Erro ao carregar músicas.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSongs = async () => {
    setLoading(true);
    await loadSongs();
  };

  useEffect(() => {
    void api.get('/songs')
      .then(response => {
        setSongs(response.data);
      })
      .catch(error => {
        console.error('[frontend][song-archive] load error', error);
        setMessage('Erro ao carregar músicas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const startEdit = (song: Song) => {
    setEditingSong(song);
    setFormData(toEditorState(song));
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingSong(null);
    setFormData(EMPTY_EDITOR);
  };

  const closeDeleteModal = () => {
    setSongToDelete(null);
  };

  const confirmDelete = async () => {
    if (!songToDelete) {
      return;
    }

    try {
      await api.delete(`/songs/${songToDelete._id}`);
      setLoading(true);
      await loadSongs();
      if (editingSong?._id === songToDelete._id) {
        cancelEdit();
      }
      setMessage('Música excluída com sucesso.');
    } catch (error) {
      console.error('[frontend][song-archive] delete error', error);
      setMessage('Erro ao excluir música.');
    } finally {
      closeDeleteModal();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      titulo: formData.titulo,
      tom: formData.tom,
      momentoLiturgico: formData.momentoLiturgico,
      letra: parseLyrics(formData.letra)
    };

    try {
      if (editingSong) {
        await api.put(`/songs/${editingSong._id}`, payload);
        setMessage('Música atualizada com sucesso.');
      } else {
        await api.post('/songs', payload);
        setMessage('Música cadastrada com sucesso.');
      }

      cancelEdit();
      setLoading(true);
      await loadSongs();
    } catch (error) {
      console.error('[frontend][song-archive] save error', error);
      setMessage('Erro ao salvar música.');
    }
  };

  const handleDelete = async (id: string) => {
    const song = songs.find(item => item._id === id);

    if (song) {
      setSongToDelete(song);
    }
  };

  return (
    <section className="archive-shell">
      <div className="archive-card">
        <div className="archive-header">
          <div>
            <p className="archive-eyebrow">Acervo de músicas</p>
            <h2>Visualize, edite e exclua músicas do banco</h2>
          </div>
          <button type="button" className="archive-secondary" onClick={() => { void refreshSongs(); }}>
            Atualizar lista
          </button>
        </div>

        {message && <p className="archive-message">{message}</p>}

        <div className="archive-layout">
          <form className="archive-form" onSubmit={handleSubmit}>
            <h3>{title}</h3>

            <label>
              Título
              <input
                type="text"
                value={formData.titulo}
                onChange={event => setFormData({ ...formData, titulo: event.target.value })}
                required
              />
            </label>

            <label>
              Tom
              <input
                type="text"
                value={formData.tom}
                onChange={event => setFormData({ ...formData, tom: event.target.value })}
                required
              />
            </label>

            <label>
              Momento litúrgico
              <select
                value={formData.momentoLiturgico}
                onChange={event => setFormData({ ...formData, momentoLiturgico: event.target.value as LiturgicalMoment })}
              >
                {MOMENTS.map(moment => (
                  <option key={moment} value={moment}>{moment}</option>
                ))}
              </select>
            </label>

            <label>
              Letra
              <textarea
                value={formData.letra}
                onChange={event => setFormData({ ...formData, letra: event.target.value })}
                rows={8}
                required
              />
            </label>

            <div className="archive-actions">
              <button type="submit" className="archive-primary">
                {editingSong ? 'Atualizar música' : 'Cadastrar música'}
              </button>
              {editingSong && (
                <button type="button" className="archive-secondary" onClick={cancelEdit}>
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          <div className="archive-list">
            <div className="archive-list-header">
              <h3>Músicas cadastradas</h3>
              <label className="archive-search">
                <span>Buscar música</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Título, tom ou momento litúrgico"
                />
              </label>
            </div>
            {loading ? (
              <p>Carregando músicas...</p>
            ) : songs.length === 0 ? (
              <p>Nenhuma música cadastrada ainda.</p>
            ) : filteredSongs.length === 0 ? (
              <p>Música não encontrada.</p>
            ) : (
              pagedSongs.map(song => (
                <article
                  key={song._id}
                  className={`archive-item${selectedSongId === song._id ? ' archive-item--selected' : ''}`}
                >
                  <div className="archive-item-content">
                    <strong>{song.titulo}</strong>
                    <p>{song.tom} · {song.momentoLiturgico}</p>
                  </div>
                  <div className="archive-item-actions">
                    <button type="button" className="archive-secondary" onClick={() => startEdit(song)}>
                      Editar
                    </button>
                    <button type="button" className="archive-danger" onClick={() => { void handleDelete(song._id); }}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}

            {filteredSongs.length > 0 && (
              <div className="archive-pagination">
                <button
                  type="button"
                  className="archive-secondary"
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                  disabled={currentSongPage === 1}
                >
                  Anterior
                </button>
                <span>
                  Página {currentSongPage} de {totalSongPages}
                </span>
                <button
                  type="button"
                  className="archive-secondary"
                  onClick={() => setCurrentPage(page => Math.min(totalSongPages, page + 1))}
                  disabled={currentSongPage === totalSongPages}
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>

        {songToDelete && (
          <ConfirmationModal
            title="Confirmar exclusão"
            description={`Deseja excluir a música "${songToDelete.titulo}"? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir música"
            cancelLabel="Cancelar"
            onConfirm={() => { void confirmDelete(); }}
            onCancel={closeDeleteModal}
          />
        )}
      </div>
    </section>
  );
}