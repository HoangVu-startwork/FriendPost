const { Op, fn, col, literal, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const seedrandom = require('seedrandom');
const Post = require('../models/Post');
const PostPrivacyUser = require('../models/PostPrivacyUser');
const Reaction = require('../models/Reaction');
const PostReaction = require('../models/PostReaction');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

const { uploadToCloudinary } = require('./cloudinaryService');
const PostView = require('../models/PostView');

exports.createPost = async (content, file) => {
    let uploadResult = null;

    if (file) {
        uploadResult = await uploadToCloudinary(file.path, 'posts');
    }

    const post = await Post.create({
        content,
        mediaUrl: uploadResult ? uploadResult.url : null,
        mediaType: uploadResult ? uploadResult.type : null,
    });

    return post;
};

exports.createPostFb = async (content, file, userId, backgroundColor, privacy, userList) => {
    const t = await sequelize.transaction();

    try {
        let fileData = {
            mediaUrl: null,
            mediaType: null,
            fileUrl: null,
            fileType: null,
        };

        // ===== Upload file =====
        // if (file) {
        //     const mime = file.mimetype;
        //     let type = "file";

        //     if (mime.startsWith("image")) type = "image";
        //     else if (mime.startsWith("video")) type = "video";

        //     const uploadResult = await uploadToCloudinary(file.path, type);

        //     if (type === "image" || type === "video") {
        //         fileData.mediaUrl = uploadResult.url;
        //         fileData.mediaType = type;
        //     } else {
        //         fileData.fileUrl = uploadResult.url;
        //         fileData.fileType = mime;
        //     }
        // }
        if (file) {
            const mime = file.mimetype;
            let type = "file";

            if (mime.startsWith("image")) type = "image";
            else if (mime.startsWith("video")) type = "video";

            const uploadResult = await uploadToCloudinary(
                file.path,
                type,
                file.originalname // QUAN TRỌNG
            );

            if (type === "image" || type === "video") {
                fileData.mediaUrl = uploadResult.url;
                fileData.mediaType = type;
            } else {
                fileData.fileUrl = uploadResult.url;
                fileData.fileType = mime;
            }
        }

        // ===== Create Post =====
        const post = await Post.create({
            content,
            userId,
            mediaUrl: fileData.mediaUrl,
            mediaType: fileData.mediaType,
            fileUrl: fileData.fileUrl,
            fileType: fileData.fileType,
            backgroundColor: backgroundColor || null,
            display: 'presently',
            privacy: privacy || "public",
        }, { transaction: t });

        // ===== Insert privacy list =====
        if (['exclude', 'specific'].includes(privacy) && Array.isArray(userList) && userList.length > 0) {

            const privacyRows = userList.map(id => ({
                postId: post.id,
                userId: id,
                type: privacy  // ⭐ LƯU TYPE
            }));

            await PostPrivacyUser.bulkCreate(privacyRows, { transaction: t });
        }

        await t.commit();
        return post;

    } catch (error) {
        await t.rollback();
        throw error;
    }
};


exports.createPostFb1 = async (content, file, userId, backgroundColor, privacy, userList) => {

    let fileData = {
        mediaUrl: null,
        mediaType: null,
        fileUrl: null,
        fileType: null,
    };

    if (file) {
        const mime = file.mimetype;

        let type = "file";
        if (mime.startsWith("image")) type = "image";
        else if (mime.startsWith("video")) type = "video";

        const uploadResult = await uploadToCloudinary(file.path, type);

        if (type === "image" || type === "video") {
            fileData.mediaUrl = uploadResult.url;
            fileData.mediaType = type;
        } else {
            fileData.fileUrl = uploadResult.url;
            fileData.fileType = mime;
        }
    }

    const post = await Post.create({
        content,
        userId,
        mediaUrl: fileData.mediaUrl,
        mediaType: fileData.mediaType,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        backgroundColor: backgroundColor || null,
        display: 'presently',
        privacy: privacy || "public",
    });

    if (['exclude', 'specific'].includes(privacy) && Array.isArray(userList)) {
        for (let id of userList) {
            await PostPrivacyUser.create({
                postId: post.id,
                userId: id
            });
        }
    }

    return post;
};

// Thêm những cảm xúc vào bài post như : Like, love
exports.reactPostcodes = async ({ postId, userId, reactionCode }) => {
    // Lấy reaction từ bảng Reaction
    const reaction = await Reaction.findOne({
        where: { code: reactionCode }
    });

    if (!reaction) {
        throw new Error('Reaction không tồn tại');
    }

    // Kiểm tra user đã react post chưa
    const existing = await PostReaction.findOne({
        where: { postId, userId }
    });

    // Chưa react → tạo mới
    if (!existing) {
        return await PostReaction.create({
            postId,
            userId,
            reactionId: reaction.id
        });
    }

    // Bấm lại cùng reaction - > huỷ
    if (existing.reactionId === reaction.id) {
        await existing.destroy();
        return { removed: true };
    }

    // Đổi reaction
    existing.reactionId = reaction.id;
    await existing.save();
    return existing;
}

// Thêm những cảm xúc vào bài post như : Like, love -- Mới
exports.reactPostcode = async ({ postId, userId, reactionCode }) => {
    const reaction = await Reaction.findOne({
        where: { code: reactionCode }
    });

    if (!reaction) {
        throw new Error('Reaction không tồn tại');
    }

    const existing = await PostReaction.findOne({
        where: { postId, userId }
    });

    // 1️⃣ Chưa react → thêm
    if (!existing) {
        const created = await PostReaction.create({
            postId,
            userId,
            reactionId: reaction.id
        });

        return {
            status: 'added',
            reaction: reaction.code
        };
    }

    // 2️⃣ Bấm lại cùng reaction → xoá
    if (existing.reactionId === reaction.id) {
        await existing.destroy();

        return {
            status: 'removed',
            reaction: null
        };
    }

    // 3️⃣ Đổi reaction
    existing.reactionId = reaction.id;
    await existing.save();

    return {
        status: 'updated',
        reaction: reaction.code
    };
};




// Hiện bài post all
exports.getUserFeed = async (currentUserId) => {
    // Lấy bạn bè
    const friends = await FriendRequest.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
        },
    });

    const friendIds = friends.map(f =>
        f.senderId === currentUserId ? f.receiverId : f.senderId
    );

    // Lấy danh sách post bị exclude với user hiện tại
    const excludedPosts = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const excludedPostIds = excludedPosts.map(p => p.postId);

    // Lây danh sách post specific dành riêng cho user hiện tại
    const specificPosts = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = specificPosts.map(p => p.postId);

    // Query bài post theo quyền xem
    const posts = await Post.findAll({
        include: [
            {
                model: User,
                attributes: ['id', 'username', 'avatUrl']
            }
        ],
        where: {
            [Op.or]: [

                // 🌍 Public
                { privacy: 'public' },

                // 👤 Only me
                {
                    privacy: 'only_me',
                    userId: currentUserId
                },

                // 👥 Friends
                {
                    privacy: 'friends',
                    userId: { [Op.in]: friendIds }
                },

                // 🚫 Exclude (trừ user bị chặn)
                {
                    privacy: 'exclude',
                    id: { [Op.notIn]: excludedPostIds }
                },

                // 🎯 Specific (chỉ user được chỉ định)
                {
                    privacy: 'specific',
                    id: { [Op.in]: specificPostIds }
                }

            ]
        },
        order: [['createdAt', 'DESC']]
    });

    return posts;
};

