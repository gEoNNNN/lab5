# go2web - Command-Line Web Client (No HTTP Libraries!)

A minimalist command-line tool built in Python for performing HTTP requests and web searches using raw sockets—completely bypassing traditional HTTP libraries.

## 🔧 Features

### Core Capabilities

- `-u <URL>` — Send HTTP or HTTPS requests and print the response
- `-s <search-term>` — Perform a web search and list the top 10 results
- `-h` — Display usage and help information

### What's Included

- Custom-built HTTP/HTTPS support using Python sockets
- Clean, readable output (HTML is stripped for clarity)
- Web search powered by Bing with result parsing
- Support for HTTP redirects
- Basic content negotiation (HTML and JSON)
- Local caching of responses for performance
- Interactive interface for selecting search results

## 🚀 Live Demo

![Demo GIF](go2web/gif.gif)

## ⚙️ Technical Overview

- **Low-Level Networking**: Uses raw sockets to craft HTTP/1.1 requests manually
- **Secure Connections**: HTTPS handled via Python's `ssl` module
- **Content Display**:
  - HTML: Parsed into plain text using `html2text`
  - JSON: Nicely formatted using `json.dumps(indent=2)`
- **Caching Layer**: Response data saved in `~/.go2web_cache/` using MD5 hashes of request URLs
- **Search Engine Integration**: Extracts Bing search results with `BeautifulSoup` and CSS selectors (`li.b_algo`)

---