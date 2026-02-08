const bcrypt = require('bcrypt');
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const UserRelationhip = require('../models/UserRelationship');
const UserInformation = require('../models/UserInformation');
const UserEducation = require('../models/UserEducation');
const FriendRequest = require('../models/FriendRequest');
const Post = require('../models/Post');
const UserJob = require('../models/UserJob');
const Notification = require('../models/Notification');
const PostPrivacyUser = require('../models/PostPrivacyUser');
const Reaction = require('../models/Reaction');
const PostReaction = require('../models/PostReaction');

// Thêm thành mảng dữ liệu 
exports.createUserEducations = async (userId, data) => {
    const educationArray = Array.isArray(data) ? data : [data]
    const row = educationArray.map(e => ({
        userId,
        schoolName: e.schoolName,
        level: e.level,
        startYear: e.startYear,
        endYear: e.endYear || null
    }));

    const created = await UserEducation.bulkCreate(row, {
        returning: true
    });

    return created;
};


// exports.createUserEducation = async (userId, data) => {
//     const created = await UserEducation.create({
//         userId,
//         schoolName: data.schoolName,
//         level: data.level,
//         startYear: Number(data.startYear),
//         endYear: data.endYear ? Number(data.endYear) : null
//     });

//     return created;
// }
exports.createUserEducation = async (userId, data) => {
    const currentYear = new Date().getFullYear();

    let schoolNameFinal = data.schoolName;

    const startYear = Number(data.startYear);
    const endYear = data.endYear ? Number(data.endYear) : null;

    //Đã học
    if (endYear && endYear < currentYear) {
        schoolNameFinal = `Đã học ${data.schoolName}`;
    }
    //Đang học
    else {
        schoolNameFinal = `Đang học tại ${data.schoolName}`;
    }

    const created = await UserEducation.create({
        userId,
        schoolName: schoolNameFinal,
        level: data.level,
        startYear,
        endYear
    });

    return created;
};

exports.createUserJob = async (userId, data) => {
    const currentYear = new Date().getFullYear();

    let companyNameFinal = data.companyName;

    if (data.endYear) {
        const endYear = new Date(data.endYear).getFullYear();

        // Đã làm
        if (endYear < currentYear) {
            companyNameFinal = `Đã làm tại ${data.companyName}`;
        }
    } else {
        // Đang làm
        companyNameFinal = `Hiện tại đang làm tại ${data.companyName}`;
    }

    return await UserJob.create({
        userId,
        companyName: companyNameFinal,
        position: data.position,
        startYear: data.startYear,
        endYear: data.endYear || null
    });
}

exports.createUserInforation = async (userId, data) => {

    const existed = await UserInformation.findOne({
        where: { userId }
    });

    if (existed) {
        return {
            success: false,
            message: 'User đã có thông tin giới thiệu, không thể tạo mới'
        };
    }
    const created = await UserInformation.create({
        userId,
        accommodation: data.accommodation,
        introduce: data.introduce
    });

    return {
        message: 'Tạo thông tin giới thiệu thành công',
        data: created
    };
}

exports.getUserInforation = async (userId) => {
    const inforation = await UserInformation.findAll({
        where: { userId },
        order: [['startYear', 'ASC']]
    });

    return inforation;
}

exports.getUserJob = async (userId) => {
    const job = await UserJob.findAll({
        where: { userId },
        // order: [['startYear', 'ASC']]
        order: [
            [
                Sequelize.literal(`
                    CASE
                        WHEN "endYear" IS NULL THEN 0
                        ELSE 1
                    END
                `),
                'ASC'
            ],
            // endYear lớn hơn đứng trước
            ['endYear', 'DESC']
        ]
    });

    return job;
}

exports.createUserRelationship = async (userId, partnerId, status, anniversary) => {
    // Kiểm tra user đã có mối quan hệ chưa
    const existed = await UserRelationhip.findOne({ where: { userId } })

    if (existed) {
        return { success: false, message: 'User đã có tình trạng mối quan hệ' };
    }

    const relationship = await UserRelationhip.create({
        userId,
        partnerId,
        status,
        anniversary,
        isConfirmed: false
    });

    // Tạo thông báo cho user 2
    await Notification.create({
        senderId: userId,
        receiverId: partnerId,
        type: 'relationship_request',
        relationshipId: relationship.id
    });

    return {
        success: true,
        message: 'Đã gửi yêu cầu mối quan hệ',
        data: relationship
    }
}


exports.getUserEducations = async (userId) => {
    const education = await UserEducation.findAll({
        where: { userId },
        order: [['startYear', 'ASC']]
    });

    const user = await User.findByPk(Number(userId));

    const post = await Post.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
    })
    return { post, education, user };
};

