const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');
const ChatStatus = require('../models/ChatStatus');
const Notify = require('../models/Notify');
const { Op } = require('sequelize');
 

// ======= GỬI LỜI MỜI KẾT BẠN (đã có) ======= sử dụng index 
exports.sendFriendRequest = async (senderId, receiverPhone, message) => {
    // Kiểm tra người nhận có tồn tại không
    const receiver = await User.findOne({ where: { sdt: receiverPhone } });
    if (!receiver) throw new Error('Không tìm thấy người dùng với số điện thoại này');

    if (receiver.id === senderId) throw new Error('Không thể gửi lời mời kết bạn cho chính mình');

    // Kiểm tra đã gửi hoặc đã là bạn chưa (dựa theo index (senderId, receiverId))
    const existing = await FriendRequest.findOne({
        where: {
            senderId,
            receiverId: receiver.id
        }
    });

    if (existing) {
        if (existing.status === 'pending') throw new Error('Bạn đã gửi lời mời kết bạn trước đó');
        if (existing.status === 'accepted') throw new Error('Hai bạn đã là bạn bè');
    }

    const friendRequest = await FriendRequest.create({
        senderId,
        receiverId: receiver.id,
        message: message || null
    })

    return friendRequest;
}

// ======= GỬI LỜI MỜI KẾT BẠN (đã có) ======= sử dụng chuẩn hoá userA < userB
exports.sendFriendRequest_ketban = async (senderId, receiverPhone, message) => {
    const sender = await User.findByPk(senderId, {
        attributes: ["id", "username", "email", "sdt", "avatUrl"]
    });

    // 1. Kiểm tra người nhận có tồn tại không
    const receiver = await User.findOne({ where: { sdt: receiverPhone } });
    if (!receiver) throw new Error('Không tìm thấy người dùng với số điện thoại này.');

    // 2. Không cho gửi cho chính mình
    if (receiver.id === senderId) throw new Error('Không thể gửi lời mời kết bạn cho chính mình');

    // 3. Kiểm tra xem lời mời giữa 2 người đã tồn tại chưa
    const existing = await FriendRequest.findOne({
        where: {
            [Op.or]: [
                { senderId, receiverId: receiver.id },
                { senderId: receiver.id, receiverId: senderId }
            ]
        }
    });

    // 4. Nếu đã tồn tại, xử lý theo trạng thái
    if (existing) {
        if (existing.status === 'pending') {
            if (existing.senderId === senderId) {
                throw new Error('Bạn đã gửi lời mời kết bạn trước đó.');
            } else {
                throw new Error('Người này đã gửi lời mời kết bạn cho bạn — hãy chấp nhận.');
            }
        }
        if (existing.status === 'accepted') {
            throw new Error('Hai bạn đã là bạn bè.');
        }
        if (existing.status === 'blocked') {
            throw new Error('Bạn không thể gửi lời mời vì một trong hai người đã chặn.');
        }
    }

    // 5. Nếu chưa tồn tại -> tạo mới lời mời
    const friendRequest = await FriendRequest.create({
        senderId,
        receiverId: receiver.id,
        status: 'pending',
        message: message || null,
    });

    const notify = await Notify.create({
        friendRequestId: friendRequest.id,
        senderId,
        receiverId: receiver.id,
        status: "show_1",
        message: "đã gửi cho bạn lời mời kết bạn",
    })

    console.log(`Lời mời kết bạn đã gửi từ ${senderId} đến ${receiver.id}`);
    return { friendRequest, notify, sender };
}

// ======= CHẤP NHẬN LỜI MỜI =======
// Định nghĩa một hàm bất đồng bộ (async function) tên là acceptFriendRequest.
// Dùng exports để xuất hàm ra ngoài, cho phép file khác import và dùng được.
// Hàm nhận 2 tham số:
// receiverId: id của người nhận lời mời kết bạn (người sẽ bấm “Chấp nhận”).
// requestId: id của lời mời kết bạn cần xử lý.
exports.acceptFriendRequest1 = async (receiverId, requestId) => {
    const request = await FriendRequest.findByPk(requestId);
    // Tìm bản ghi lời mời kết bạn trong bảng FriendRequest theo khóa chính (Primary Key = requestId).
    // findByPk = “find by primary key”.
    // ➡ Nếu có, trả về đối tượng request.
    // ➡ Nếu không có, trả về null.
    if (!request) throw new Error('Không tìm thấy lời mời kết bạn');

    request.status = 'accepted';
    // Gán trạng thái status thành 'accepted' (đã chấp nhận).
    // Ghi lại thời điểm được chấp nhận (acceptedAt).
    request.acceptedAt = new Date();
    // await request.save() để lưu thay đổi xuống database.
    await request.save();

    return request;
}

