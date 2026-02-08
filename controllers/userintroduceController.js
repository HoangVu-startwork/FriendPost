const userintroduceService = require('../services/userintroduceService');

// Thêm thông tin trường học
exports.createEducations = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user.id;
        const created = await userintroduceService.createUserEducation(userId, data);

        res.json({
            success: true,
            data: created
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// truy vấn thông tin của user gồm có tất cả post, trường, thông tin cá nhân, thong tin email, sdt ....
exports.getEducation = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const data = await userintroduceService.getUserEducation(userId, currentUserId);
        res.json({
            success: true,
            data
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Thêm thông tin
exports.createUserInforations = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user.id;
        const create = await userintroduceService.createUserInforation(userId, data)
        res.json({
            success: true,
            create
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// truy vấn thông tin dựa vào userid
exports.getUserInforation = async (req, res) => {
    try {
        const userId = req.body.id;
        const data = await userintroduceService.getUserInforation(userId);
        res.json({
            success: true,
            data
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Thêm mối quan hệ
exports.createRelationship = async (req, res) => {
    try {
        const userId = req.user.id;
        const { partnerId, status, anniversary } = req.body;
        const data = await userintroduceService.createUserRelationship(userId, partnerId, status, anniversary);
        res.json({
            success: true,
            data
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Xác nhận mối quan hệ
exports.confirmRelationships = async (req, res) => {
    try {
        const { relationshipId } = req.user.id;
        const { isAccepted } = req.body;

        const result = await userintroduceService.confirmRelationship(
            relationshipId,
            isAccepted
        );

        return res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}

// Thêm thông tin công việc
exports.createUserJobs = async (req, res) => {
    try {
        // const { userId } = req.params;
        const userId = req.user.id;
        const data = req.body;

        const job = await userintroduceService.createUserJob(userId, data)
        res.json({
            success: true,
            job
        })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Truy vấn thông tin công việc
exports.getUsersJob = async (req, res) => {
    try {
        const { userId } = req.body;
        const data = await userintroduceService.getUserJob(userId);
        res.json({
            success: true,
            data
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
}