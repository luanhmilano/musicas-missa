import { Router } from 'express';
import SongController from '../controllers/song.controller.js';

const router = Router();

router.post('/', SongController.create);
router.get('/', SongController.getAll);
router.get('/:id', SongController.getById);
router.put('/:id', SongController.update);
router.delete('/:id', SongController.delete);

export default router;