import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

export const configureCloudinary = (): void => {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured');
  } else {
    console.warn('⚠️ Cloudinary not configured — receipt uploads will be disabled');
  }
};

export { cloudinary };
