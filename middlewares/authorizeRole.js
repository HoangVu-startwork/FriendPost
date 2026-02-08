const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

module.exports = (alloweRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id; // lấy từ verifyToken middleware

            // lấy role của user
            const userRole = await UserRole.findOne({ where: { userId }});
            if (!userRole) return res.status(403).json({ message: 'Không có quyền truy cập'});

            const role = await Role.findByPk(userRole.roleId);
            // findByPk là một hàm (phương thức) trong Sequelize — một thư viện ORM của Node.js, dùng để tìm một bản ghi trong cơ sở dữ liệu dựa trên khóa chính (Primary Key).
            // findByPk = find by primary key → “tìm theo khóa chính”.
            // Cú pháp : Model.findByPk(primaryKeyValue, options)
            // Model: là tên bảng bạn muốn truy vấn (ví dụ: User, Product, Role, …).
            // primaryKeyValue: giá trị của khóa chính (thường là id).
            // options (tuỳ chọn): cho phép thêm điều kiện, chọn cột (attributes), hoặc lấy dữ liệu liên kết (include).
            if (!role) return res.status(403).json({ message: 'Không có quyền try cập'});

            // Kiểm tra role có trong danh sách allowed không
            if (!alloweRoles.includes(role.name)) {
                return res.status(403).json({ message: ' Bạn không có quyền try cập API này'});
            }

            next();
        } catch (error) {
            res.status(500).json({ message: 'Lỗi xác thực quyền try cập'});
        }
    }
}