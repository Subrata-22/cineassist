import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'cineassist/shots',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 10 * 1024 * 1024, // 10MB
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

export const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