// Hiện bài post thêm 1 bài post riêng không phải bạn bè -> hiện bài post: privacy lấy trang thái privacy từ csdl post rồi qua lấy userId của PostPrivacyUser để 
// xem trang thái chặn hay chỉ định xem bài post của user đang nhập

exports.getSmartFeed = async (currentUserId) => {

    // Tìm kiếm user đã có kết bạn với ai chưa
    const friends = await FriendRequest.findAll({
        // Lấy nhiều dòng từ bảng FriendRequest
        // -> findAll là hàm truy vấn dữ liệu của Sequelize dùng để: LẤY NHIỀU DÒNG (multiple records) từ database
        where: { // -> Bắt đầu phần điều kiện lọc dữ liệu (SQL WHERE)
            status: 'accepted', // -> Chỉ lấy các mối quan hệ đã đồng ý kết bạn
            [Op.or]: [
                // Op.or là toán tử OR của Sequelize -> chỉ cần thoả 1 trong 2 điều kiện bên dưới
                { senderId: currentUserId }, // User hiện tại là người gửi lời mời
                { receiverId: currentUserId } // User hiện tại là người nhận lời mời
            ]
        }
    });
    // Câu lệnh SQL: SELECT * FROM FriendRequests WHERE status = 'accepted' AND (senderId = currentUserId OR receiverId = currentUserId)


    const friendIds = friends.map(f => // -> Dòng này lấy ra ID của người còn lại trong mỗi mối quan hệ, tức là danh sách bạn bè của user hiện tại.
        // friends là mảng các dòng trong bảng FriendRequest đã accepted.
        // f = từng dòng lời mời kết bạn
        // .map() = lặp qua từng phần tử và tạo ra mảng mới
        // Áp dụng thuật toán 3 ngôi : điều_kiện ? giá_trị_đúng : giá_trị_sai
        f.senderId === currentUserId ? f.receiverId : f.senderId
    );

    // const specificRows = await PostPrivacyUser.findAll({ // Tất cả bài post mà người khác đã CHỈ ĐỊNH riêng user hiện tại được xem
    //     where: { userId: currentUserId }
    // });

    // const specificPostIds = specificRows.map(p => p.postId); // -> Chỉ những user này được xem
    // const excludedPostIds = specificRows.map(p => p.postId); // -> Ai cũng xem được TRỪ những user này


    const privacyRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = privacyRows
        .filter(p => p.type === 'specific')
        .map(p => p.postId);

    const excludedPostIds = privacyRows
        .filter(p => p.type === 'exclude')
        .map(p => p.postId);


    // Lấy các bài post mà user hiện tại có quyền xem từ: Bản thân , Bạn bè, Các thiết lập riêng tư ( privacy ) đặc biệt 
    const friendPosts = await Post.findAll({
        where: {
            display: 'presently', // -> Chỉ lấy bài đang hiển thị
            [Op.or]: [ // -> chỉ cần thỏa 1 trong các điều kiện dưới đây thì post được lấy.
                { userId: currentUserId }, // Dù privacy gì bạn vẫn thấy bài của mình.
                { privacy: 'public', userId: { [Op.in]: friendIds } }, // Bài public từ những người là bạn
                { privacy: 'friends', userId: { [Op.in]: friendIds } }, // Bài chỉ dành cho bạn bè → bạn là bạn của họ nên thấy được
                { privacy: 'specific', id: { [Op.in]: specificPostIds } }, // Những bài người khác chọn đích danh bạn xem
                { privacy: 'exclude', id: { [Op.notIn]: excludedPostIds } } // Bài dạng “ai cũng xem được TRỪ người chỉ định”
            ]
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }], // Lấy thông tin người đăng để hiển thị trên feed.
        order: Sequelize.literal('RANDOM()') // Xáo trộn bài viết, không hiển thị theo thời gian
    });

    // Lấy các bài viết từ những người KHÔNG phải bạn bè nhưng vẫn hợp lệ để xem.
    const strangerPosts = await Post.findAll({
        where: {
            display: 'presently', // -> Chỉ lấy bài đang hiển thị
            privacy: 'public', // Phải là bài công khai
            // Op.notIn = toán tử NOT IN trong SQL -> Lọc những dòng có giá trị KHÔNG nằm trong danh sách
            userId: { [Op.notIn]: [currentUserId, ...friendIds] } // currentUserId:  Loại bài của chính mình, friendIds: Loại bài của bạn bè
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }],
        order: Sequelize.literal('RANDOM()')
    });
    // Câu lệnh SQL: SELECT * FROM Posts WHERE display = 'presently' AND privacy = 'public' AND userId NOT IN (currentUserId, friendIds...) ORDER BY RANDOM();

    // MIX 10:1
    const finalFeed = []; // Tạo biến -> Mảng chứa feed cuối cùng sau khi trộn
    let strangerIndex = 0; // Con trỏ để lấy từng bài trong strangerPosts

    // Duyệt từng bài bạn bè
    friendPosts.forEach((post, index) => {
        finalFeed.push(post); // Mỗi vòng lặp đều cho bài bạn bè vào feed.
        if ((index + 1) % 10 === 0 && strangerPosts[strangerIndex]) {
            // (index + 1) % 10 === 0 -> Cứ 10 bài bạn bè thì điều kiện đúng 1 lần.
            // strangerPosts[strangerIndex] -> Kiểm tra còn bài người lạ để chèn không Tránh lỗi undefined
            finalFeed.push(strangerPosts[strangerIndex++]); // Thêm bài người lạ -> strangerIndex++ để lần sau lấy bài kế tiếp
        }
    });

    // Lấy danh sách ID post -> finalFeed là mảng post đã trộn xong.
    // Dòng này tạo: [12, 15, 20, 33, 40]
    const postIds = finalFeed.map(p => p.id); // -> Để biết cần lấy reaction cho những post nào.

    // Lấy toàn bộ reaction của các post đó
    const reactions = await PostReaction.findAll({
        // Op.in = toán tử IN trong SQL -> Lấy những dòng có giá trị nằm trong một danh sách
        where: { postId: { [Op.in]: postIds } },
        // SQL thuần tương đương : SELECT * FROM PostReactions WHERE postId IN (12,15,20,33,40)

        include: [{
            model: Reaction,
            attributes: ['code', 'label', 'icon']
        }]
    });
    // Join bảng Reaction để biết:
    // | code | label | icon |
    // | like | Thích | 👍   |
    // | love | Yêu   | ❤️   |

    // Lấy tổng lượt xem mỗi post
    const views = await PostView.findAll({
        where: { postId: { [Op.in]: postIds } },
        attributes: [
            'postId',
            [Sequelize.fn('COUNT', Sequelize.col('userId')), 'viewCount']
        ],
        group: ['postId']
    });

    const viewMap = {};
    views.forEach(v => {
        viewMap[v.postId] = parseInt(v.get('viewCount'));
    });

    const reactionMap = {}; // Tạo object gom nhóm

    // Duyệt từng reaction hộp chứa reaction
    reactions.forEach(r => { // forEach() là hàm dùng để lặp qua từng phần tử trong một mảng.
        // Mỗi r là 1 dòng:
        const postId = r.postId; // r là một dòng reaction đang duyệt trong reactions.forEach(r => { ... })
        // Mỗi reaction thuộc về một bài post
        // Ví dụ: {
        //   postId: 15,
        //   userId: 3,
        //   reactionId: 1
        // } -> Dòng này lấy ra ID bài viết mà reaction này thuộc về.

        if (!reactionMap[postId]) { // Kiểm tra xem trong object reactionMap đã có dữ liệu cho post này chưa.
            reactionMap[postId] = { // Tạo một entry mới cho post đó trong reactionMap.
                // -> Sau dòng này, cấu trúc sẽ thành: reactionMap = {  15: { ... } }
                total: 0, // Biến này để đếm tổng số reaction của post đó
                detail: {} // 1.1 -> Đây là object để chứa từng loại reaction detail: { like: { count: 3 }, love: { count: 1 } }
            };
        }

        const code = r.Reaction.code; // Lấy mã reaction của dòng hiện tại.

        if (!reactionMap[postId].detail[code]) { // Kiểm tra bài post này đã có loại reaction đó chưa -> Nếu giờ gặp "love" lần đầu → chưa tồn tại → phải tạo mới.
            reactionMap[postId].detail[code] = { // Tạo một ô chứa cho loại reaction đó
                code: r.Reaction.code,
                label: r.Reaction.label,
                icon: r.Reaction.icon,
                count: 0 // Ban đầu để count: 0 vì chưa cộng — bước sau mới cộng.
            };
        }

        reactionMap[postId].detail[code].count++; // Mỗi lần gặp 1 dòng reaction → tăng lên 1.
        //1.1 Sau này mỗi khi gặp 1 reaction:
        reactionMap[postId].total++;
    });

    // gắn reaction vào từng bài post
    const resultFeed = finalFeed.map(post => { // .map() = đi qua từng phần tử của mảng và tạo mảng mới -> Mỗi vòng lặp đang xử lý 1 bài post
        // Chuyển object Sequelize thành object thường
        const p = post.toJSON(); // Post từ Sequelize là model object, không phải JSON thuần. { id: 10, content: "Hello", userId: 2, ... }
        const r = reactionMap[p.id]; // Tìm trong reactionMap xem bài này có reaction không.
        // Ví dụ: reactionMap = { 10: { total: 5, detail: {...} } }
        // Nếu p.id = 10 → r có dữ liệu -> Nếu không ai react → r = undefined

        // -> Gắn field reactions vào bài post
        p.reactions = r // Bắt đầu tạo field mới cho post: { id: 10, content: "...", reactions: { ... } }
            ? { // Nếu bài có reaction
                total: r.total, // Nếu r tồn tại: total Tổng số reaction
                detail: Object.values(r.detail) // Chuyển object thành mảng
                // Ví dụ: 
                // Trước:
                // detail: {
                //   like: { code:"like", count: 2 },
                //   love: { code:"love", count: 1 }
                // }
                // Sau: detail: [
                //   { code:"like", count: 2 },
                //   { code:"love", count: 1 }
                // ] 
                // -> Vì frontend dễ render mảng hơn object.
            }
            : { total: 0, detail: [] };
        // Tránh lỗi frontend bằng cách luôn trả cấu trúc chuẩn:

        // Gắn view vào 
        p.views = viewMap[p.id] || 0;

        return p;
    });

    return resultFeed;
};