exports.acceptFriendRequest2 = async (receiverId, requestId) => {
    const request = await FriendRequest.findByPk(requestId);
    if (!request) throw new Error('Không tìm thấy lời mời kết bạn');

    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();

    const existingConversation = await Conversation.findOne({
        where: {
            type: 'private',
            [require('sequelize').Op.or]: [
                { userOneId: request.senderId, userTwoId: request.receiverId },
                { userOneId: request.receiverId, userTwoId: request.senderId },
            ]
        }
    });

    if (!existingConversation) {
        await Conversation.create({
            type: 'private',
            userOneId: request.senderId,
            userTwoId: request.receiverId,
        });
    }

    return request;
}


// receiverId: là ID của người đang đăng nhập (người nhận lời mời kết bạn).
// requestId: là ID của lời mời kết bạn mà họ đang chấp nhận.

// Kiểm tra xem hai người đã là bạn chưa
// Trả về một bản ghi đầu tiên thỏa điều kiện (hoặc null nếu không có). Đây là Promise — nên dùng await.
// where: { status: 'accepted', [Op.or]: [...] }
// where gồm 2 điều kiện kết hợp theo AND:
// 1. status = 'accepted'
// 2. (điều kiện1 OR điều kiện2) — nghĩa là phải thỏa cả status và một trong 2 điều kiện về cặp sender/receiver.
// [Op.or] là toán tử OR của Sequelize (phải import Op từ const { Op } = require('sequelize') hoặc Sequelize.Op).
// Mảng trong Op.or chứa 2 object:
// - { senderId: request.senderId, receiverId: request.receiverId } — trường hợp A đã gửi cho B.
// - { senderId: request.receiverId, receiverId: request.senderId } — trường hợp B đã gửi cho A.
// Kết quả : Vậy chỉ cần một trong hai thỏa là coi là đã có quan hệ bạn bè.
// Nếu chuyển sang SQL thuần, câu truy vấn tương đương có thể là:
// SELECT *
// FROM FriendRequests
// WHERE status = 'accepted'
//   AND (
//     (senderId = :senderId AND receiverId = :receiverId)
//     OR
//     (senderId = :receiverId AND receiverId = :senderId)
//   )
// LIMIT 1;
// (:senderId và :receiverId là tham số truyền vào — ở đây là request.senderId và request.receiverId.)
exports.acceptFriendRequest = async (receiverId, requestId) => {
    // Lấy yêu cầu kết bạn
    const request = await FriendRequest.findByPk(requestId);
    if (!request) throw new Error('Không tìm thấy lời mời kết bạn');

    console.log(receiverId, requestId)

    // Kiểm tra người dùng hiện tại có phải là người được nhận lời mời hay không
    if (request.receiverId !== receiverId) {
        throw new Error('Bạn không có lời mời kết bạn này ');
    }

    const existingFriendship = await FriendRequest.findOne({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: request.senderId, receiverId: request.receiverId },
                { senderId: request.receiverId, receiverId: request.senderId },
            ],
        },
    });

    if (existingFriendship) {
        // Nếu đã là bạn rồi, không tạo mới nữa
        return {
            message: 'Hai người đã là bạn rồi',
            alreadyFriends: true,
            friendRequest: existingFriendship,
        };
    }

    // Cập nhật trạng thái lời mời
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save();
    
    await Notify.update(
        {
            message: "đã chấp nhận lời mời kết bạn của bạn",
            status: "show_2",
            acceptedAt: new Date(),
        },
        {
            where: { friendRequestId: request.id }
        }
    );

    console.log("NotifyRequest đã được cập nhật theo friendRequestId:", request.id);


    // Kiểm tra xem đã có cuộc trò chuyện 1 : 1 giữa hai người chưa
    let conversation = await Conversation.findOne({
        where: {
            type: 'private',
            [Op.or]: [
                { userOneId: request.senderId, userTwoId: request.receiverId },
                { userOneId: request.receiverId, userTwoId: request.senderId },
            ],
        },
    });

    // Nếu chưa có, tạo mới Conversation
    if (!conversation) {
        conversation = await Conversation.create({
            type: 'private',
            userOneId: request.senderId,
            userTwoId: request.receiverId,
            createdBy: receiverId,
        });

        console.log(`✅ Conversation mới được tạo ID: ${conversation.id}`);
    }

    // Kiểm tra xem đã có ChatStatus cho cuộc trò chuyện chưa
    const existingChatStatus = await ChatStatus.findOne({
        where: { conversationId: conversation.id },
    });

    // Nếu chưa có, tạo ChatStatus mặc định (normal)
    if (!existingChatStatus) {
        await ChatStatus.create({
            conversationId: conversation.id,
            userOneId: request.senderId,
            userTwoId: request.receiverId,
            status: 'normal',
            blockedBy: null,
            blockedAt: null,
        });

        console.log(`✅ ChatStatus mới được tạo cho conversationId: ${conversation.id}`);
    }

    return request;
}

