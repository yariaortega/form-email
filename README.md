# Form Email API

A small Node.js/Express API that receives values from a webpage form and sends them to an email address using SMTP.

## 1. Requirements

- Node.js 18 or newer
- An SMTP account (Gmail/Google Workspace, Outlook/Microsoft 365, your hosting provider, or another SMTP service)
- A server/host that can run Node.js

## 2. Install locally

Open a terminal in this folder:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in the values.

### SMTP configuration

Example:

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5500,https://www.yourwebsite.com

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

TO_EMAIL=you@example.com
FROM_NAME=Website Form
```

Do NOT put SMTP credentials in your webpage JavaScript. They belong only in `.env` on the server.

For Gmail/Google Workspace, use an SMTP/app-password setup supported by your Google account rather than putting your normal account password into the project.

## 3. Start the API

```bash
npm start
```

Test:

```text
http://localhost:3000/health
```

You should receive JSON saying that the API is running.

## 4. Connect your webpage

Copy the logic from `public-example.js`, or include it in your site's JavaScript.

Change:

```js
const API_URL = "https://YOUR-API-DOMAIN.com/api/send-form";
```

to your deployed API URL.

Your form should contain fields named:

```html
<input name="name">
<input name="email">
<input name="subject">
<textarea name="message"></textarea>
```

Optional honeypot:

```html
<input name="website" tabindex="-1" autocomplete="off">
```

The browser sends JSON to:

```text
POST /api/send-form
```

Example payload:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Hello",
  "message": "I would like more information.",
  "website": ""
}
```

## 5. Deploying to a Node.js host

The easiest deployment is any hosting provider that supports Node.js applications.

General process:

1. Upload this project or connect its Git repository.
2. Set the build/install command to:
   `npm install`
3. Set the start command to:
   `npm start`
4. Add the environment variables from `.env` in the host's Environment Variables/Secrets section.
5. Do NOT upload `.env` to a public repository.
6. Deploy.
7. Open `https://YOUR-API-DOMAIN.com/health` to test it.
8. Set `ALLOWED_ORIGINS` to your real website origin, for example:
   `https://www.yourwebsite.com`
9. Put the deployed `/api/send-form` URL into your website JavaScript.

Most managed Node hosts automatically provide HTTPS.

## 6. Deploying with Docker

Build:

```bash
docker build -t form-email-api .
```

Run:

```bash
docker run --env-file .env -p 3000:3000 form-email-api
```

Put a reverse proxy such as Nginx/Caddy or your hosting provider in front of the container and use HTTPS.

## 7. Important security notes

- Never expose `SMTP_USER` or `SMTP_PASS` in browser JavaScript.
- Restrict `ALLOWED_ORIGINS` to your real website domains.
- Keep the API behind HTTPS in production.
- The API includes basic rate limiting and a honeypot field, but high-traffic sites should add stronger anti-abuse controls such as CAPTCHA/Turnstile and/or authentication.
- Keep your SMTP credentials private and rotate them if accidentally exposed.
- If your form accepts sensitive information, add appropriate privacy/security controls for your project and jurisdiction.

## 8. Changing the destination email

Change only:

```env
TO_EMAIL=someone@example.com
```

The email recipient is controlled on the server, so visitors cannot change where submissions are delivered.

## 9. Supporting extra form fields

You can extend `src/server.js` by reading more fields from `req.body`, for example:

```js
const phone = clean(body.phone, 50);
const company = clean(body.company, 150);
```

Then add them to the email's `text` and `html` sections.

## 10. API response

Success:

```json
{
  "success": true,
  "message": "Your form was sent successfully."
}
```

Validation/server error:

```json
{
  "success": false,
  "error": "..."
}
```