// Thêm lượt xem vào bài viết (post)
exports.addPostView = async (postId, userId) => {
    try {
        const post = await Post.findByPk(postId);
        console.log("INPUT:", postId, userId);

        if (!post) return;

        if (post.userId === userId) return; // chủ post không tính view

        const view = await PostView.create({ postId, userId });
        console.log("✅ CREATED VIEW:", view.id);

    } catch (err) {
        console.error("🔥 CREATE POST VIEW FAILED:", err);
        throw err;
    }
};



// Get thông tin Reaction trang thái vui buồn của bài post
exports.getAllReaction = async () => {
    return await Reaction.findAll({
        order: [['id', 'ASC']]
    });
}






// lấy thông tin bài post và những id user chỉ thấy được bài post và những id không thấy được bài post
exports.getSmartFeeds = async (currentUserId) => {

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

    const specificRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = specificRows.map(p => p.postId);
    const excludedPostIds = specificRows.map(p => p.postId);

    // ================= FRIEND POSTS =================
    const friendPosts = await Post.findAll({
        where: {
            display: 'presently',
            [Op.or]: [
                { userId: currentUserId },
                { privacy: 'public', userId: { [Op.in]: friendIds } },
                { privacy: 'friends', userId: { [Op.in]: friendIds } },
                { privacy: 'specific', id: { [Op.in]: specificPostIds } },
                { privacy: 'exclude', id: { [Op.notIn]: excludedPostIds } }
            ]
        },
        include: [{
            model: User,
            attributes: ['id', 'username', 'avatUrl']
        }],
        order: Sequelize.literal('RANDOM()')
    });

    // ================= STRANGER POSTS =================
    const strangerPosts = await Post.findAll({
        where: {
            display: 'presently',
            privacy: 'public',
            userId: { [Op.notIn]: [currentUserId, ...friendIds] }
        },
        include: [{
            model: User,
            attributes: ['id', 'username', 'avatUrl']
        }],
        order: Sequelize.literal('RANDOM()')
    });

    // ================= MIX 10:1 =================
    const finalFeed = [];
    let strangerIndex = 0;

    friendPosts.forEach((post, index) => {
        finalFeed.push(post);

        if ((index + 1) % 10 === 0 && strangerPosts[strangerIndex]) {
            finalFeed.push(strangerPosts[strangerIndex]);
            strangerIndex++;
        }
    });

    // ================= ADD PRIVACY USER IDS =================
    const postIds = finalFeed.map(p => p.id);

    const privacyRows = await PostPrivacyUser.findAll({
        where: { postId: { [Op.in]: postIds } }
    });

    const privacyMap = {};
    privacyRows.forEach(row => {
        if (!privacyMap[row.postId]) privacyMap[row.postId] = [];
        privacyMap[row.postId].push(row.userId);
    });

    const resultFeed = finalFeed.map(post => {
        const p = post.toJSON();

        if (p.privacy === 'specific') {
            p.specificUserIds = privacyMap[p.id] || [];
            p.excludeUserIds = [];
        } else if (p.privacy === 'exclude') {
            p.excludeUserIds = privacyMap[p.id] || [];
            p.specificUserIds = [];
        } else {
            p.specificUserIds = [];
            p.excludeUserIds = [];
        }

        return p;
    });

    return resultFeed;
};

