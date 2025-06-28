import express from 'express';
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines
} from '../controllers/medicineController.js';
//import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllMedicines);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

// Protected routes (admin only)
router.post('/',  createMedicine);
router.put('/:id',  updateMedicine);
router.delete('/:id',  deleteMedicine);

export default router;
