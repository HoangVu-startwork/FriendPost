const userService = require('../services/userService');


// async là từ khóa dùng để khai báo một hàm bất đồng bộ (asynchronous function).
// Khi bạn đặt async trước một hàm, hàm đó tự động trả về một Promise, ngay cả khi bạn không viết return Promise.
exports.register = async (req, res) => {
    try {
        const user = await userService.registerUser(req.body);
        // Gọi hàm registerUser() từ userService.
        // Truyền dữ liệu người dùng từ req.body (gồm username, email, sdt, password).
        // Vì registerUser là async, nên cần dùng await.
        // Nếu đăng ký thành công, biến user sẽ chứa thông tin user mới vừa được lưu trong DB.
        res.status(201).json({
            message: 'Đăng ký thành công',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                ngaysinh: user.ngaysinh,
                role: 'khachhang'
            },
            // Gửi phản hồi JSON về cho client (trình duyệt hoặc frontend ReactJS chẳng hạn):
            // HTTP status 201: có nghĩa là “Created” — dữ liệu đã được tạo thành công.
            // Gửi kèm:
            // message: thông báo đăng ký thành công.
            // user: thông tin cơ bản của người dùng (ẩn mật khẩu để bảo mật).
            // role: mặc định là "khachhang" vì role này được gán trong service.
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
        // Nếu có lỗi xảy ra (ví dụ: email bị trùng, role chưa tồn tại, DB lỗi, …),
        // thì code trong catch sẽ được chạy.
        // Trả lại HTTP status 400 (Bad Request) cùng thông báo lỗi cho client.
    }
}

exports.registerAdmin = async (req, res) => {
    try {
        const user = await userService.registerUserAdmin(req.body);
        res.status(201).json({
            message: 'Đăng ký thành công quyền admin',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: 'admin'
            },
        });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
}

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const { token, user, role } = await userService.login(identifier, password);

        res.cookie("accessToken", token, {
            httpOnly: true,     // Trình duyệt không cho JS đọc cookie (chống XSS)
            secure: false,      // true nếu production có HTTPS
            // secure: process.env.NODE_ENV === 'production',   // Chỉ gửi qua HTTPS khi đã deploy (production)
            sameSite: "strict", // Chống tấn công CSRF
            maxAge: 5 * 24 * 60 * 60 * 1000 // 5 ngày
        });

        res.status(200).json({
            message: 'Đăng nhập thành công',
            user: { id: user.id, username: user.username, email: user.email, role: role.name }
        })
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
}

exports.getUserInfo = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await userService.getUserInto(id);
        res.status(200).json({
            message: 'Xác thực thành công',
            user
        })
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

exports.getUserStatistics = async (req, res) => {
    try {
        const stats = await userService.getUserStatistics();

        res.status(200).json({
            message: 'Thông kê người dùng thành công',
            data: stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thống kê người dùng' });
    }
};


exports.updateAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const newAvatarUrl = await userService.updateUserAvatar(userId, req.file);

        res.stats(200).json({
            message: 'Cập nhật ảnh đại diện thành công',
            avatarUrl: newAvatarUrl,
        })
    } catch (error) {
        console.error('❌ Lỗi cập nhật avatar:', error);
        res.status(400).json({ message: error.message });
    }
}

exports.uploadavatUrlfacebooks = async (req, res) => {
    try {
        const userId = req.user.id;
        // Kiểm tra nếu không có file (Multer xử lý xong sẽ nằm trong req.file)
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên.' });
        }

        const newAvatUrlfacebook = await userService.uploadavatUrlfacebook(userId, req.file);

        res.status(200).json({
            message: 'Cập nhật ảnh đại diện thành công',
            avatUrlfacebooks: newAvatUrlfacebook,
        })
    } catch (error) {
        console.error('❌ Lỗi cập nhật avatar:', error);
        res.status(400).json({ message: error.message });
    }
}


exports.registersMangUsers = async (req, res) => {
    try {
        const users = await userService.registerUsersMang(req.body);
        res.status(201).json({
            message: 'Đăng ký danh sách user hoàn tất',
            data: users
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


exports.logout = async (req, res) => {
    try {
        // gọi service
        await userService.logoutUser(req.cookies.token);
        // Xoá cookie trên trình duyệt
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS khi deploy
            sameSite: 'strict',
            path: '/' 
        });

        return res.status(200).json({
            status: 'success',
            message: 'Đăng xuất thành công!'
        });
    } catch (err) {
         return res.stats(500).json({
            status: 'error',
            message: 'Có lỗi xảy ra khi đăng xuất'
         })
    }
}




// -----------------------------------------------------------------------------------------------
// try {
// Đoạn code có thể gây lỗi
// } catch (error) {
// Xử lý lỗi ở đây
//  } finally {}
// được dùng để phát hiện và xử lý lỗi trong quá trình chạy chương trình.
// - try : chứa đoạn code có thể gây lỗi
// - catch : chứa đoạn code xử lý nếu có lỗi xảy ra 
// - error : Biến đại diện cho lỗi, chứa thông tin chi tiết (message, stack, v.v.)
// - finally : Luôn chạy cuối cùng, dù có lỗi hay không
// - Dùng cùng async/await : Bắt lỗi Promise rõ ràng, dễ đọc


