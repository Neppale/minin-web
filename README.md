# Minin.in Web - Terminal UI

A web-based terminal interface for the Minin.in URL minification service, built with xterm.js.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start a local server (required due to CORS restrictions):
```bash
npm start
```

This will start an HTTP server on port 8080. Open your browser and navigate to `http://localhost:8080`.

## Configuration

1. Create a `.env` file in the project root and set the `MININ_URL` variable:
```bash
MININ_URL=https://your-api-url.com
```

2. The build process will automatically generate `config.js` from the `.env` file:
   - Healthcheck endpoint: `MININ_URL/version`
   - POST endpoint: `MININ_URL`

3. Run `npm start` which will automatically build the config and start the server.

## Features

- Terminal-style interface with xterm.js
- Healthcheck API integration with version display
- Clickable hyperlinks:
  - "About Minin.in" opens GitHub in a new tab
  - "Donating any amount" is clickable (placeholder)
  - "Expiration date" opens a datepicker
- Datepicker with 6-month default expiration date
- URL input validation and POST request on ENTER
- Retro terminal aesthetic matching the original design

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - Terminal styling
- `app.js` - Application logic
- `package.json` - Dependencies
