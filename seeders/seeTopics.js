require('dotenv').config();
const sequelize = require('../config/database');
const Topic = require('../models/Topic');

async function seedTopics() {
    try {
        // Kết nối DB
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        const topics = [
            {
                label: 'Công nghệ',
                title: 'Không gian cho dân IT',
                img: null,
                color: '#1E3A8A',
                color_1: '#3B82F6',
                color_2: '#60A5FA'
            },
            {
                label: 'Giải trí',
                title: 'Phim ảnh, âm nhạc, drama',
                img: null,
                color: '#7C3AED',
                color_1: '#A78BFA',
                color_2: '#C4B5FD'
            },
            {
                label: 'Học tập',
                title: 'Trao đổi kiến thức',
                img: null,
                color: '#059669',
                color_1: '#34D399',
                color_2: '#6EE7B7'
            },
            {
                label: 'Game',
                title: 'Anh em chiến game',
                img: null,
                color: '#DC2626',
                color_1: '#F87171',
                color_2: '#FCA5A5'
            }
        ];

        // Insert – tránh lỗi nếu trùng label
        await Topic.bulkCreate(topics, {
            ignoreDuplicates: true
        });

        console.log('🎉 Seed topics thành công');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed topics thất bại:', error);
        process.exit(1);
    }
}

seedTopics();
