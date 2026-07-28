import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh-token', validate(refreshTokenSchema), controller.refreshToken);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);
router.get('/profile', authenticate, controller.getProfile);

export default router;