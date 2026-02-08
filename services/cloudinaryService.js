const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Upload file lên Cloudinary.
 * @param {string} filePath - Đường dẫn file tạm.
 * @param {string} folderName - Tên thư mục Cloudinary (mặc định là 'uploads').
 * @returns {Promise<{ url: string, publicId: string, type: string }>}
 */

exports.uploadToCloudinary = async (filePath, folderName = 'uploads', originalName) => {
  try {
    const ext = path.extname(originalName); // .pdf, .docx
    const baseName = path.basename(originalName, ext); // tenfile

    let publicId = `${folderName}/${baseName}`;
    let version = 0;

    // 🔁 Kiểm tra trùng tên
    while (true) {
      try {
        await cloudinary.api.resource(publicId);
        version++;
        publicId = `${folderName}/${baseName} - Phiên bản ${version}`;
      } catch (err) {
        // ❌ Không tồn tại → dùng tên này
        break;
      }
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      public_id: publicId,
      overwrite: false,
    });

    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
      originalName: result.original_filename + ext
    };

  } catch (error) {
    console.error('❌ Upload thất bại:', error);
    throw new Error('Không thể upload lên Cloudinary');
  }
};


exports.uploadToCloudinary1 = async (filePath, folderName = 'uploads') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Tự nhận dạng ảnh hoặc video
      folder: folderName,
    });

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type, // image hoặc video
    };
  } catch (error) {
    console.error('❌ Upload thất bại:', error);
    throw new Error('Không thể upload lên Cloudinary');
  }
};

/**
 * Xóa ảnh khỏi Cloudinary bằng public_id.
 * @param {string} publicId - ID ảnh trên Cloudinary (ví dụ: avatars/abc123)
 * @returns {Promise<void>}
 */
exports.deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      console.log('🗑️ Đã xóa ảnh khỏi Cloudinary:', publicId);
    } else {
      console.warn('⚠️ Ảnh không tồn tại hoặc đã bị xóa:', publicId);
    }
  } catch (error) {
    console.error('❌ Lỗi khi xóa ảnh khỏi Cloudinary:', error.message);
  }
};


// Upload bất kỳ file nào lên folder riêng theo loại
exports.uploadFile = async (filePath, fileType) => {
  try {
    let folderName = "uploads";

    if (fileType === "image") folderName = "images/posts";
    else if (fileType === "video") folderName = "videos/posts";
    else folderName = "files/posts";

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
      resource_type: "auto", // tự nhận dạng
    });

    // Xóa file local
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type // image | video | raw
    };
  } catch (error) {
    console.error("❌ Lỗi upload:", error);
    throw new Error("Không thể upload file lên Cloudinary");
  }
};