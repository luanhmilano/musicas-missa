import type { Request, Response } from 'express';
import Missa from '../models/missa.model.js';

const REPERTOIRE_FIELDS = [
  'repertorio.entrada',
  'repertorio.atoPenitencial',
  'repertorio.salmo',
  'repertorio.aclamacao',
  'repertorio.ofertorio',
  'repertorio.santo',
  'repertorio.cordeiro',
  'repertorio.comunhao',
  'repertorio.final'
].join(' ');

class MassController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      console.debug('[backend][missas] create payload', req.body);
      const newMissa = await Missa.create(req.body);
    
      const missaPopulada = await newMissa.populate(REPERTOIRE_FIELDS);
      console.debug('[backend][missas] created', missaPopulada);
      
      res.status(201).json(missaPopulada);
    } catch (error: any) {
      console.error('[backend][missas] create error', error);
      res.status(400).json({ error: 'Erro ao criar missa', details: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      console.debug('[backend][missas] getAll requested');
      const missas = await Missa.find()
        .sort({ date: -1 })
        .populate(REPERTOIRE_FIELDS);
      console.debug('[backend][missas] getAll result', { count: missas.length });
        
      res.status(200).json(missas);
    } catch (error: any) {
      console.error('[backend][missas] getAll error', error);
      res.status(500).json({ error: 'Erro ao buscar missas', details: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][missas] getById', { id });
      const mass = await Missa.findById(id).populate(REPERTOIRE_FIELDS);
      
      if (!mass) {
        console.debug('[backend][missas] getById not found', { id });
        res.status(404).json({ error: 'Missa não encontrada' });
        return;
      }
      
      console.debug('[backend][missas] getById result', mass);
      res.status(200).json(mass);
    } catch (error: any) {
      console.error('[backend][missas] getById error', error);
      res.status(500).json({ error: 'Erro ao buscar missa', details: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][missas] update payload', { id, body: req.body });
      const updatedMass = await Missa.findByIdAndUpdate(id, req.body, { 
        new: true, 
        runValidators: true 
      }).populate(REPERTOIRE_FIELDS);

      if (!updatedMass) {
        console.debug('[backend][missas] update not found', { id });
        res.status(404).json({ error: 'Missa não encontrada' });
        return;
      }

      console.debug('[backend][missas] updated', updatedMass);
      res.status(200).json(updatedMass);
    } catch (error: any) {
      console.error('[backend][missas] update error', error);
      res.status(400).json({ error: 'Erro ao atualizar missa', details: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      console.debug('[backend][missas] delete requested', { id });
      const deletedMass = await Missa.findByIdAndDelete(id);

      if (!deletedMass) {
        console.debug('[backend][missas] delete not found', { id });
        res.status(404).json({ error: 'Missa não encontrada' });
        return;
      }

      console.debug('[backend][missas] deleted', deletedMass);
      res.status(204).send();
    } catch (error: any) {
      console.error('[backend][missas] delete error', error);
      res.status(500).json({ error: 'Erro ao excluir missa', details: error.message });
    }
  }
}

export default new MassController();