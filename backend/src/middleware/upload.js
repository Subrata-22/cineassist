import multer from 'multer';

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

// Multer in-memory storage for Cloudinary upload
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});
