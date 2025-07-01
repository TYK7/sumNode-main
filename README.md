# SumNode - Company Details Extraction API

A Node.js API service that extracts company details from websites using Puppeteer and web scraping.

## Features

- Extract company details from any website URL
- LinkedIn company page scraping
- Automatic browser detection (Edge/Chrome)
- Production-ready for Render deployment
- CORS enabled for cross-origin requests

## API Endpoints

### POST /api/extract-company-details

Extracts company details from a given URL.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "companyName": "Example Company",
  "description": "Company description...",
  "website": "https://example.com",
  // ... other extracted details
}
```

### GET /test

Simple health check endpoint.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Deployment to Render

1. Connect your GitHub repository to Render
2. Use the following settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Node Version:** 18+ (specified in package.json)

3. Set environment variables:
   - `NODE_ENV=production`

The `render.yaml` file is included for automatic configuration.

## Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (defaults to 3000)
- `RENDER`: Automatically set by Render platform

## Browser Configuration

The application automatically detects available browsers:

- **Local Development:** Uses installed Edge or Chrome
- **Production (Render):** Uses Puppeteer's bundled Chromium

## Dependencies

- **express**: Web framework
- **puppeteer**: Browser automation
- **cors**: Cross-origin resource sharing
- **dns**: Domain name resolution (Node.js built-in)

## Error Handling

The API includes comprehensive error handling for:
- Invalid URLs
- Unresolvable domains
- Browser launch failures
- Page load timeouts
- Network errors

## License

ISC