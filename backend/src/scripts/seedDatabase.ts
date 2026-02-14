import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../db/connection';
import Task from '../models/Task';
import User from '../models/User';
import { sampleTasks } from '../seed-data/index'; // Import from seed-data

// Load environment variables
dotenv.config();

// Sample users data (keep this in the file as it's small)
const sampleUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123!', // Will be hashed
    username: 'admin',
    avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=admin',
    bio: 'System administrator',
    securityQuestion: 'What is your favourite programming language?',
    securityAnswer: 'Python',
    isVerified: true,
    isActive: true,
	role: 'admin'
  },
  {
    email: 'john.doe@example.com',
    password: 'Password123!',
    username: 'johndoe',
    avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=johndoe',
    bio: 'Software developer learning Python',
    securityQuestion: 'What is your favourite programming language?',
    securityAnswer: 'Python',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'jane.smith@example.com',
    password: 'Password123!',
    username: 'janesmith',
    avatarUrl: 'https://avatar.iran.liara.run/public/girl?username=janesmith',
    bio: 'Computer science student',
    securityQuestion: 'What is your favourite programming language?',
    securityAnswer: 'Python',
    isVerified: true,
    isActive: true,
  },
  // Add admin user to sampleUsers array
  {
    email: 'admin@codechallenge.com',
    password: 'Admin123!',
    username: 'wisdom209',
    role: 'admin', // Add this
    avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=admin',
    bio: 'System administrator',
    securityQuestion: 'What is your favourite programming language?',
    securityAnswer: 'Python',
    isVerified: true,
    isActive: true,
  },
];

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');

    // Connect to database
    await db.connect();
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('✅ Cleared existing users and tasks');

    // Hash passwords for users
    console.log('🔐 Hashing user passwords...');
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return {
          ...user,
          password: hashedPassword,
          passwordChangedAt: new Date(Date.now() - 1000),
        };
      })
    );

    // Insert users
    console.log('👥 Inserting users...');
    const insertedUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    // Insert tasks from seed-data
    console.log('📝 Inserting tasks...');
    const insertedTasks = await Task.insertMany(sampleTasks);
    console.log(`✅ Inserted ${insertedTasks.length} tasks`);

    // Display summary
    console.log('\n📊 SEEDING SUMMARY:');
    console.log('===================');

    // User summary
    console.log('\n👥 USERS:');
    insertedUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.email})`);
    });

    // Task summary
    console.log('\n📝 TASKS:');
    insertedTasks.forEach((task, index) => {
      const taskObj = task.toObject();
      console.log(`  ${index + 1}. ${taskObj.title}`);
      console.log(`     Difficulty: ${taskObj.difficulty}`);
      console.log(`     Points: ${taskObj.points}`);
      console.log(
        `     Languages: ${taskObj.configs
          .map((c: any) => c.language)
          .join(', ')}`
      );
      console.log(
        `     Test Cases: ${taskObj.configs.reduce(
          (sum: number, config: any) => sum + config.testCases.length,
          0
        )}`
      );
    });

    // Statistics
    console.log('\n📈 STATISTICS:');
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const easyTasks = await Task.countDocuments({ difficulty: 'easy' });
    const mediumTasks = await Task.countDocuments({ difficulty: 'medium' });
    const hardTasks = await Task.countDocuments({ difficulty: 'hard' });
    const pythonTasks = await Task.countDocuments({
      'configs.language': 'python',
    });
    const cTasks = await Task.countDocuments({ 'configs.language': 'c' });

    console.log(`  Total Users: ${userCount}`);
    console.log(`  Total Tasks: ${taskCount}`);
    console.log(
      `    Easy: ${easyTasks}, Medium: ${mediumTasks}, Hard: ${hardTasks}`
    );
    console.log(`    Python: ${pythonTasks}, C: ${cTasks}`);

    // Disconnect
    await db.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run the server: npm run dev');
    console.log('   2. Test API endpoints');
    console.log('   3. Update auth routes to use email/password');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);

    try {
      await db.disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    process.exit(1);
  }
};

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