exports.rejectFriendRequest = async (receiverId, requestId) => {
    const request = await FriendRequest.findByPk(requestId);
    if (!request) throw new Error('Không tìm thấy lời mời kết bạn');

    request.status = 'rejected';
    await request.save();

    return request;
}


exports.deleteFriendRequest = async (userId, requestId) => {
    const request = await FriendRequest.findByPk(requestId);

    if (!request) {
        throw new Error('Không tìm thấy lời mời kết bạn');
    }

    // // Kiểm tra quyền: chỉ sender hoặc receiver mới được xoá
    // if (request.senderId !== userId && request.receiverId !== userId) {
    //     throw new Error('Bạn không có quyền xoá lời mời này');
    // }

    await request.destroy();
    return { message: 'Đã xoá lời mời kết bạn thành công' };

}

//Lấy lời mời kết bạn từ những user khác pending
// exports.getReceiverPending = async (userId) => {

//     const requests = await FriendRequest.findAll({
//         where: {
//             receiverId: userId,
//             status: 'pending'
//         },
//         include: [
//             {
//                 model: User,
//                 as: 'receiver', // SỬA Ở ĐÂY
//                 attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
//             }
//         ],
//         order: [['createdAt', 'DESC']]
//     });

//     return requests.map(req => ({
//         pendingId: req.id,
//         message: req.message,
//         senderId: req.receiver.id,
//         username: req.receiver.username,
//         email: req.receiver.email,
//         sdt: req.receiver.sdt,
//         avatUrl: req.receiver.avatUrl,
//         createdAt: req.createdAt
//     }));
// };

exports.getReceiverPending = async (userId) => {
    const requests = await FriendRequest.findAll({
        where: {
            receiverId: userId,
            status: 'pending'
        },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    return requests.map(req => ({
        pendingId: req.id,
        message: req.message,
        senderId: req.sender.id,
        status: req.status,
        username: req.sender.username,
        email: req.sender.email,
        sdt: req.sender.sdt,
        avatUrl: req.sender.avatUrl,

        createdAt: req.createdAt
    }));
};


//Lấy lời mời kết bạn pending
exports.getPending = async (userId) => {

    const requests = await FriendRequest.findAll({
        where: {
            senderId: userId,
            status: 'pending'
        },
        include: [
            {
                model: User,
                as: 'receiver', // SỬA Ở ĐÂY
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            }
        ],
        order: [['createdAt', 'DESC']]
    });

    return requests.map(req => ({
        pendingId: req.id,
        message: req.message,
        senderId: req.receiver.id,
        username: req.receiver.username,
        email: req.receiver.email,
        sdt: req.receiver.sdt,
        avatUrl: req.receiver.avatUrl,
        createdAt: req.createdAt
    }));
};


// Lấy danh sách bạn bè (accepted)
exports.getAccepted = async (userId) => {
    const requests = await FriendRequest.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            },
            {
                model: User,
                as: 'receiver',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            }
        ]
    });

    // Format data: chỉ trả về thông tin người còn lại
    return requests.map(req => {
        const friend =
            req.senderId === userId
                ? req.receiver   // user là sender → bạn là receiver
                : req.sender;    // user là receiver → bạn là sender

        return {
            friendId: friend.id,
            username: friend.username,
            email: friend.email,
            sdt: friend.sdt,
            avatUrl: friend.avatUrl,
            createdAt: req.createdAt
        };
    });
}