// truy cập thông tin của user thông tin
exports.getUserEducations = async (userId, currentUserId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'avatUrl', 'sdt', 'giotinh', 'ngaysinh', 'createdAt'],
        include: [
            {
                model: UserEducation,
                as: 'educations',
                separate: true,
                attributes: ['schoolName', 'level', 'startYear', 'endYear'],
                order: [
                    ['endYear', 'DESC'],
                    [
                        Sequelize.literal(`
                            CASE "level"
                                WHEN 'Trung học' THEN 1
                                WHEN 'Cao đẳng' THEN 2
                                WHEN 'Đại học' THEN 3
                                WHEN 'Cao học' THEN 4
                                ELSE 5
                            END
                        `),
                        'ASC'
                    ]
                ]
            },
            {
                model: Post,
                as: 'Posts',
                attributes: ['id', 'mediaUrl', 'mediaType', 'backgroundColor', 'fileUrl', 'fileType', 'privacy', 'content', 'createdAt'],
                separate: false,
                order: [['createdAt', 'DESC']],
            },
            {
                model: UserInformation,
                as: 'information',
                attributes: ['accommodation', 'introduce'],
                required: false
            },
            {
                model: FriendRequest,
                as: 'sentRequests',
                attributes: ['id', 'status', 'message', 'acceptedAt', 'createdAt'],
                where: {
                    senderId: userId,
                    receiverId: currentUserId
                },
                required: false
            }
        ],
    });

    return user;
}

// xác nhận mối quan hệ giữa các user
exports.confirmRelationship = async (relationshipId, isAccepted) => {
    const relationship = await UserRelationhip.findByPk(relationshipId);

    if (!relationship) {
        return { success: false, message: 'Không tìm thấy mối quan hệ' }
    }
    // Trường hợp từ chối
    if (!isAccepted) {
        // Gửi thông báo cho người gửi lời mời
        await Notification.create({
            senderId: relationship.partnerId,   // người từ chối
            receiverId: relationship.userId,    // người gửi lời mời
            type: 'relationship_rejected',
            relationshipId: relationship.id
        });

        // Xoá mối quan hệ
        await relationship.destroy();

        return {
            success: true,
            message: 'Đã từ chối mối quan hệ'
        };
    }

    // Trường hợp chấp nhận

    // Xác nhận mối quan hệ ban đầu
    relationship.isConfirmed = true;
    relationship.startDate = new Date();
    await relationship.save();

    // Thông báo cho user gửi lời mời
    await Notification.create({
        senderId: relationship.partnerId,
        receiverId: relationship.userId,
        type: 'relationship_accepted',
        relationshipId: relationship.id
    });

    return {
        success: true,
        message: 'Đã xác nhận mỗi quan hệ'
    };
}

exports.getUserEducation12 = async (userId, currentUserId) => {

    const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'avatUrl', 'sdt', 'giotinh', 'ngaysinh', 'createdAt'],
        include: [
            {
                model: UserEducation,
                as: 'educations',
                separate: true,
                attributes: ['schoolName', 'level', 'startYear', 'endYear'],
                order: [
                    ['endYear', 'DESC'],
                    [Sequelize.literal(`
                        CASE "level"
                            WHEN 'Trung học' THEN 1
                            WHEN 'Cao đẳng' THEN 2
                            WHEN 'Đại học' THEN 3
                            WHEN 'Cao học' THEN 4
                            ELSE 5
                        END
                    `), 'ASC']
                ]
            },
            {
                model: Post,
                as: 'Posts',
                attributes: [
                    'id','mediaUrl','mediaType','backgroundColor',
                    'fileUrl','fileType','privacy','content',
                    'createdAt','display','userId'
                ],
                order: [['createdAt', 'DESC']],
            },
            {
                model: UserInformation,
                as: 'information',
                attributes: ['accommodation', 'introduce'],
                required: false
            }
        ],
    });

    if (!user) return null;

    // ================= FRIEND LIST =================
    const friends = await FriendRequest.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        }
    });

    const friendIds = friends.map(f =>
        f.senderId === currentUserId ? f.receiverId : f.senderId
    );

    // ================= PRIVACY TABLE =================
    const privacyRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = privacyRows
        .filter(p => p.type === 'specific')
        .map(p => p.postId);

    const excludedPostIds = privacyRows
        .filter(p => p.type === 'exclude')
        .map(p => p.postId);

    // ================= FILTER POSTS =================
    const visiblePosts = user.Posts.filter(post => {

        if (post.display === 'hidden') return false;

        // Chủ bài luôn thấy
        if (post.userId === currentUserId) return true;

        if (post.privacy === 'public') return true;

        if (post.privacy === 'friends') {
            return friendIds.includes(post.userId);
        }

        if (post.privacy === 'only_me') return false;

        if (post.privacy === 'specific') {
            return specificPostIds.includes(post.id);
        }

        if (post.privacy === 'exclude') {
            return !excludedPostIds.includes(post.id);
        }

        return false;
    });

    // ================= REACTIONS =================
    const postIds = visiblePosts.map(p => p.id);
    const reactionMap = {};

    if (postIds.length > 0) {
        const reactions = await PostReaction.findAll({
            where: { postId: postIds },
            include: [{
                model: Reaction,
                attributes: ['code', 'label', 'icon']
            }]
        });

        reactions.forEach(r => {
            if (!r.Reaction) return;

            const postId = r.postId;
            const code = r.Reaction.code;

            if (!reactionMap[postId]) {
                reactionMap[postId] = { total: 0, detail: {} };
            }

            if (!reactionMap[postId].detail[code]) {
                reactionMap[postId].detail[code] = {
                    code,
                    label: r.Reaction.label,
                    icon: r.Reaction.icon,
                    count: 0
                };
            }

            reactionMap[postId].detail[code].count++;
            reactionMap[postId].total++;
        });
    }

    // ================= CONVERT USER TO JSON =================
    const userJson = user.toJSON();

    // ================= ATTACH REACTIONS TO POSTS =================
    userJson.Posts = visiblePosts.map(post => {
        const p = post.toJSON();
        const r = reactionMap[p.id];

        p.reactions = r
            ? { total: r.total, detail: Object.values(r.detail) }
            : { total: 0, detail: [] };

        return p;
    });

    return userJson;
};

