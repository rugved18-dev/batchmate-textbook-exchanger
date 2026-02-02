// Test email validation
const testEmail = 'name.prnno@viit.ac.in';

// Test 1: User.js regex
const userRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/;
console.log('User.js regex test:', userRegex.test(testEmail));
console.log('Expected: true');

// Test 2: Controller logic
const isValidCollegeEmail = (email) => {
    if (!email || typeof email !== 'string') return false;

    const emailLower = email.toLowerCase().trim();
    const atIndex = emailLower.lastIndexOf('@');

    if (atIndex === -1 || atIndex === emailLower.length - 1) return false;

    const domain = emailLower.substring(atIndex + 1);
    console.log('Extracted domain:', domain);
    console.log('Domain length:', domain.length);
    console.log('Domain charCodes:', [...domain].map(c => c.charCodeAt(0)));
    console.log('Ends with .ac.in?', domain.endsWith('.ac.in'));
    console.log('Ends with ac.in?', domain.endsWith('ac.in'));

    const blockedDomains = [
        'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
        'live.com', 'icloud.com', 'protonmail.com', 'aol.com', 'rediffmail.com'
    ];
    if (blockedDomains.includes(domain)) {
        console.log('Domain is blocked');
        return false;
    }

    const result = domain.endsWith('.edu') || domain.endsWith('.ac.in');
    console.log('Domain ends with .edu or .ac.in:', result);
    return result;
};

console.log('\nController validation test:', isValidCollegeEmail(testEmail));
console.log('Expected: true');

// Test other emails
console.log('\n--- Testing other emails ---');
const testEmails = [
    'user@gmail.com',
    'student@stanford.edu',
    'test@iitb.ac.in',
    'user@cs.mit.edu',
    'name@ac.in'
];

testEmails.forEach(email => {
    console.log(`${email}: regex=${userRegex.test(email)}, controller=${isValidCollegeEmail(email)}`);
});
