import cloudinary from "../config/cloudinary";
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadToCloudinary = async (
  file: string | Buffer,
  folder = "uploads",
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      typeof file === "string"
        ? file
        : `data:image/png;base64,${file.toString("base64")}`,
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
  });
};
