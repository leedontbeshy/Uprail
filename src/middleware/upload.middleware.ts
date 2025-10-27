import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { env } from '../config/env';

/**
 * Configure storage for uploaded files
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter for image uploads
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Accept only jpeg and png images
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG and PNG images are allowed.'
      ) as any,
      false
    );
  }
};

/**
 * Multer configuration for avatar uploads
 */
export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE, // 5MB by default
    files: 1, // Only one file at a time
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer configuration for general file uploads
 */
export const fileUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
});

/**
 * Multer configuration for memory storage (useful for processing before saving)
 */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE,
  },
  fileFilter: imageFileFilter,
});
