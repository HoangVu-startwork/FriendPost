// Thêm dữ liệu vào Role

require('dotenv').config();
const sequelize = require('../config/database');
const Role = require('../models/Role');

const roles = [
    { name: 'khachhang', description: 'Khách hàng (user bình thường)' },
    { name: 'admin', description: 'Quản lý toàn bộ quyền'},
    { name: 'admin_user', description: 'Quản lý user (thêm/sửa/xóa user)' },
    { name: 'admin_dangbai', description: 'Quản lý đăng bài (tạo/sửa bài đăng)' },
    { name: 'admin_pheduyet', description: 'Quản lý phê duyệt (duyệt bài, nội dung)' },
    { name: 'admin_taotaikhoan', description: 'Tạo tài khoản admin khác' },
];

async function seed() {
    try {
        await sequelize.authenticate(); // kiểm tra xem có kết nối được tới cơ sở dữ liệu không. Nếu không kết nối được → ném lỗi.
        // Lặp qua từng role và chèn vào DB
        for (const r of roles) {
            await Role.findOrCreate({ where: { name: r.name }, defaults: r })
            // Dòng này duyệt qua từng vai trò trong mảng roles.
            // findOrCreate nghĩa là:
            // Tìm trong DB xem có role nào có name giống như r.name chưa.
            // Nếu chưa có → tạo mới role đó với dữ liệu mặc định là defaults: r.
            // Nếu đã có → bỏ qua (không tạo trùng).
            // Điều này đảm bảo chạy seeder nhiều lần cũng không bị trùng dữ liệu.
        }
        console.log('Seed roles xong');
        process.exit(0); // kết thúc tiến trình Node.js thành công.
    } catch (err) {
        console.error(err);
        process.exit(1); // thoát chương trình với mã lỗi (1).
    }
}

seed();