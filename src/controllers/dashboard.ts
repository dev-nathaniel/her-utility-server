import {Router} from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { getDashboardOverview } from '../services/dashboard.js';

const router = Router();

router.get('/', verifyToken, getDashboardOverview)

export default router;