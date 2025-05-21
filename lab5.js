const https = require('https');
const http = require('http');
const readline = require('readline');

// Set up command-line interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'cmd> '
});

// Function to fetch and print content from a URL
function fetchUrl(url) {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
        const chunks = [];

        // Collect data chunks
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });

        // When all data is received
        res.on('end', () => {
            const result = Buffer.concat(chunks).toString();
            console.log(result);
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
