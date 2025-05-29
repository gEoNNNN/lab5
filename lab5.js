const https = require('https');
const http = require('http');
const readline = require('readline');
const cheerio = require('cheerio');
const { exec } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'cmd> '
});

const HELP_TEXT = `
Commands:
  go2web -u <URL>         # make an HTTP request to the specified URL and print the response
  go2web -s <search-term> # search Bing and print top 10 results
  go2web -h               # show this help
`;

function fetchUrl(url, callback, redirectCount = 0) {
    const MAX_REDIRECTS = 5;
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
        // Handle redirects (3xx status codes)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
                callback(new Error('Too many redirects'));
                return;
            }
            // Some redirects may provide a relative URL
            const newUrl = res.headers.location.startsWith('http')
                ? res.headers.location
                : new URL(res.headers.location, url).toString();
            fetchUrl(newUrl, callback, redirectCount + 1);
            return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => callback(null, data));
    }).on('error', (err) => {
        callback(err);
    });
}

// Simple function to clean text from HTML tags (basic)
function stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '').trim();
}

let lastResults = []; // Store last search results

// Function to search Bing and print top 10 unique https links excluding bing.com
function searchBing(term) {
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(term)}`;

    fetchUrl(searchUrl, (err, data) => {
        if (err) {
            console.error('Error fetching search results:', err.message);
            lastResults = [];
            return;
        }

        const $ = cheerio.load(data);
        const uniqueLinks = new Set();
        const results = [];

        $('li.b_algo').each((i, el) => {
            if (results.length >= 10) return false; // limit to top 10 unique links

            const anchor = $(el).find('h2 a');
            const title = anchor.text().trim();
            const link = anchor.attr('href');

            if (
                title &&
                link &&
                link.startsWith('https:') &&
                !link.includes('bing.com') &&
                !uniqueLinks.has(link)
            ) {
                uniqueLinks.add(link);
                results.push({ title, link });
            }
        });

        if (results.length === 0) {
            console.log('No results found.');
            lastResults = [];
            return;
        }

        lastResults = results; // Save results for later access

        results.forEach((res, i) => {
            console.log(`${i + 1}. ${res.title}\n   ${res.link}`);
        });

        console.log('\nEnter a number (1-10) to open a link, or another command:');
    });
}

function openInBrowser(url) {
    // Windows: use 'start "" "<url>"'
    exec(`start "" "${url}"`);
}

console.log(HELP_TEXT);
rl.prompt();

rl.on('line', (line) => {
    const args = line.trim().split(' ');
    // Check if user entered a number to open a link
    if (
        lastResults.length > 0 &&
        args.length === 1 &&
        /^[1-9]$|^10$/.test(args[0])
    ) {
        const idx = parseInt(args[0], 10) - 1;
        if (lastResults[idx]) {
            console.log(`Opening in browser: ${lastResults[idx].link}`);
            openInBrowser(lastResults[idx].link);
        } else {
            console.log('Invalid selection.');
        }
        rl.prompt();
        return;
    }

    if (args[0] === 'exit') {
        rl.close();
    } else if (args[0] === 'go2web' && args[1] === '-u' && args[2]) {
        fetchUrl(args[2], (err, data) => {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log(stripHtml(data));
            }
            rl.prompt();
        });
        return; // avoid double prompt
    } else if (args[0] === 'go2web' && args[1] === '-s' && args.length > 2) {
        const searchTerm = args.slice(2).join(' ');
        searchBing(searchTerm);
        rl.prompt();
        return;
    } else if (args[0] === 'go2web' && args[1] === '-h'){
        console.log(HELP_TEXT);
    } else {
        console.log('Invalid command. Type "go2web -h" for help.');
    }
    rl.prompt();
}).on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
});
