# go2web Command Line Program

## Overview
`go2web` is a command line program that allows users to make HTTP requests to specified URLs and search for terms using popular search engines. This tool is designed to be simple and efficient, providing quick access to web resources directly from the terminal.

## Installation
To install `go2web`, clone the repository and install the necessary dependencies:

```bash
git clone <repository-url>
cd go2web
npm install
```

## Usage
The `go2web` command line program supports the following options:

- `-u <url>`: Make an HTTP GET request to the specified URL.
- `-s <search-term>`: Search for the specified term using a search engine.

### Examples

1. **Making an HTTP Request**
   ```bash
   node src/go2web.js -u https://example.com
   ```

2. **Searching for a Term**
   ```bash
   node src/go2web.js -s "OpenAI"
   ```

## Help
To display help information, run the following command:

```bash
node src/go2web.js --help
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Demo
![Demo GIF](path/to/demo.gif)