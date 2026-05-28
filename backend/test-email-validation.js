// Test the new reusable email validation utility
const { isValidCollegeEmail } = require('./utils/emailValidator');

console.log('=== College Email Validator Tests ===\n');

const testCases = [
    // Valid academic domains (.ac.in and .edu)
    { email: 'rugved.22311342@viit.ac.in', expected: true, desc: 'Valid VIIT college email' },
    { email: 'student@mit.edu', expected: true, desc: 'Valid MIT college email' },
    { email: 'abc@college.ac.in', expected: true, desc: 'Valid general ac.in email' },
    { email: 'student@cs.stanford.edu', expected: true, desc: 'Valid subdomain .edu email' },
    { email: 'first.last@dept.college.ac.in', expected: true, desc: 'Valid nested subdomain email' },
    { email: '  student@mit.edu  ', expected: true, desc: 'Email with leading/trailing whitespaces' },
    { email: 'STUDENT@MIT.EDU', expected: true, desc: 'Uppercase academic email' },

    // Invalid formats
    { email: 'invalid-email', expected: false, desc: 'No domain or @' },
    { email: 'student@', expected: false, desc: 'Missing domain' },
    { email: '@mit.edu', expected: false, desc: 'Missing local part' },
    { email: 'student@mit@edu', expected: false, desc: 'Multiple @ signs' },

    // Blocked personal providers
    { email: 'user@gmail.com', expected: false, desc: 'Blocked Gmail' },
    { email: 'user@yahoo.com', expected: false, desc: 'Blocked Yahoo' },
    { email: 'user@yahoo.co.in', expected: false, desc: 'Blocked Yahoo regional' },
    { email: 'user@outlook.com', expected: false, desc: 'Blocked Outlook' },
    { email: 'user@hotmail.com', expected: false, desc: 'Blocked Hotmail' },
    { email: 'user@live.com', expected: false, desc: 'Blocked Live' },
    { email: 'user@icloud.com', expected: false, desc: 'Blocked iCloud' },
    { email: 'user@protonmail.com', expected: false, desc: 'Blocked ProtonMail' },
    { email: 'user@aol.com', expected: false, desc: 'Blocked AOL' },
    { email: 'user@rediffmail.com', expected: false, desc: 'Blocked Rediffmail' },
    { email: 'user@mail.gmail.com', expected: false, desc: 'Blocked Gmail subdomain' },

    // Other non-academic domains
    { email: 'user@github.com', expected: false, desc: 'Non-academic commercial domain' },
    { email: 'student@mit.edu.com', expected: false, desc: 'Ends with .com instead of .edu' },
    { email: 'student@college.ac.in.org', expected: false, desc: 'Ends with .org instead of .in' }
];

let passed = 0;
let failed = 0;

testCases.forEach((tc, index) => {
    console.log(`Test #${index + 1}: ${tc.desc}`);
    console.log(`Input: "${tc.email}"`);
    
    const result = isValidCollegeEmail(tc.email);
    const success = result === tc.expected;

    if (success) {
        console.log('Result: PASS\n');
        passed++;
    } else {
        console.error(`Result: FAIL (Got ${result}, Expected ${tc.expected})\n`);
        failed++;
    }
});

console.log('=== Test Summary ===');
console.log(`Total Tests Run: ${testCases.length}`);
console.log(`Passed: ${passed}`);
if (failed > 0) {
    console.error(`Failed: ${failed}`);
    process.exit(1);
} else {
    console.log('All tests passed successfully!');
    process.exit(0);
}
