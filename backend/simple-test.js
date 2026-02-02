const email = 'name.prnno@viit.ac.in';
const domain = 'viit.ac.in';

console.log('Testing domain:', domain);
console.log('domain.endsWith(".ac.in"):', domain.endsWith('.ac.in'));
console.log('domain.endsWith(".edu"):', domain.endsWith('.edu'));

// Test the actual logic
const result = domain.endsWith('.edu') || domain.endsWith('.ac.in');
console.log('Result:', result);

// Character by character
console.log('\nDomain characters:');
for (let i = 0; i < domain.length; i++) {
    console.log(`[${i}] '${domain[i]}' (${domain.charCodeAt(i)})`);
}

console.log('\nLast 6 characters:', domain.slice(-6));
console.log('Should be: .ac.in');
console.log('Match:', domain.slice(-6) === '.ac.in');
