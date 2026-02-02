/**
 * Postmark Email Service Integration
 * Handles all email sending via Postmark API
 */

const postmark = require('postmark');

// Cache for Postmark clients by token
const clientCache = new Map();

/**
 * Get or create a Postmark client for the given token
 */
function getClient(token) {
    if (!clientCache.has(token)) {
        clientCache.set(token, new postmark.ServerClient(token));
    }
    return clientCache.get(token);
}

/**
 * Send a single email
 * @param {string} token - Postmark server API token
 * @param {string} fromEmail - Sender email address
 * @param {string} fromName - Sender name
 * @param {string} toEmail - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML content
 * @param {string} [textBody] - Plain text content (optional)
 */
async function sendEmail(token, fromEmail, fromName, toEmail, subject, htmlBody, textBody = null) {
    const client = getClient(token);
    
    const message = {
        From: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        To: toEmail,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody || stripHtml(htmlBody),
        MessageStream: 'outbound'
    };
    
    try {
        const result = await client.sendEmail(message);
        console.log(`Email sent to ${toEmail}: ${result.MessageID}`);
        return result;
    } catch (error) {
        console.error(`Failed to send email to ${toEmail}:`, error);
        throw error;
    }
}

/**
 * Send multiple emails in batch
 * @param {string} token - Postmark server API token
 * @param {string} fromEmail - Sender email address
 * @param {string} fromName - Sender name
 * @param {Array} emails - Array of {to, subject, html, text?} objects
 */
async function sendBatchEmails(token, fromEmail, fromName, emails) {
    if (emails.length === 0) return [];
    
    const client = getClient(token);
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    
    // Postmark batch limit is 500 emails
    const batches = [];
    for (let i = 0; i < emails.length; i += 500) {
        batches.push(emails.slice(i, i + 500));
    }
    
    const results = [];
    
    for (const batch of batches) {
        const messages = batch.map(email => ({
            From: from,
            To: email.to,
            Subject: email.subject,
            HtmlBody: email.html,
            TextBody: email.text || stripHtml(email.html),
            MessageStream: 'outbound'
        }));
        
        try {
            const batchResult = await client.sendEmailBatch(messages);
            results.push(...batchResult);
            console.log(`Batch sent: ${batchResult.length} emails`);
        } catch (error) {
            console.error('Batch send error:', error);
            throw error;
        }
    }
    
    return results;
}

/**
 * Verify Postmark token is valid
 * @param {string} token - Postmark server API token
 */
async function verifyToken(token) {
    try {
        const client = new postmark.ServerClient(token);
        const server = await client.getServer();
        return {
            valid: true,
            serverName: server.Name,
            color: server.Color
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html) {
    return html
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

module.exports = {
    sendEmail,
    sendBatchEmails,
    verifyToken
};
