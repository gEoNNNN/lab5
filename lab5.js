const https = require('https');
const http = require('http');
const readline = require('readline');

// Set up command-line interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'cmd> '
});

// Function to strip HTML tags from text
function stripHtml(html) {
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')   // Remove styles
        .replace(/<[^>]+>/g, '')                             // Remove all HTML tags
        .replace(/\s{2,}/g, ' ')                             // Collapse extra spaces
        .trim();
}

// Function to fetch and print plain text from a URL
function fetchUrl(url) {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
        const chunks = [];

        res.on('data', (chunk) => {
            chunks.push(chunk);
        });

        res.on('end', () => {
            const html = Buffer.concat(chunks).toString();
            const plainText = stripHtml(html);
            console.log('\n=== Human-readable Content ===\n');
            console.log(plainText);
            console.log('\n=== End of Content ===\n');
        });

    }).on('error', (err) => {
        console.error('Error:', err.message);
    });
}

// Initial message
console.log('Enter commands (e.g., go2web -u <URL>). Type "exit" to quit.');
rl.prompt();

// Handle user input
rl.on('line', (line) => {
    const args = line.trim().split(' ');

    if (args[0] === 'exit') {
        rl.close();
    } else if (args[0] === 'go2web' && args[1] === '-u' && args[2]) {
        fetchUrl(args[2]);
    } else {
        console.log('Unknown command. Try: go2web -u <URL>');
    }

    rl.prompt();
}).on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
});
