require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/dbConnection');
const User = require('./models/users');

async function seedUser() {
    await connectDB(process.env.MONGO_URI);

    // Check if the connection is successful
    console.log("Connected to database:", mongoose.connection.name);

    await User.deleteMany({ username: { $in: ['employee1', 'hr1'] } }); // Clear existing users

    // Create new users with hashed passwords
    await User.create([
        {
            username: 'employee1',
            email: 'shanshanma@test.com',
            password: '123456!',
            role: 'employee',
            firstName: 'Shanshan',
            lastName: 'Ma',
        },
        {
            username: 'hr1',
            email: 'nuochen@test.com',
            password: '123456!',
            role: 'hr',
            firstName: 'Nuo',
            lastName: 'Chen',
        },
    ]);

    console.log('Users seeded successfully!');
    process.exit();
}

seedUser().catch(err => {
    console.error('Error seeding users:', err);
    process.exit(1);
});

