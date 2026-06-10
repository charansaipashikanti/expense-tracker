import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import multer from 'multer';
import { cloudinary } from '../config/cloudinary';
import Receipt from '../models/Receipt';
import Expense from '../models/Expense';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';
import { ApiError } from '../utils/ApiError';

const router = Router();
router.use(authenticate);

// Multer config — memory storage for Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and PDF files are allowed'));
    }
  },
});

// Upload receipt
router.post('/:expenseId', uploadLimiter, upload.single('receipt'), asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const expense = await Expense.findById(req.params.expenseId);
  if (!expense) throw ApiError.notFound('Expense not found');

  // Upload to Cloudinary
  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'room-expense-tracker/receipts',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(req.file!.buffer);
  });

  const receipt = await Receipt.create({
    expenseId: expense._id,
    url: result.secure_url,
    publicId: result.public_id,
    fileType: req.file.mimetype,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadedBy: req.user!.userId,
  });

  // Link to expense
  expense.receiptId = receipt._id;
  await expense.save();

  res.status(201).json(ApiResponse.created(receipt, 'Receipt uploaded'));
}));

// Get receipt for an expense
router.get('/:expenseId', asyncHandler(async (req, res) => {
  const receipt = await Receipt.findOne({ expenseId: req.params.expenseId });
  if (!receipt) throw ApiError.notFound('No receipt found');
  res.json(ApiResponse.ok(receipt));
}));

// Delete receipt
router.delete('/:receiptId', asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.receiptId);
  if (!receipt) throw ApiError.notFound('Receipt not found');

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(receipt.publicId);

  // Unlink from expense
  await Expense.updateOne({ _id: receipt.expenseId }, { $unset: { receiptId: 1 } });

  await Receipt.deleteOne({ _id: receipt._id });
  res.json(ApiResponse.ok(null, 'Receipt deleted'));
}));

export default router;
