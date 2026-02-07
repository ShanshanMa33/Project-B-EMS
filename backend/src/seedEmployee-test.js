require('dotenv').config();
const connectDB = require('./config/dbConnection');
const OnboardingApplication = require('./models/onboardingApplication');
const User = require('./models/users');
const employeeProfile = require('./models/employeeProfile');

async function seedEmployee() {
    await connectDB(process.env.MONGO_URI);
    const employeeUser = await User.findOne({ username: 'employee1' });

    if (!employeeUser) {
        console.error('Employee user not found. Please run seedUser-test.js first to create the user.');
        process.exit(1);
    }

    await employeeProfile.findOneAndUpdate(
        { user: employeeUser._id },
        {
            user: employeeUser._id,
            firstName: 'Shanshan',
            lastName: 'Ma',
            email: 'shanshanma@test.com',
            phone: '123-456-7890',
            address: '123 Main St, City, Country',
            emergencyContact: {
                name: 'Dennis',
                relationship: 'Friend',
                phone: '987-654-3210',
            },
        },
        { upsert: true, new: true }
    )


    await OnboardingApplication.deleteMany({ User: employeeUser._id }); // Clear existing applications

    await OnboardingApplication.create({
        User: employeeUser._id,
        positionTitle: 'Software Engineer',
        department: 'Engineering',
        startDate: new Date(),
        notes: 'Welcome to join the team!',
        status: 'not_started',
        statusHistory: [{ status: 'not_started', changedAt: new Date() }],
    });

    console.log('Employee profile and onboarding application seeded successfully!');
    process.exit();
}

seedEmployee().catch(err => {
    console.error('Error seeding employee profile and onboarding application:', err);
    process.exit(1);
});