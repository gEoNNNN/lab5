#!/usr/bin/env node
const net = require('net');
const tls = require('tls');
const readline = require('readline');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const CACHE_FILE = path.join(
    process.pkg ? path.dirname(process.execPath) : __dirname,
    'cache.json'
);

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

// --- REPLACED fetchUrl with raw TCP version ---
function fetchUrl(rawUrl, callback, redirectCount = 0) {
    const MAX_REDIRECTS = 5;
    try {
        const url = new URL(rawUrl);
        const isHttps = url.protocol === 'https:';
        const port = url.port || (isHttps ? 443 : 80);
        const host = url.hostname;
        const path = url.pathname + (url.search || '');

        const request = [
            `GET ${path} HTTP/1.1`,
            `Host: ${host}`,
            'Accept: application/json, text/html;q=0.9',
            'Connection: close',
            '',
            ''
        ].join('\r\n');

        const onData = (data) => {
            const response = data.toString();
            const [header, ...bodyParts] = response.split('\r\n\r\n');
            const body = bodyParts.join('\r\n\r\n');
            const statusLine = header.split('\r\n')[0];
            const statusCode = parseInt(statusLine.split(' ')[1], 10);

            // Handle redirects
            const locationMatch = header.match(/Location: (.+)/i);
            if (statusCode >= 300 && statusCode < 400 && locationMatch && redirectCount < MAX_REDIRECTS) {
                const location = locationMatch[1].trim();
                const newUrl = location.startsWith('http') ? location : `${url.protocol}//${url.host}${location}`;
                fetchUrl(newUrl, callback, redirectCount + 1);
                return;
            }

            // Get content-type
            const contentTypeMatch = header.match(/Content-Type: ([^\r\n;]+)/i);
            const contentType = contentTypeMatch ? contentTypeMatch[1] : '';

            callback(null, body, contentType);
        };

        const onError = (err) => callback(err);

        let chunks = [];
        if (isHttps) {
            const socket = tls.connect(port, host, { servername: host }, () => {
                socket.write(request);
            });
            socket.on('data', chunk => chunks.push(chunk));
            socket.on('end', () => onData(Buffer.concat(chunks)));
            socket.on('error', onError);
        } else {
            const socket = net.connect(port, host, () => {
                socket.write(request);
            });
            socket.on('data', chunk => chunks.push(chunk));
            socket.on('end', () => onData(Buffer.concat(chunks)));
            socket.on('error', onError);
        }
    } catch (err) {
        callback(err);
    }
}
// --- END fetchUrl replacement ---

// Simple function to clean text from HTML tags and CSS
function stripHtml(html) {
    // Remove <style>...</style> blocks
    html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    // Remove inline style attributes
    html = html.replace(/\s*style="[^"]*"/gi, '');
    // Remove all HTML tags
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

// Helper to load cache
function loadCache() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

// Helper to save cache
function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
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
        const url = args[2];
        const cache = loadCache();
        if (cache[url]) {
            console.log(cache[url]);
            rl.prompt();
            return;
        }
        fetchUrl(url, (err, data, contentType) => {
            if (err) {
                console.error('Error:', err.message);
            } else {
                let output;
                if (contentType && contentType.includes('application/json')) {
                    try {
                        output = JSON.stringify(JSON.parse(data), null, 2);
                    } catch {
                        output = data;
                    }
                } else {
                    output = stripHtml(data);
                }
                console.log(output);
                cache[url] = output;
                saveCache(cache);
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