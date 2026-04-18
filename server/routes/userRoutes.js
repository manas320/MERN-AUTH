import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { getUserData } from '../controllers/userController.js';

const userRouter = express.Router();

// protect the route with userAuth middleware
userRouter.get('/data', userAuth, getUserData);

export default userRouter;