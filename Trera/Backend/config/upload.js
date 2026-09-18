import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Đảm bảo thư mục uploads tồn tại cho chế độ local fallback
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Kiểm tra cấu hình Cloudinary từ biến môi trường
export const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    !CLOUDINARY_API_KEY.includes("điền_")
  );
};

// Hàm lấy client Cloudinary đã cấu hình
export const getCloudinaryClient = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  return cloudinary;
};

// Cấu hình Multer sử dụng memoryStorage
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

/**
 * Upload tệp lên Cloudinary hoặc lưu Local dự phòng
 */
export const uploadFileToStorage = async (buffer, originalName, mimeType) => {
  if (isCloudinaryConfigured()) {
    const cld = getCloudinaryClient();
    return new Promise((resolve, reject) => {
      const isImage = mimeType.startsWith("image/");
      const resourceType = isImage ? "image" : "raw";
      const uploadStream = cld.uploader.upload_stream(
        {
          folder: "trera_attachments",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            console.error("❌ Lỗi upload Cloudinary:", error);
            return reject(error);
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            filename: result.original_filename || originalName,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Chế độ dự phòng Local Storage
  const ext = path.extname(originalName) || (mimeType.startsWith("image/") ? ".png" : "");
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueFilename = `${Date.now()}-${baseName}${ext}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueFilename}`,
    publicId: null,
    filename: uniqueFilename,
  };
};

/**
 * Xoá tệp khỏi Cloudinary và Local Storage
 */
export const deleteFileFromStorage = async (publicId, filename) => {
  try {
    if (publicId && isCloudinaryConfigured()) {
      const cld = getCloudinaryClient();
      await cld.uploader.destroy(publicId);
    }
  } catch (error) {
    console.warn("Lỗi xoá tệp trên Cloudinary:", error.message);
  }

  try {
    if (filename) {
      const localPath = path.join(uploadDir, filename);
      if (fs.existsSync(localPath)) {
        await fs.promises.unlink(localPath);
      }
    }
  } catch (error) {
    console.warn("Lỗi xoá tệp trên Local:", error.message);
  }
};
