import { Router } from 'express';
import MissaController from '../controllers/missa.controller.js';

const router = Router();

router.post('/', MissaController.create);
router.get('/', MissaController.getAll);
router.get('/:id', MissaController.getById);
router.get('/:id/html', MissaController.getHtml);
router.put('/:id', MissaController.update);
router.delete('/:id', MissaController.delete);

export default router;