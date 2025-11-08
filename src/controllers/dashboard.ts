import {Router} from 'express';
import { verifyTokenAndAdmin } from '../middlewares/verifyToken.js';
import { getDashboardOverview } from '../services/dashboard.js';

const router = Router();

router.get('/', verifyTokenAndAdmin, getDashboardOverview)

export default router;