exports.getSmartFeed13 = async (currentUserId, page = 1, limit = 20, seed) => {
    const offset = (page - 1) * limit;

    // ====== CHỈ LẤY BÀI TRONG 1 THÁNG ======
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // ====== FRIEND IDS ======
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

    // ====== PRIVACY ======
    const specificRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = specificRows.map(p => p.postId);
    const excludedPostIds = specificRows.map(p => p.postId);

    // ====== FRIEND POSTS (LẤY NHIỀU HƠN ĐỂ TRỘN USER) ======
    const friendPostsRaw = await Post.findAll({
        where: {
            display: 'presently',
            createdAt: { [Op.gte]: oneMonthAgo },
            [Op.or]: [
                { userId: currentUserId },
                { privacy: 'public', userId: { [Op.in]: friendIds } },
                { privacy: 'friends', userId: { [Op.in]: friendIds } },
                { privacy: 'specific', id: { [Op.in]: specificPostIds } },
                { privacy: 'exclude', id: { [Op.notIn]: excludedPostIds } }
            ]
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });

    // ====== STRANGER POSTS (ÍT) ======
    const strangerPostsRaw = await Post.findAll({
        where: {
            display: 'presently',
            privacy: 'public',
            createdAt: { [Op.gte]: oneMonthAgo },
            userId: { [Op.notIn]: [currentUserId, ...friendIds] }
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }],
        order: [['createdAt', 'DESC']],
        limit: Math.floor(limit / 5),
        offset: Math.floor(offset / 5)
    });


    const mixedSource = [...friendPostsRaw, ...strangerPostsRaw] .sort((a, b) => { const timeDiff = new Date(b.createdAt) - new Date(a.createdAt); return timeDiff + (Math.random() - 0.5) * 1000 * 60 * 60 * 6; });


    const postsByUser = {};

    mixedSource.forEach(post => {
        if (!postsByUser[post.userId]) {
            postsByUser[post.userId] = [];
        }
        postsByUser[post.userId].push(post);
    });

    // Không trùng user liền kề
    const userQueues = Object.values(postsByUser);
    const finalFeed = [];

    while (finalFeed.length < limit && userQueues.length > 0) {
        let pickedInRound = false;

        for (let i = userQueues.length - 1; i >= 0; i--) {
            const queue = userQueues[i];

            if (queue.length === 0) {
                userQueues.splice(i, 1);
                continue;
            }

            const lastPost = finalFeed[finalFeed.length - 1];

            if (!lastPost || String(lastPost.userId) !== String(queue[0].userId)) {
                finalFeed.push(queue.shift());
                pickedInRound = true;
            }

            if (finalFeed.length === limit) break;
        }

        // 🚨 nếu không pick được bài nào → tránh treo
        if (!pickedInRound) {
            // cho phép lấy đại 1 bài còn lại
            finalFeed.push(userQueues[0].shift());
        }
    }


    // ====== REACTIONS + VIEWS ======
    const postIds = finalFeed.map(p => p.id);

    const views = await PostView.findAll({
        where: { postId: { [Op.in]: postIds } },
        attributes: [
            'postId',
            [Sequelize.fn('COUNT', Sequelize.col('userId')), 'viewCount']
        ],
        group: ['postId']
    });

    const viewMap = {};
    views.forEach(v => {
        viewMap[v.postId] = parseInt(v.get('viewCount'));
    });

    const reactions = await PostReaction.findAll({
        where: { postId: { [Op.in]: postIds } },
        include: [{ model: Reaction, attributes: ['code', 'label', 'icon'] }]
    });

    const userReactions = await PostReaction.findAll({
        where: {
            postId: { [Op.in]: postIds },
            userId: currentUserId
        },
        include: [{ model: Reaction, attributes: ['code', 'label', 'icon', 'color'] }]
    });

    const userReactionMap = {};
    userReactions.forEach(r => {
        userReactionMap[r.postId] = {
            code: r.Reaction.code,
            label: r.Reaction.label,
            icon: r.Reaction.icon,
            color: r.Reaction.color
        };
    });

    const reactionMap = {};
    reactions.forEach(r => {
        if (!reactionMap[r.postId]) {
            reactionMap[r.postId] = { total: 0, detail: {} };
        }
        const code = r.Reaction.code;
        if (!reactionMap[r.postId].detail[code]) {
            reactionMap[r.postId].detail[code] = {
                code,
                label: r.Reaction.label,
                icon: r.Reaction.icon,
                count: 0
            };
        }
        reactionMap[r.postId].detail[code].count++;
        reactionMap[r.postId].total++;
    });

    const resultFeed = finalFeed.map(post => {
        const p = post.toJSON();
        const r = reactionMap[p.id];

        p.reactions = r
            ? { total: r.total, detail: Object.values(r.detail) }
            : { total: 0, detail: [] };

        p.views = viewMap[p.id] || 0;
        p.myReaction = userReactionMap[p.id] || null;
        return p;
    });

    // ====== HAS MORE ======
    const hasMore = friendPostsRaw.length === limit;

    return {
        posts: resultFeed,
        pagination: { page, limit, hasMore }
    };
};



