const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const jwt = require('jsonwebtoken');
const {
    uploadToCloudinary,
    deleteFromCloudinary,
} = require('../services/cloudinaryService');

const SALT_ROUNDS = 10;

exports.registerUser = async (data) => {
    const { username, email, sdt, password, ngaysinh, giotinh } = data;

    // 🧩 1️⃣ Kiểm tra dữ liệu trống
    if (!username || !email || !sdt || !password || !ngaysinh || !giotinh) {
        throw new Error('Vui lòng nhập đầy đủ thông tin: username, email, sdt, password, giotinh');
    }

    // 🧩 2️⃣ Kiểm tra độ mạnh của mật khẩu
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // Giải thích regex:
    // (?=.*[a-z]) ít nhất 1 chữ thường
    // (?=.*[A-Z]) ít nhất 1 chữ hoa
    // (?=.*\d) ít nhất 1 chữ số
    // (?=.*[@$!%*?&]) ít nhất 1 ký tự đặc biệt
    // {8,} độ dài tối thiểu 8 ký tự

    if (!passwordRegex.test(password)) {
        throw new Error(
            'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
        );
    }

    const existingUser = await User.findOne({ where: { email } });
    // await là từ khóa dùng trong JavaScript để chờ (đợi) một Promise hoàn thành (resolve hoặc reject) trước khi tiếp tục chạy dòng code tiếp theo.
    // findOne là một phương thức dùng để tìm và trả về một bản ghi duy nhất trong cơ sở dữ liệu nó phù hợp với điều kiện (where) mà bạn chỉ định
    // Nếu tìm thấy, nó sẽ trả về đối tượng (object) tương ứng.
    // Nếu không tìm thấy, nó sẽ trả về null.
    // khi nào sử dụng : Khi bạn chỉ cần một kết quả
    if (existingUser) throw new Error("Email đã tồn tại");

    // ➤ Kiểm tra sdt đã tồn tại hay chưa
    const sdtExists = await User.findOne({
        where: { sdt },
        attributes: ['id'],
    });

    if (sdtExists) {
        throw new Error('Số điện thoại đã tồn tại.');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    // Mã hoá mật khẩu bằng bcrypt
    // Tham số thứ 2 (10) là số vòng lặp “salt rounds”, càng cao thì càng bảo mật nhưng cũng tốn thời gian hơn.
    // Kết quả là hashedPassword — chuỗi mật khẩu đã mã hóa, không thể giải ngược lại được.

    const defaultRole = await Role.findOne({ where: { name: 'khachhang' } });
    if (!defaultRole) throw new Error('Role mặc định "khachang" chưa tồn tại.');
    // Lấy Role mặc định từ bảng roles có name = 'khachhang'.
    // Nếu chưa có role này (VD: database chưa khởi tạo role), báo lỗi.

    const user = await User.create({
        username,
        email,
        sdt,
        ngaysinh,
        giotinh,
        password: hashedPassword,
        RoleId: defaultRole.id,
    });
    // Tạo user mới trong bảng users:
    // password được gán giá trị đã mã hoá
    // RoleId là khoá ngoại trỏ đến bảng roles.

    await UserRole.create({
        userId: user.id,
        roleId: defaultRole.id,
    });
    return user;
};

exports.registerUserAdmin = async (data) => {
    const { username, email, sdt, password, ngaysinh } = data;

    // 🧩 1️⃣ Kiểm tra dữ liệu trống
    if (!username || !email || !sdt || !password || !ngaysinh) {
        throw new Error('Vui lòng nhập đầy đủ thông tin: username, email, sdt, password');
    }

    // 🧩 2️⃣ Kiểm tra độ mạnh của mật khẩu
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // Giải thích regex:
    // (?=.*[a-z]) ít nhất 1 chữ thường
    // (?=.*[A-Z]) ít nhất 1 chữ hoa
    // (?=.*\d) ít nhất 1 chữ số
    // (?=.*[@$!%*?&]) ít nhất 1 ký tự đặc biệt
    // {8,} độ dài tối thiểu 8 ký tự

    if (!passwordRegex.test(password)) {
        throw new Error(
            'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
        );
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) throw new Error("Email đã tồn tại");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const defaultRole = await Role.findOne({ where: { name: 'admin' } });
    if (!defaultRole) throw new Error('Role mặc định "khachang" chưa tồn tại.');

    const user = await User.create({
        username,
        email,
        sdt,
        ngaysinh,
        password: hashedPassword,
        RoleId: defaultRole.id,
    });

    await UserRole.create({
        userId: user.id,
        roleId: defaultRole.id,
    });
    return user;
}

exports.getUserStatistics = async () => {
    // Tổng số user
    const totalUsers = await User.count();
    // .count() là hàm của Sequelize dùng để đếm tổng số bản ghi (số hàng) trong bảng đó.
    // await giúp đợi truy vấn chạy xong trước khi gán kết quả vào biến.

    //; Danh sách tất cả role
    const roles = await Role.findAll()
    // .findAll() là hàm của Sequelize dùng để lấy tất cả bản ghi trong bảng.

    const roleCounts = {}; // Tạo một object rỗng tên là roleCounts. Object này dùng để lưu kết quả đếm số lượng người dùng theo từng vai trò (role).
    for (const role of roles) { // Đây là vòng lặp for...of, dùng để duyệt qua từng phần tử trong mảng roles. roles ở đây là danh sách các vai trò, được lấy từ await Role.findAll() trước đó.
        const count = await UserRole.count({ where: { roleId: role.id } }); // Đếm số người dùng có role đó
        // Ở mỗi lần lặp, code này:
        // Truy vấn đến bảng UserRole (bảng trung gian giữa User và Role).
        // Đếm xem có bao nhiêu bản ghi có roleId bằng với role.id hiện tại.
        roleCounts[role.name] = count; // Lưu kết quả đếm vào object với key là tên role
    }

    return { totalUsers, roleCounts }
}

exports.login = async (identifier, password) => {
    let user;

    // Kiểm tra nếu có ký tự @ thì đăng nhập bằng email
    if (identifier.includes('@')) {
        user = await User.findOne({ where: { email: identifier } });
    } else {
        // Ngược lại, đăng nhập bằng số điện thoại
        user = await User.findOne({ where: { sdt: identifier } });
    }

    // const user = await User.findOne({ where: { email } });
    // User.findOne() tìm trong bảng users một người dùng có email trùng với email được truyền vào.
    // Nếu không tìm thấy, ném lỗi "Email không tồn tại".
    // ➡️ Ngăn người dùng nhập email sai.
    if (!user) throw new Error('Email hoặc số điện thoại không tồn tại');

    const isMatch = await bcrypt.compare(password, user.password);
    // Dùng thư viện bcrypt để so sánh mật khẩu người dùng nhập vào (password) với mật khẩu đã mã hóa trong DB (user.password).
    // bcrypt.compare() sẽ tự giải mã và đối chiếu (chứ không cần giải mã thủ công)
    // Nếu không khớp → ném lỗi "Mật khẩu không đúng".
    // Đảm bảo bảo mật, không bao giờ lưu mật khẩu gốc.
    if (!isMatch) throw new Error('Tài khoản và mật khẩu không đúng');

    const userRole = await UserRole.findOne({ where: { userId: user.id } });
    // Ở đây có bảng trung gian UserRole, thể hiện quan hệ N-N giữa User và Role.
    // Tìm trong bảng UserRole xem user này có vai trò nào không.
    // Nếu chưa có, báo lỗi "User chưa có role".
    // ➡️ Đảm bảo rằng mỗi user đều có quyền hạn cụ thể.
    if (!userRole) throw new Error('User chưa có role');

    const role = await Role.findOne({ where: { id: userRole.roleId } });
    // Dựa vào roleId trong UserRole, tìm role tương ứng trong bảng Role.
    // Nếu không tồn tại, ném lỗi "Role không tồn tại".
    // ➡️ Ví dụ: role.name có thể là "admin_user" hoặc "khachhang".
    if (!role) throw new Error('Role không tồn tại');

    // 🔑 Tạo JWT token
    const token = jwt.sign(
        // Dùng thư viện jsonwebtoken (jwt) để tạo token xác thực.
        // Cấu trúc:
        // Payload (nội dung token): chứa id, email, role của user.
        // Secret key: process.env.JWT_SECRET → khóa bí mật dùng để ký token (bạn lưu trong .env).
        // expiresIn: thời gian hết hạn (ví dụ: "1d" hoặc "2h") lấy từ .env.
        { id: user.id, email: user.email, role: role.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
    );

    return { token, user, role };
};

// findByPk là phương thức của Sequelize Model dùng để tìm một bản ghi trong cơ sở dữ liệu dựa theo khóa chính (Primary Key).
// Cú pháp: Model.findByPk(primaryKeyValue, options)
// Model: là tên của model (ví dụ User, Product, Role…)
// primaryKeyValue: giá trị của khóa chính (thường là id)
// options: (tuỳ chọn) — có thể thêm attributes, include, where, v.v.
exports.getUserInto = async (userId) => {
    // const user = await User.findByPk(userId);
    const user = await User.findByPk(Number(userId));

    if (!user) throw new Error('Không tìm thấy người dùng');

    const userRole = await UserRole.findOne({ where: { userId: user.id } });
    if (!userRole) throw new Error('User chưa có role');

    const role = await Role.findOne({ where: { id: userRole.roleId } });

    return {
        id: user.id,
        email: user.email,
        username: user.username,
        sdt: user.sdt,
        avaturl: user.avatUrl,
        avatUrlfacebook: user.avatUrlfacebook,
        giotinh: user.giotinh,
        ngaysinh: user.ngaysinh,
        rolr: role ? role.name : 'Chưa có vai trò'
    };
};

// exports.verifyToken = async (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader?.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Token không hợp lệ" });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       const user = await User.findByPk(Number(decoded.id));
//       if (!user) {
//         return res.status(401).json({ error: "User không tồn tại" });
//       }

//       req.user = { id: user.id };
//       next();
//     } catch (err) {
//       return res.status(401).json({ error: "Token hết hạn hoặc không hợp lệ" });
//     }
//   };


exports.updateUserAvatar = async (userId, file) => {
    if (!file) {
        throw new Error('Vui lòng chọn ảnh để tải lên.');
    }
    const user = await User.findByPk(userId);
    if (!user) {
        fs.unlinkSync(file.path);
        throw new Error('Không tìm thấy người dùng.');
    }
    // Nếu user có avatar cũ → xóa khỏi Cloudinary
    if (user.avatUrl) {
        try {
            const parts = user.avatUrl.split('/');
            const fileName = parts[parts.length - 1];
            const publicId = 'avatars/' + fileName.split('.')[0];
            await deleteFromCloudinary(publicId);
        } catch (err) {
            console.warn('⚠️ Không thể xóa ảnh cũ:', err.message);
        }
    }
    // Upload ảnh mới lên Cloudinary
    const filePath = path.join(__dirname, '..', file.path);
    const uploadResult = await uploadToCloudinary(filePath, 'avatars');
    // Cập nhật DB
    user.avatUrl = uploadResult.url;
    await user.save();

    return uploadResult.url;
};
exports.uploadavatUrlfacebook = async (userId, file) => {
    // 1. Kiểm tra file đầu vào
    if (!file || !file.buffer) {
        throw new Error('Dữ liệu file không hợp lệ.');
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('Không tìm thấy người dùng.');
    }

    // 2. Logic xóa ảnh cũ (Bọc kín trong try-catch để nếu lỗi vẫn chạy tiếp)
    if (user.avatUrlfacebook) {
        try {
            // Trích xuất publicId từ URL cũ
            const parts = user.avatUrlfacebook.split('/');
            const fileWithExt = parts[parts.length - 1]; // Gemini_Generated_Image...jpg
            const publicId = 'avatars/' + fileWithExt.split('.')[0];
            
            console.log("🔄 Đang thử xóa ảnh cũ:", publicId);
            await deleteFromCloudinary(publicId);
        } catch (err) {
            // Chỉ log cảnh báo, không ném lỗi (throw error) để tiến trình bên dưới vẫn chạy
            console.warn('⚠️ Cảnh báo: Không thể xóa ảnh cũ trên Cloudinary, vẫn tiếp tục upload ảnh mới:', err.message);
        }
    }

    // 3. Upload ảnh mới lên Cloudinary bằng Buffer (Dùng file.buffer)
    try {
        const uploadResult = await uploadToCloudinary(file.buffer, 'avatars', file.originalname);

        // 4. Cập nhật Database với URL mới
        user.avatUrlfacebook = uploadResult.url;
        await user.save();

        return uploadResult.url;
    } catch (uploadError) {
        console.error('❌ Lỗi khi upload ảnh mới:', uploadError);
        throw new Error('Tải ảnh mới lên thất bại.');
    }
};



exports.logoutUser = async (token) => {
    // Nếu quản lý session trong Redis hoặc Database:
    // logic: await SessionModel.deleteOne({ token });
    
    // Nếu bạn chỉ dùng JWT thuần túy (Stateless):
    // Ở đây có thể để trống hoặc ghi log đăng xuất.
    return true;
}

exports.registerUsersMang = async (usersData) => {
    if (!Array.isArray(usersData)) {
        throw new Error('Dữ liệu phải là một mãng user');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const defaultRole = await Role.findOne({ where: { name: 'khachhang' } });
    if (!defaultRole) throw new Error('Role mặc định "khachhang" chưa tồn tại.');

    const results = [];

    for (const data of usersData) {
        const { username, email, sdt, password, ngaysinh, giotinh, avatUrl } = data;

        if (!username || !email || !sdt || !password || !ngaysinh || !giotinh) {
            results.push({ email, error: 'Thiếu thông tin bắt buộc' });
            continue;
        }

        if (!passwordRegex.test(password)) {
            results.push({ email, error: 'Mật khẩu không đủ mạnh' });
            continue;
        }

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
            results.push({ email, error: 'Email đã tồn tại' });
            continue;
        }

        const sdtExists = await User.findOne({ where: { sdt } });
        if (sdtExists) {
            results.push({ email, error: 'Số điện thoại đã tồn tại' });
            continue;
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            username,
            email,
            sdt,
            ngaysinh,
            giotinh,
            avatUrl: avatUrl || null,
            password: hashedPassword,
            RoleId: defaultRole.id,
        });

        await UserRole.create({
            userId: user.id,
            roleId: defaultRole.id,
        });

        results.push({
            id: user.id,
            username: user.username,
            email: user.email,
            role: 'khachhang',
        });
    }

    return results;
}

