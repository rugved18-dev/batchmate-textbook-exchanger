/**
 * Validates if an email is a valid college email address.
 * 
 * Rules:
 * 1. Must be a non-empty string.
 * 2. Should be properly formatted (contains exactly one '@', valid characters, non-empty local & domain parts).
 * 3. Domain (lowercase and trimmed) must end with '.edu' or '.ac.in'.
 * 4. Domain must not match or end with any blocked personal email domains.
 * 
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if it is a valid college email, false otherwise.
 */
const isValidCollegeEmail = (email) => {
    console.log('[EMAIL VALIDATION] Testing email:', email);

    if (!email || typeof email !== 'string') {
        console.log('[EMAIL VALIDATION] Failed: Email is not a string or is empty');
        return false;
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Standard regex check for email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
        console.log('[EMAIL VALIDATION] Failed: Invalid email format structure');
        return false;
    }

    const parts = emailTrimmed.split('@');
    if (parts.length !== 2) {
        console.log('[EMAIL VALIDATION] Failed: Multiple @ symbols found');
        return false;
    }

    const domain = parts[1];

    // List of blocked personal/non-college email providers
    const blockedDomains = [
        'gmail.com',
        'yahoo.com',
        'yahoo.co.in',
        'outlook.com',
        'hotmail.com',
        'live.com',
        'icloud.com',
        'protonmail.com',
        'rediffmail.com',
        'aol.com'
    ];

    // Check if the domain is exactly blocked, or ends with a blocked domain suffix (e.g. mail.gmail.com)
    const isBlocked = blockedDomains.some(blocked => {
        return domain === blocked || domain.endsWith('.' + blocked);
    });

    if (isBlocked) {
        console.log(`[EMAIL VALIDATION] Failed: Domain "${domain}" matches a blocked personal provider`);
        return false;
    }

    // Accept if domain ends with .edu or .ac.in
    const isValid = domain.endsWith('.edu') || domain.endsWith('.ac.in');
    
    if (isValid) {
        console.log(`[EMAIL VALIDATION] Success: "${emailTrimmed}" is a valid college email.`);
    } else {
        console.log(`[EMAIL VALIDATION] Failed: Domain "${domain}" does not end with .edu or .ac.in.`);
    }

    return isValid;
};

module.exports = {
    isValidCollegeEmail
};