exports.getSmartFeed12 = async (currentUserId, page = 1, limit = 20, seed) => {

    // ====== SEED RANDOM THEO PHIÊN ======
    const seedBase = seed || `${currentUserId}`;
    const rng = seedrandom(`${seedBase}-${currentUserId}`);

    const offset = (page - 1) * limit;

    // ====== CHỈ LẤY BÀI TRONG 1 THÁNG ======
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // ====== FRIEND IDS ======
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

    // ====== PRIVACY ======
    const specificRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = specificRows.map(p => p.postId);
    const excludedPostIds = specificRows.map(p => p.postId);

    // 🔥 LẤY DƯ DỮ LIỆU (KHÔNG OFFSET)
    const FETCH_LIMIT = limit * 5;

    // ====== FRIEND POSTS ======
    const friendPostsRaw = await Post.findAll({
        where: {
            display: 'presently',
            createdAt: { [Op.gte]: oneMonthAgo },
            [Op.or]: [
                { userId: currentUserId },
                { privacy: 'public', userId: { [Op.in]: friendIds } },
                { privacy: 'friends', userId: { [Op.in]: friendIds } },
                { privacy: 'specific', id: { [Op.in]: specificPostIds } },
                { privacy: 'exclude', id: { [Op.notIn]: excludedPostIds } }
            ]
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }],
        order: [['createdAt', 'DESC']],
        limit: FETCH_LIMIT,
        offset: 0
    });

    // ====== STRANGER POSTS ======
    const strangerPostsRaw = await Post.findAll({
        where: {
            display: 'presently',
            privacy: 'public',
            createdAt: { [Op.gte]: oneMonthAgo },
            userId: { [Op.notIn]: [currentUserId, ...friendIds] }
        },
        include: [{ model: User, attributes: ['id', 'username', 'avatUrl'] }],
        order: [['createdAt', 'DESC']],
        limit: Math.floor(FETCH_LIMIT / 5),
        offset: 0
    });

    // ====== TRỘN BÀI CÓ SEED (KHÔNG DÙNG Math.random) ======
    const mixedSource = [...friendPostsRaw, ...strangerPostsRaw].sort((a, b) => {
        const timeDiff = new Date(b.createdAt) - new Date(a.createdAt);
        const randomBias = (rng() - 0.5) * 1000 * 60 * 60 * 6; // ±6 tiếng
        return timeDiff + randomBias;
    });

    // ====== GROUP THEO USER ======
    const postsByUser = {};
    mixedSource.forEach(post => {
        if (!postsByUser[post.userId]) {
            postsByUser[post.userId] = [];
        }
        postsByUser[post.userId].push(post);
    });

    // ====== LUÂN PHIÊN USER ======
    let userQueues = Object.values(postsByUser);

    // 👉 random thứ tự user bằng seed
    userQueues.sort(() => rng() - 0.5);

    const finalFeedAll = [];

    while (userQueues.length > 0) {
        let picked = false;

        for (let i = userQueues.length - 1; i >= 0; i--) {
            const queue = userQueues[i];

            if (!queue.length) {
                userQueues.splice(i, 1);
                continue;
            }

            const lastPost = finalFeedAll[finalFeedAll.length - 1];

            if (!lastPost || String(lastPost.userId) !== String(queue[0].userId)) {
                finalFeedAll.push(queue.shift());
                picked = true;
            }
        }

        if (!picked && userQueues.length) {
            finalFeedAll.push(userQueues[0].shift());
        }
    }

    // ====== CẮT THEO PAGE (QUAN TRỌNG) ======
    const start = offset;
    const end = offset + limit;
    const finalFeed = finalFeedAll.slice(start, end);

    // ====== REACTIONS + VIEWS ======
    const postIds = finalFeed.map(p => p.id);

    const views = await PostView.findAll({
        where: { postId: { [Op.in]: postIds } },
        attributes: [
            'postId',
            [Sequelize.fn('COUNT', Sequelize.col('userId')), 'viewCount']
        ],
        group: ['postId']
    });

    const viewMap = {};
    views.forEach(v => {
        viewMap[v.postId] = parseInt(v.get('viewCount'));
    });

    const reactions = await PostReaction.findAll({
        where: { postId: { [Op.in]: postIds } },
        include: [{ model: Reaction, attributes: ['code', 'label', 'icon'] }]
    });

    const userReactions = await PostReaction.findAll({
        where: {
            postId: { [Op.in]: postIds },
            userId: currentUserId
        },
        include: [{ model: Reaction, attributes: ['code', 'label', 'icon', 'color'] }]
    });

    const userReactionMap = {};
    userReactions.forEach(r => {
        userReactionMap[r.postId] = {
            code: r.Reaction.code,
            label: r.Reaction.label,
            icon: r.Reaction.icon,
            color: r.Reaction.color
        };
    });

    const reactionMap = {};
    reactions.forEach(r => {
        if (!reactionMap[r.postId]) {
            reactionMap[r.postId] = { total: 0, detail: {} };
        }
        const code = r.Reaction.code;
        if (!reactionMap[r.postId].detail[code]) {
            reactionMap[r.postId].detail[code] = {
                code,
                label: r.Reaction.label,
                icon: r.Reaction.icon,
                count: 0
            };
        }
        reactionMap[r.postId].detail[code].count++;
        reactionMap[r.postId].total++;
    });

    const resultFeed = finalFeed.map(post => {
        const p = post.toJSON();
        const r = reactionMap[p.id];

        p.reactions = r
            ? { total: r.total, detail: Object.values(r.detail) }
            : { total: 0, detail: [] };

        p.views = viewMap[p.id] || 0;
        p.myReaction = userReactionMap[p.id] || null;
        return p;
    });

    // ====== HAS MORE ======
    const hasMore = end < finalFeedAll.length;

    return {
        posts: resultFeed,
        pagination: { page, limit, hasMore }
    };
};


