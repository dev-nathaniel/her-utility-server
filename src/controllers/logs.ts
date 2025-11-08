import {Router} from 'express'
import { getAllLogs } from '../services/logs.js'
import { verifyTokenAndAdmin } from '../middlewares/verifyToken.js'

const router = Router()

router.get('/', verifyTokenAndAdmin, getAllLogs)

export default router