#!/usr/bin/env node
// This file contains the main logic for the command line program.

const https = require('https');
const http = require('http');
const { URL } = require('url');

const helpText = `
Usage: go2web [options]

Options:
  -u, --url <url>       Make an HTTP request to the specified URL
  -s, --search <term>   Search for a term using a search engine
  -h, --help            Display this help information
`;

function parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-u' || args[i] === '--url') {
            options.url = args[i + 1];
            i++;
        } else if (args[i] === '-s' || args[i] === '--search') {
            options.search = args[i + 1];
            i++;
        } else if (args[i] === '-h' || args[i] === '--help') {
            options.help = true;
        }
    }
    return options;
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function search(term) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
    return makeRequest(searchUrl);
}

async function main() {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (options.help) {
        console.log(helpText);
        return;
    }

    if (options.url) {
        try {
            const response = await makeRequest(options.url);
            console.log(response);
        } catch (error) {
            console.error(`Error fetching URL: ${error.message}`);
        }
    } else if (options.search) {
        try {
            const response = await search(options.search);
            console.log(response);
        } catch (error) {
            console.error(`Error searching: ${error.message}`);
        }
    } else {
        console.log(helpText);
    }
}

main();