// ====================================
// Truy vấn dữ liệu post chỉ định xem post của user đang đăng nhập khi dữ theo trang thái PostPrivacyUser khi có type trong csdl
// khi thêm bài post privacy: { type: DataTypes.ENUM('public', 'friends', 'only_me', 'exclude', 'specific'),
// defaultValue: 'public',
// },
// nó sẽ tự thêm dữ liệu privacy qua type của PostPrivacyUser sẽ lấy type để truy vấn dữ liệu
exports.getSmartFeedget = async (currentUserId) => {

    // FRIEND LIST
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

    // PRIVACY TABLE (CHỈ LIÊN QUAN NGƯỜI XEM)
    const privacyRows = await PostPrivacyUser.findAll({
        where: { userId: currentUserId }
    });

    const specificPostIds = privacyRows
        .filter(p => p.type === 'specific')
        .map(p => p.postId);

    const excludedPostIds = privacyRows
        .filter(p => p.type === 'exclude')
        .map(p => p.postId);

    // POSTS CỦA MÌNH + BẠN BÈ
    const friendPosts = await Post.findAll({
        where: {
            display: 'presently',
            [Op.or]: [
                { userId: currentUserId }, // Bài của mình

                // bạn bè public
                {
                    privacy: 'public',
                    userId: { [Op.in]: friendIds }
                },

                // bạn bè friends
                {
                    privacy: 'friends',
                    userId: { [Op.in]: friendIds }
                },

                // specific → phải nằm trong whitelist
                {
                    privacy: 'specific',
                    id: { [Op.in]: specificPostIds }
                },

                // exclude → không nằm blacklist
                {
                    privacy: 'exclude',
                    id: { [Op.notIn]: excludedPostIds }
                }
            ]
        },
        include: [{
            model: User,
            attributes: ['id', 'username', 'avatUrl']
        }],
        order: Sequelize.literal('RANDOM()')
    });

    // Posts người lạ (Public)
    const strangerPosts = await Post.findAll({
        where: {
            display: 'presently',
            privacy: 'public',
            userId: { [Op.notIn]: [currentUserId, ...friendIds] }
        },
        include: [{
            model: User,
            attributes: ['id', 'username', 'avatUrl']
        }],
        order: Sequelize.literal('RANDOM()')
    });

    // Khi 10 bài post sẽ xuất hiện 1 bài post của người không phải bạn
}