exports.getUserEducation = async (userId, currentUserId) => {

    const user = await User.findByPk(userId, {
        attributes: ['id','username','email','avatUrl','sdt','giotinh','ngaysinh','createdAt'],
        include: [
            {
                model: UserEducation,
                as: 'educations',
                separate: true,
                attributes: ['schoolName','level','startYear','endYear'],
                order: [
                    ['endYear','DESC'],
                    [Sequelize.literal(`
                        CASE "level"
                            WHEN 'Trung học' THEN 1
                            WHEN 'Cao đẳng' THEN 2
                            WHEN 'Đại học' THEN 3
                            WHEN 'Cao học' THEN 4
                            ELSE 5
                        END
                    `),'ASC']
                ]
            },
            {
                model: Post,
                as: 'Posts',
                where: { display: 'presently' }, // 
                required: false,
                attributes: [
                    'id','mediaUrl','mediaType','backgroundColor',
                    'fileUrl','fileType','privacy','content',
                    'createdAt','display','userId'
                ],
                order: [['createdAt','DESC']],
            },
            {
                model: UserInformation,
                as: 'information',
                attributes: ['accommodation','introduce'],
                required: false
            }
        ],
    });

    if (!user) return null;

    // ===== FRIEND LIST =====
    const friends = await FriendRequest.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        }
    });

    const friendIds = friends.map(f =>
        f.senderId === currentUserId ? f.receiverId : f.senderId
    );

    // ===== PRIVACY TABLE (CHỈ CÁC DÒNG LIÊN QUAN ĐẾN NGƯỜI ĐANG XEM) =====
    const privacyRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = privacyRows
        .filter(p => p.type === 'specific')
        .map(p => p.postId);

    const excludedPostIds = privacyRows
        .filter(p => p.type === 'exclude')
        .map(p => p.postId);

    // ===== FILTER POSTS =====
    const visiblePosts = user.Posts.filter(post => {

        if (post.display === 'hidden') return false;

        // Chủ bài luôn thấy
        if (post.userId === currentUserId) return true;

        switch (post.privacy) {
            case 'public':
                return true;

            case 'friends':
                return friendIds.includes(post.userId);

            case 'only_me':
                return false;

            case 'specific':
                return specificPostIds.includes(post.id);

            case 'exclude':
                return !excludedPostIds.includes(post.id);

            default:
                return false;
        }
    });

    // ===== REACTIONS =====
    const postIds = visiblePosts.map(p => p.id);
    const reactionMap = {};

    if (postIds.length) {
        const reactions = await PostReaction.findAll({
            where: { postId: postIds },
            include: [{ model: Reaction, attributes: ['code','label','icon'] }]
        });

        reactions.forEach(r => {
            if (!r.Reaction) return;

            const postId = r.postId;
            const code = r.Reaction.code;

            if (!reactionMap[postId]) {
                reactionMap[postId] = { total: 0, detail: {} };
            }

            if (!reactionMap[postId].detail[code]) {
                reactionMap[postId].detail[code] = {
                    code,
                    label: r.Reaction.label,
                    icon: r.Reaction.icon,
                    count: 0
                };
            }

            reactionMap[postId].detail[code].count++;
            reactionMap[postId].total++;
        });
    }

    // ===== FINAL JSON =====
    const userJson = user.toJSON();

    userJson.Posts = visiblePosts.map(post => {
        const p = post.toJSON();
        const r = reactionMap[p.id];

        p.reactions = r
            ? { total: r.total, detail: Object.values(r.detail) }
            : { total: 0, detail: [] };

        return p;
    });

    return userJson;
};