exports.getBlocked = async (userId) => {
    const requests = await FriendRequest.findAll({
        where: {
            status: 'blocked',
            [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: [
            {
                model: User,
                as: 'Sender',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            },
            {
                model: User,
                as: 'Receiver',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            }
        ]
    });

    return requests.map(req => {
        // Người bị block hoặc người block
        const otherUser =
            req.senderId === userId
                ? req.Receiver   // bạn block họ
                : req.Sender;    // họ block bạn

        return {
            blockedId: otherUser.id,
            username: otherUser.username,
            email: otherUser.email,
            sdt: otherUser.sdt,
            avatUrl: otherUser.avatUrl,
            createdAt: req.createdAt,
            blockedBy: req.senderId === userId ? "you" : "them"
        };
    });
};

//
exports.getRejected = async (userId) => {
    const requests = await FriendRequest.findAll({
        where: {
            status: 'rejected',
            [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            },
            {
                model: User,
                as: 'receiver',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl']
            }
        ]
    });

    return requests.map(req => {
        const otherUser =
            req.senderId === userId
                ? req.receiver   // user là sender → người kia bị reject
                : req.sender;    // user là receiver → user bị người kia reject

        return {
            rejectedId: otherUser.id,
            username: otherUser.username,
            email: otherUser.email,
            sdt: otherUser.sdt,
            avatUrl: otherUser.avatUrl,
            createdAt: req.createdAt,
            rejectedBy: req.senderId === userId ? "them" : "you"
            // "you" = bạn từ chối họ
            // "them" = họ từ chối bạn
        };
    });
};
exports.getUsersWithoutFriendRequest = async (currentUserId) => {

    // 1. Tìm tất cả bạn bè hoặc đã gửi/nhận request với user
    const requests = await FriendRequest.findAll({
        where: {
            [Op.or]: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ]
            // Lấy tất cả yêu cầu kết bạn mà user hiện tại (currentUserId) là người gửi hoặc người nhận.
            // Giống như câu SQL: WHERE senderId = currentUserId OR receiverId = currentUserId

        },
        attributes: ['id', 'senderId', 'receiverId', 'createdAt']
        // Bạn chỉ lấy những trường này từ bảng:
        // id — ID của FriendRequest
        // senderId — người gửi
        // receiverId — người nhận
        // status — trạng thái (pending, accepted, rejected)
        // createdAt — thời gian tạo request
    });

    // 2. Lấy danh sách id liên quan request
    const relatedUserIds = new Set(); // relatedUserIds = chứa ID những người đã gửi hoặc nhận lời mời với currentUserId.
    const requestMap = new Map(); // map userId -> createdAt gần nhất (hoặc theo logic bạn muốn)
    // requestMap = map để lưu thời gian gần nhất tương tác (không dùng requestId).

    requests.forEach(r => {
        // Thêm cả sender và receiver vào danh sách đã liên quan
        relatedUserIds.add(r.senderId);
        relatedUserIds.add(r.receiverId);

        // Lưu createdAt cho từng user khác currentUserId -- Tìm ID của người còn lại
        const otherUserId = r.senderId === currentUserId ? r.receiverId : r.senderId;
        // Nếu bạn là sender → otherUserId là receiver
        // Nếu bạn là receiver → otherUserId là sender

        // Đoạn này dùng để lưu thời gian createdAt mới nhất (request gần nhất) giữa currentUserId và user khác.
        // Tại vì:
        // Một user có thể gửi nhiều request trước đó (pending → rejected → gửi lại)
        // Bạn muốn lấy thời điểm tương tác mới nhất để xử lý (ví dụ sort, check, hiển thị...)
        if (!requestMap.has(otherUserId) || r.createdAt > requestMap.get(otherUserId)) {
            // !requestMap.has(otherUserId)
            // Nếu map chưa từng lưu gì cho user này → lưu vào.
            // Ví dụ:
            // currentUserId = 5
            // otherUserId = 10
            // Đây là lần đầu gặp user 10 → map chưa có → lưu.
            // r.createdAt > requestMap.get(otherUserId)
            // Nếu request mới hơn request đã lưu trước đó → cập nhật lại.
            // Lần 1: createdAt = 2024-01-01
            // Lần 2: createdAt = 2024-03-01  ← mới hơn
            // Lưu cái ngày 03/01 thay vì 01/01.
            // Nó đảm bảo bạn luôn giữ ngày mới nhất.
            requestMap.set(otherUserId, r.createdAt);

        }
    });

    relatedUserIds.delete(currentUserId); // Không bao giờ liệt kê chính bạn.

    // 3. Lấy các user chưa liên quan (not in relatedUserIds)
    const users = await User.findAll({
        where: { // Op.notIn trong Sequelize dùng để lọc những giá trị KHÔNG NẰM TRONG MỘT DANH SÁCH.
            id: { [Op.notIn]: [...relatedUserIds, currentUserId] }
        },
        attributes: ['id', 'username', 'email', 'sdt', 'avatUrl', 'createdAt']
    });

    // 4. Map sang format bạn muốn
    const result = users.map(u => ({
        rejectedId: u.id,
        username: u.username,
        email: u.email,
        sdt: u.sdt,
        avatUrl: u.avatUrl,
        createdAt: u.createdAt
    }));

    return result;
};


// exports.getUsersWithoutFriendRequest = async (currentUserId) => {
//     console.log("id "+ currentUserId);
//     // Tìm tất cả bạn bè hoặc đã gửi/nhận request với user
//     const blockedIds = await FriendRequest.findAll({
//         where: {
//             [Op.or]: [
//                 { senderId: currentUserId },
//                 { receiverId: currentUserId }
//             ]
//         },

//         attributes: ['senderId', 'receiverId']
//     });

//     console.log(blockedIds)
//     // Lấy danh sách id liên quan request
//     const relatedUserIds = new Set();

//     blockedIds.forEach(r => {
//         relatedUserIds.add(r.senderId);
//         relatedUserIds.add(r.receiverId);
//     });

//     relatedUserIds.delete(currentUserId);

//     const users = await User.findAll({
//         where: {
//             id: { [Op.notIn]: [...relatedUserIds] }
//         },
//         attributes: ['id', 'username', 'email', 'sdt', 'avatUrl'] // chỉ lấy những field bạn muốn
//     });
//     console.log(blockedIds)

//     return users;
// }


exports.getAccepteBirthday = async (userId) => {
    const requests = await FriendRequest.findAll({
        where: {
            status: 'accepted',
            [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: [
            {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl', 'ngaysinh']
            },
            {
                model: User,
                as: 'receiver',
                attributes: ['id', 'username', 'email', 'sdt', 'avatUrl', 'ngaysinh']
            }
        ]
    });
    // Danh sách bạn bè
    const friends = requests.map(req => req.senderId === userId ? req.receiver : req.sender);

    // Tạo cấu trúc nhóm từ tháng 1 -> 12
    const result = {};
    for (let i = 1; i <= 12; i++) {
        result[i] = {
            month: i,
            count: 0,
            users: []
        };
    }

    // Nhóm theo tháng sinh
    friends.forEach(friend => {
        if (!friend.ngaysinh) return;

        const parts = friend.ngaysinh.split("/");
        if (parts.length !== 3) return;
        
        const month = parseInt(parts[1]);

        if (!month || month < 1 || month > 12) return;

        result[month].count++;
        result[month].users.push({
            id: friend.id,
            username: friend.username,
            email: friend.email,
            sdt: friend.sdt,
            avatUrl: friend.avatUrl,
            ngaysinh: friend.ngaysinh
        });
    });

    return result;
}