import {Router} from "express"
import { changePassword, deleteUser, getUserById, getUsers, updateUser } from "../services/users.js"
import { verifyToken, verifyTokenAndAuthorization } from "../middlewares/verifyToken.js"

const router = Router()

router.get("/", verifyToken, getUsers)

// router.get('/:id/profile-picture', getUserProfilePicture)

router.get('/:id', verifyTokenAndAuthorization, getUserById)

router.put('/:id', verifyTokenAndAuthorization, updateUser)

router.put('/change-password/:id', verifyTokenAndAuthorization, changePassword)

router.delete('/:id', verifyTokenAndAuthorization, deleteUser)

export default router