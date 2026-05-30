import express from 'express'
import { body, param } from 'express-validator'
import upload from '../middlewares/multer.js'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  createPayment,
  listPending,
  verifyPaymentHandler,
  rejectPaymentHandler,
} from '../controllers/paymentsController.js'

const paymentsRouter = express.Router()

paymentsRouter.post(
  '/',
  authenticate,
  authorizeRoles('patient'),
  upload.single('screenshot'),
  [body('appointment_id').isUUID()],
  validate,
  createPayment
)

paymentsRouter.get(
  '/pending',
  authenticate,
  authorizeRoles('assistant', 'admin', 'super_admin'),
  listPending
)

paymentsRouter.post(
  '/:id/verify',
  authenticate,
  authorizeRoles('assistant', 'admin', 'super_admin'),
  [param('id').isUUID()],
  validate,
  verifyPaymentHandler
)

paymentsRouter.post(
  '/:id/reject',
  authenticate,
  authorizeRoles('assistant', 'admin', 'super_admin'),
  [param('id').isUUID(), body('reason').optional().isString()],
  validate,
  rejectPaymentHandler
)

export default paymentsRouter
