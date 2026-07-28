import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, data: [], message: 'Plots endpoint ready.' });
});

export default router;