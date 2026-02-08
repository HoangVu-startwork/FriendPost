require('dotenv').config();
const sequelize = require('../config/database');
const Reaction = require('../models/Reaction');

async function seedReactions() {
    try {
        // Kết nối DB
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        const reactions = [
            { code: 'like', label: 'Thích', icon: '👍', color: 'text-blue-600' },
            { code: 'love', label: 'Yêu thích', icon: '❤️', color: 'text-red-500' },
            { code: 'haha', label: 'Haha', icon: '😂', color: 'text-yellow-500' },
            { code: 'wow', label: 'Wow', icon: '😮', color: 'text-yellow-500' },
            { code: 'sad', label: 'Buồn', icon: '😢', color: 'text-blue-400' },
            { code: 'angry', label: 'Phẫn nộ', icon: '😡', color: 'text-red-600' }
        ];

        // Insert – không bị lỗi nếu trùng code
        await Reaction.bulkCreate(reactions, {
            ignoreDuplicates: true
        });

        console.log('🎉 Seed reactions thành công');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed reactions thất bại:', error);
        process.exit(1);
    }

}

seedReactions();