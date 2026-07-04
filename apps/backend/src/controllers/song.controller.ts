import type { Request, Response } from 'express';
import Song from '../models/song.model.js';
import { LiturgicalMoment } from '../models/song.model.js';

class SongController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      console.debug('[backend][songs] create payload', req.body);
      const newSong = await Song.create(req.body);
      console.debug('[backend][songs] created', newSong);
      res.status(201).json(newSong);
    } catch (error: any) {
      console.error('[backend][songs] create error', error);
      res.status(400).json({ error: 'Erro ao criar música', details: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { momento } = req.query;
      const momentoLiturgico = typeof momento === 'string' && Object.values(LiturgicalMoment).includes(momento as LiturgicalMoment)
        ? (momento as LiturgicalMoment)
        : undefined;

      const filter = momentoLiturgico ? { momentoLiturgico } : {};
      console.debug('[backend][songs] getAll filter', { momento, filter });
      
      const songs = await Song.find(filter).sort({ titulo: 1 });
      console.debug('[backend][songs] getAll result', { count: songs.length });
      res.status(200).json(songs);
    } catch (error: any) {
      console.error('[backend][songs] getAll error', error);
      res.status(500).json({ error: 'Erro ao buscar músicas', details: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][songs] getById', { id });
      const song = await Song.findById(id);
      
      if (!song) {
        console.debug('[backend][songs] getById not found', { id });
        res.status(404).json({ error: 'Música não encontrada' });
        return;
      }
      
      console.debug('[backend][songs] getById result', song);
      res.status(200).json(song);
    } catch (error: any) {
      console.error('[backend][songs] getById error', error);
      res.status(500).json({ error: 'Erro ao buscar música', details: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][songs] update payload', { id, body: req.body });
      const updatedSong = await Song.findByIdAndUpdate(id, req.body, { 
        new: true,
        runValidators: true
      });

      if (!updatedSong) {
        console.debug('[backend][songs] update not found', { id });
        res.status(404).json({ error: 'Música não encontrada' });
        return;
      }

      console.debug('[backend][songs] updated', updatedSong);
      res.status(200).json(updatedSong);
    } catch (error: any) {
      console.error('[backend][songs] update error', error);
      res.status(400).json({ error: 'Erro ao atualizar música', details: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][songs] delete requested', { id });
      const deletedSong = await Song.findByIdAndDelete(id);

      if (!deletedSong) {
        console.debug('[backend][songs] delete not found', { id });
        res.status(404).json({ error: 'Música não encontrada' });
        return;
      }

      console.debug('[backend][songs] deleted', deletedSong);
      res.status(204).send();
    } catch (error: any) {
      console.error('[backend][songs] delete error', error);
      res.status(500).json({ error: 'Erro ao excluir música', details: error.message });
    }
  }
}

export default new SongController();