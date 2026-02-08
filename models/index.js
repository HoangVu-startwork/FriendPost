// models/index.js (giữ như hiện tại)
const sequelize = require('../config/database');

const User = require('./User');
const FriendRequest = require('./FriendRequest');
const Conversation = require('./Conversation');
const Participant = require('./Participant');
const Message = require('./Message');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const ChatStatus = require('./ChatStatus');
const Post = require('./Post');
const PostPrivacyUser = require('./PostPrivacyUser')
const Comment = require('./Comment');
const UserLogin = require('./UserLogin');
const NotifyRequest = require('./Notify');
const UserEducation = require('./UserEducation')
const UserJob = require('./UserJob')
const UserRelationship = require('./UserRelationship');
const UserInformation = require('./UserInformation');
const Notificationrelationship = require('./Notification');
const PostReaction = require('./PostReaction');
const Reaction = require('./Reaction');
const UserProfileView = require('./UserProfileView');
const PostView = require('./PostView');

User.hasOne(UserInformation, {
  foreignKey: 'userId',
  as: 'information'
});

// trong file associations
User.hasMany(UserProfileView, { foreignKey: 'viewerId', as: 'viewsGiven' });
User.hasMany(UserProfileView, { foreignKey: 'targetId', as: 'viewsReceived' });

UserProfileView.belongsTo(User, { foreignKey: 'viewerId', as: 'viewer' });
UserProfileView.belongsTo(User, { foreignKey: 'targetId', as: 'target' });

// UserEducation ↔ User
UserEducation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserEducation, { foreignKey: 'userId', as: 'educations' });
// UserJob ↔ User
User.hasMany(UserJob, { foreignKey: 'userId', as: 'jobs' });
UserJob.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// UserRelationship ↔ User
User.hasOne(UserRelationship, { foreignKey: 'userId', as: 'relationship' });
UserRelationship.belongsTo(User, { foreignKey: 'partnerId', as: 'partner' });
// UserInformation ↔ User
User.hasMany(UserInformation, { foreignKey: 'userId', as: 'inforation' });
UserInformation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// === Associations ===
// FriendRequest ↔ User
FriendRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
FriendRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentRequests' });
User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedRequests' });
FriendRequest.hasOne(NotifyRequest, {
  foreignKey: 'friendRequestId'
});

NotifyRequest.belongsTo(FriendRequest, {
  foreignKey: 'friendRequestId'
});

Post.hasMany(PostView, { foreignKey: 'postId', as: 'views', onDelete: 'CASCADE' });
PostView.belongsTo(Post, { foreignKey: 'postId' });

User.hasMany(PostView, { foreignKey: 'userId' });
PostView.belongsTo(User, { foreignKey: 'userId' });

// NotifyRequest ↔ User
User.hasMany(NotifyRequest, { foreignKey: 'senderId', as: 'sentNotifyRequests' });
User.hasMany(NotifyRequest, { foreignKey: 'receiverId', as: 'receivedNotifyRequests' });

NotifyRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
NotifyRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });


Reaction.hasMany(PostReaction, { foreignKey: 'reactionId' });
PostReaction.belongsTo(Reaction, { foreignKey: 'reactionId' });

Post.hasMany(PostReaction, { foreignKey: 'postId' });
PostReaction.belongsTo(Post, { foreignKey: 'postId' });


// Conversation ↔ Participant ↔ User
Conversation.hasMany(Participant, { foreignKey: 'conversationId', as: 'participants' });
Participant.belongsTo(Conversation, { foreignKey: 'conversationId' });
Participant.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Participant, { foreignKey: 'userId', as: 'participations' });

// Conversation ↔ Message
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

// User ↔ Message
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Message.replyTo (self-association)
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });
Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });

// Conversation.createdBy -> User (optional)
Conversation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Conversation, { foreignKey: 'createdBy', as: 'createdConversations' });

// Associations
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId' });

Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' });


// === ChatStatus ↔ Conversation (1:1) ===
Conversation.hasOne(ChatStatus, { foreignKey: 'conversationId', as: 'chatStatus' });
ChatStatus.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// === ChatStatus ↔ User ===
ChatStatus.belongsTo(User, { as: 'userOne', foreignKey: 'userOneId' });
ChatStatus.belongsTo(User, { as: 'userTwo', foreignKey: 'userTwoId' });
ChatStatus.belongsTo(User, { as: 'blocker', foreignKey: 'blockedBy' });

// Cho phép truy ngược từ User
User.hasMany(ChatStatus, { foreignKey: 'userOneId', as: 'chatStatusAsUserOne' });
User.hasMany(ChatStatus, { foreignKey: 'userTwoId', as: 'chatStatusAsUserTwo' });
User.hasMany(ChatStatus, { foreignKey: 'blockedBy', as: 'blockedChats' });


// Post
User.hasMany(Post, { foreignKey: 'userId', as: 'Posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Commentss
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'User' });

Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// 🔁 Quan hệ tự tham chiếu (bình luận cha ↔ bình luận con)
Comment.hasMany(Comment, {
  as: 'replies', // alias để gọi tới danh sách bình luận con
  foreignKey: 'parentId'
});
Comment.belongsTo(Comment, {
  as: 'parent',
  foreignKey: 'parentId'
});

// Quan hệ 1-N: Một user có nhiều lần đăng nhập
User.hasMany(UserLogin, { foreignKey: 'userId', as: 'logins' });
UserLogin.belongsTo(User, { foreignKey: 'userId', as: 'user' });


module.exports = {
  sequelize,
  User,
  FriendRequest,
  Conversation,
  Participant,
  Message,
  Role, 
  UserRole, 
  Permission, 
  RolePermission, 
  ChatStatus,
  Post,
  PostView,
  PostPrivacyUser,
  UserLogin, 
  NotifyRequest, 
  UserEducation,
  UserJob,
  UserRelationship,
  UserInformation,
  Notificationrelationship
};
