require('dotenv').config();
const mongoose = require('mongoose');
const { User, Note, Book, BookRequest } = require('../models');

/**
 * Seed Data Script
 * Creates sample data for development and testing
 */

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
};

const clearData = async () => {
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Note.deleteMany({});
    await Book.deleteMany({});
    await BookRequest.deleteMany({});
    console.log('✅ Data cleared');
};

const seedUsers = async () => {
    console.log('👥 Creating sample users...');

    const users = await User.create([
        {
            googleId: 'sample_google_id_1',
            email: 'john.doe@university.edu',
            name: 'John Doe',
            department: 'Computer Science',
            semester: 5,
            campus: 'Main Campus',
            reputationScore: 75,
            uploadCount: 5,
            exchangeCount: 3,
            role: 'user'
        },
        {
            googleId: 'sample_google_id_2',
            email: 'jane.smith@university.edu',
            name: 'Jane Smith',
            department: 'Electronics',
            semester: 3,
            campus: 'Main Campus',
            reputationScore: 120,
            uploadCount: 10,
            exchangeCount: 7,
            role: 'moderator'
        },
        {
            googleId: 'sample_google_id_3',
            email: 'admin@university.edu',
            name: 'Admin User',
            department: 'Information Technology',
            semester: 7,
            campus: 'Main Campus',
            reputationScore: 200,
            role: 'admin'
        }
    ]);

    console.log(`✅ Created ${users.length} users`);
    return users;
};

const seedNotes = async (users) => {
    console.log('📝 Creating sample notes...');

    const notes = await Note.create([
        {
            uploadedBy: users[0]._id,
            title: 'Data Structures Complete Notes',
            description: 'Comprehensive handwritten notes covering arrays, linked lists, trees, and graphs',
            subject: 'Data Structures',
            subjectCode: 'CS201',
            department: 'Computer Science',
            semester: 3,
            fileUrl: 'https://example.cloudinary.com/sample-note-1.pdf',
            filePublicId: 'batchmate/notes/sample-1',
            thumbnailUrl: 'https://example.cloudinary.com/sample-note-1-thumb.jpg',
            pageCount: 45,
            fileSize: 2500000,
            isHandwritten: true,
            confirmedHandwritten: true,
            voteScore: 15,
            upvotes: 18,
            downvotes: 3,
            downloadCount: 42,
            viewCount: 150,
            rewardGiven: true,
            campus: 'Main Campus',
            moderationStatus: 'approved'
        },
        {
            uploadedBy: users[1]._id,
            title: 'Digital Electronics Unit 1-3',
            description: 'Logic gates, Boolean algebra, and combinational circuits',
            subject: 'Digital Electronics',
            subjectCode: 'EC202',
            department: 'Electronics',
            semester: 3,
            fileUrl: 'https://example.cloudinary.com/sample-note-2.pdf',
            filePublicId: 'batchmate/notes/sample-2',
            thumbnailUrl: 'https://example.cloudinary.com/sample-note-2-thumb.jpg',
            pageCount: 32,
            fileSize: 1800000,
            isHandwritten: true,
            confirmedHandwritten: true,
            voteScore: 8,
            upvotes: 10,
            downvotes: 2,
            downloadCount: 25,
            viewCount: 80,
            campus: 'Main Campus',
            moderationStatus: 'approved'
        }
    ]);

    console.log(`✅ Created ${notes.length} notes`);
    return notes;
};

const seedBooks = async (users) => {
    console.log('📚 Creating sample books...');

    const books = await Book.create([
        {
            listedBy: users[0]._id,
            title: 'Introduction to Algorithms (CLRS)',
            author: 'Cormen, Leiserson, Rivest, Stein',
            isbn: '978-0262033848',
            edition: '3rd Edition',
            publisher: 'MIT Press',
            subjectCode: 'CS301',
            subject: 'Algorithms',
            department: 'Computer Science',
            semester: 4,
            mrp: 800,
            suggestedPrice: 400,
            finalPrice: 450,
            isNegotiable: true,
            condition: 'Good',
            conditionNotes: 'Minor highlighting in first few chapters, otherwise excellent',
            images: [
                { url: 'https://example.cloudinary.com/book-1.jpg', publicId: 'batchmate/books/book-1' }
            ],
            preferredMeetupLocations: ['Library', 'Canteen', 'Main Gate'],
            status: 'available',
            viewCount: 35,
            campus: 'Main Campus',
            moderationStatus: 'approved'
        },
        {
            listedBy: users[1]._id,
            title: 'Digital Design by Morris Mano',
            author: 'M. Morris Mano',
            edition: '5th Edition',
            subjectCode: 'EC202',
            subject: 'Digital Electronics',
            department: 'Electronics',
            semester: 3,
            mrp: 650,
            suggestedPrice: 325,
            finalPrice: 300,
            isNegotiable: false,
            condition: 'Like New',
            conditionNotes: 'Barely used, no marks',
            images: [],
            preferredMeetupLocations: ['EC Block', 'Library'],
            status: 'available',
            viewCount: 22,
            campus: 'Main Campus',
            moderationStatus: 'approved'
        }
    ]);

    console.log(`✅ Created ${books.length} books`);
    return books;
};

const seedBookRequests = async (users) => {
    console.log('🔍 Creating sample book requests...');

    const requests = await BookRequest.create([
        {
            requestedBy: users[0]._id,
            title: 'Operating System Concepts',
            author: 'Silberschatz',
            subjectCode: 'CS401',
            subject: 'Operating Systems',
            department: 'Computer Science',
            semester: 5,
            maxBudget: 400,
            notes: 'Need before mid-semester exams',
            status: 'active',
            campus: 'Main Campus'
        },
        {
            requestedBy: users[1]._id,
            title: 'Signals and Systems',
            author: 'Oppenheim',
            subjectCode: 'EC301',
            subject: 'Signal Processing',
            department: 'Electronics',
            semester: 4,
            maxBudget: 350,
            status: 'active',
            campus: 'Main Campus'
        }
    ]);

    console.log(`✅ Created ${requests.length} book requests`);
    return requests;
};

const runSeed = async () => {
    try {
        await connectDB();
        await clearData();

        const users = await seedUsers();
        await seedNotes(users);
        await seedBooks(users);
        await seedBookRequests(users);

        console.log('\n🎉 Seed completed successfully!');
        console.log('\n📋 Sample Login Credentials:');
        console.log('   Email: john.doe@university.edu (User)');
        console.log('   Email: jane.smith@university.edu (Moderator)');
        console.log('   Email: admin@university.edu (Admin)');
        console.log('\n⚠️  Note: Use Google OAuth with these emails in production\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

runSeed();
