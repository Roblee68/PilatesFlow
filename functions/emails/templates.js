/**
 * Email Templates for MyoMesh
 * All HTML email templates with consistent branding
 */

// Brand colors matching MyoMesh
const colors = {
    forest: '#1E3A34',
    sage: '#3D8B7A',
    coral: '#FF6B4A',
    coralLight: '#FF8F75',
    amber: '#FFB347',
    cream: '#FFFBF7',
    warmLight: '#FFF5ED',
    text: '#2D2926',
    textLight: '#6B635B',
    border: '#E8DDD4'
};

/**
 * Base email wrapper
 */
function baseTemplate(content, businessName) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.cream}; color: ${colors.text};">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(45, 41, 38, 0.08); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${colors.forest} 0%, ${colors.sage} 50%, ${colors.coral} 100%); padding: 30px 40px;">
                            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">${businessName}</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background: ${colors.warmLight}; padding: 24px 40px; border-top: 1px solid ${colors.border};">
                            <p style="margin: 0; font-size: 13px; color: ${colors.textLight}; text-align: center;">
                                This email was sent by ${businessName}<br>
                                <span style="color: ${colors.sage};">Powered by MyoMesh</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Appointment Confirmation (to client)
 */
function appointmentConfirmation({ clientName, businessName, date, time, sessionType, staffName, notes }) {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.forest}; font-size: 22px;">Your Appointment is Confirmed! ✓</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${clientName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Your appointment has been successfully booked. Here are the details:
        </p>
        
        <table role="presentation" style="width: 100%; background: ${colors.warmLight}; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Date</span><br>
                    <strong style="color: ${colors.forest}; font-size: 16px;">${date}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Time</span><br>
                    <strong style="color: ${colors.forest}; font-size: 16px;">${time}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Session Type</span><br>
                    <strong style="color: ${colors.forest}; font-size: 16px;">${sessionType}</strong>
                </td>
            </tr>
            ${staffName ? `
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">With</span><br>
                    <strong style="color: ${colors.forest}; font-size: 16px;">${staffName}</strong>
                </td>
            </tr>
            ` : ''}
        </table>
        
        ${notes ? `
        <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 14px; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid ${colors.coral};">${notes}</p>
        ` : ''}
        
        <p style="margin: 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            We look forward to seeing you!
        </p>
    `;
    return baseTemplate(content, businessName);
}

/**
 * Appointment Updated (to client)
 */
function appointmentUpdated({ clientName, businessName, date, time, sessionType, staffName, changes }) {
    const changesHtml = changes.map(c => `<li style="margin: 4px 0;">${c}</li>`).join('');
    
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.amber}; font-size: 22px;">Appointment Updated</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${clientName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Your appointment has been updated. Here's what changed:
        </p>
        
        <div style="background: #FFF8E7; border: 1px solid ${colors.amber}; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <ul style="margin: 0; padding-left: 20px; color: ${colors.text};">
                ${changesHtml}
            </ul>
        </div>
        
        <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Updated Details</p>
        <table role="presentation" style="width: 100%; background: ${colors.warmLight}; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0;">
                    <strong style="color: ${colors.forest};">${date}</strong> at <strong style="color: ${colors.forest};">${time}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0;">
                    ${sessionType} ${staffName ? `with ${staffName}` : ''}
                </td>
            </tr>
        </table>
        
        <p style="margin: 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            If you have any questions about these changes, please contact us.
        </p>
    `;
    return baseTemplate(content, businessName);
}

/**
 * Appointment Cancelled (to client)
 */
function appointmentCancelled({ clientName, businessName, date, time, sessionType }) {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #DC4F41; font-size: 22px;">Appointment Cancelled</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${clientName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Your appointment has been cancelled:
        </p>
        
        <table role="presentation" style="width: 100%; background: #FFF0F0; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-decoration: line-through; color: ${colors.textLight};">
            <tr>
                <td>
                    ${date} at ${time}<br>
                    ${sessionType}
                </td>
            </tr>
        </table>
        
        <p style="margin: 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            If you'd like to reschedule, please contact us or book a new appointment.
        </p>
    `;
    return baseTemplate(content, businessName);
}

/**
 * Staff Notification (new booking)
 */
function staffNotification({ staffName, businessName, clientNames, date, time, sessionType, notes }) {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.sage}; font-size: 22px;">New Booking 📅</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${staffName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            A new session has been booked with you:
        </p>
        
        <table role="presentation" style="width: 100%; background: ${colors.warmLight}; border-radius: 10px; padding: 24px; margin-bottom: 24px;">
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px;">CLIENT</span><br>
                    <strong style="color: ${colors.coral}; font-size: 18px;">${clientNames}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px;">WHEN</span><br>
                    <strong style="color: ${colors.forest};">${date}</strong> at <strong>${time}</strong>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0;">
                    <span style="color: ${colors.textLight}; font-size: 13px;">TYPE</span><br>
                    <strong>${sessionType}</strong>
                </td>
            </tr>
        </table>
        
        ${notes ? `
        <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 13px;">NOTES</p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 14px; padding: 16px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid ${colors.coral};">${notes}</p>
        ` : ''}
    `;
    return baseTemplate(content, businessName);
}

/**
 * Staff Update Notification
 */
function staffUpdateNotification({ staffName, businessName, clientNames, date, time, sessionType, changes, wasReassigned }) {
    const changesHtml = changes.map(c => `<li style="margin: 4px 0;">${c}</li>`).join('');
    
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.amber}; font-size: 22px;">
            ${wasReassigned ? 'Session Reassigned' : 'Session Updated'}
        </h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${staffName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            ${wasReassigned 
                ? `A session with ${clientNames} has been reassigned to another staff member.`
                : `A session with ${clientNames} has been updated:`
            }
        </p>
        
        <div style="background: #FFF8E7; border: 1px solid ${colors.amber}; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <ul style="margin: 0; padding-left: 20px; color: ${colors.text};">
                ${changesHtml}
            </ul>
        </div>
        
        ${!wasReassigned ? `
        <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 13px;">UPDATED DETAILS</p>
        <table role="presentation" style="width: 100%; background: ${colors.warmLight}; border-radius: 10px; padding: 24px;">
            <tr>
                <td>
                    <strong>${clientNames}</strong><br>
                    ${date} at ${time}<br>
                    ${sessionType}
                </td>
            </tr>
        </table>
        ` : ''}
    `;
    return baseTemplate(content, businessName);
}

/**
 * Staff Cancellation Notification
 */
function staffCancellationNotification({ staffName, businessName, clientNames, date, time, sessionType }) {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #DC4F41; font-size: 22px;">Session Cancelled</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${staffName},
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            A session has been cancelled:
        </p>
        
        <table role="presentation" style="width: 100%; background: #FFF0F0; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-decoration: line-through; color: ${colors.textLight};">
            <tr>
                <td>
                    <strong>${clientNames}</strong><br>
                    ${date} at ${time}<br>
                    ${sessionType}
                </td>
            </tr>
        </table>
        
        <p style="margin: 0; color: ${colors.text}; font-size: 14px;">
            Your schedule has been updated accordingly.
        </p>
    `;
    return baseTemplate(content, businessName);
}

/**
 * Daily Summary (to staff)
 */
function dailySummary({ staffName, businessName, date, sessions }) {
    let sessionsHtml = '';
    
    for (const session of sessions) {
        let clientsHtml = '';
        for (const client of session.clientHistories || []) {
            // Recent notes summary
            let notesHtml = '';
            if (client.recentNotes && client.recentNotes.length > 0) {
                const lastNote = client.recentNotes[0];
                notesHtml = `
                    <div style="margin-top: 8px; padding: 12px; background: #f9f9f9; border-radius: 6px; font-size: 13px;">
                        <strong style="color: ${colors.textLight};">Last Session Note:</strong><br>
                        <span style="color: ${colors.text};">${lastNote.content?.substring(0, 200) || 'No notes'}${lastNote.content?.length > 200 ? '...' : ''}</span>
                    </div>
                `;
            }
            
            // Current concerns
            let concernsHtml = '';
            if (client.currentConcerns && client.currentConcerns.length > 0) {
                concernsHtml = `
                    <div style="margin-top: 8px;">
                        <strong style="color: ${colors.coral}; font-size: 12px;">CURRENT CONCERNS:</strong>
                        <span style="color: ${colors.text}; font-size: 13px;">${client.currentConcerns.join(', ')}</span>
                    </div>
                `;
            }
            
            // Body chart indicator
            let bodyChartHtml = '';
            if (client.bodyChart) {
                bodyChartHtml = `
                    <div style="margin-top: 8px; color: ${colors.sage}; font-size: 12px;">
                        ✓ Body chart available - view in app
                    </div>
                `;
            }
            
            clientsHtml += `
                <div style="margin-top: 12px; padding: 16px; background: white; border-radius: 8px; border: 1px solid ${colors.border};">
                    <strong style="color: ${colors.forest}; font-size: 15px;">${client.name}</strong>
                    ${concernsHtml}
                    ${notesHtml}
                    ${bodyChartHtml}
                </div>
            `;
        }
        
        sessionsHtml += `
            <div style="margin-bottom: 24px; padding: 20px; background: ${colors.warmLight}; border-radius: 10px; border-left: 4px solid ${colors.coral};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <strong style="color: ${colors.coral}; font-size: 18px;">${session.time ? formatTimeSimple(session.time) : 'TBD'}</strong>
                    <span style="color: ${colors.textLight}; font-size: 14px;">${session.type}</span>
                </div>
                <div style="color: ${colors.text}; font-size: 15px; margin-bottom: 8px;">
                    ${session.clientNames || 'No clients assigned'}
                </div>
                ${session.notes ? `<div style="color: ${colors.textLight}; font-size: 13px; font-style: italic;">"${session.notes}"</div>` : ''}
                ${clientsHtml}
            </div>
        `;
    }
    
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.forest}; font-size: 22px;">Tomorrow's Schedule</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Hi ${staffName},
        </p>
        <p style="margin: 0 0 8px 0; color: ${colors.textLight}; font-size: 14px;">${date}</p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 18px; font-weight: 600;">
            You have ${sessions.length} session${sessions.length !== 1 ? 's' : ''} scheduled
        </p>
        
        ${sessionsHtml}
        
        <p style="margin: 24px 0 0 0; color: ${colors.textLight}; font-size: 14px; text-align: center;">
            Log into MyoMesh to view full client profiles and body charts
        </p>
    `;
    return baseTemplate(content, businessName);
}

/**
 * Test Email
 */
function testEmail({ businessName }) {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${colors.sage}; font-size: 22px;">Email Configuration Test ✓</h2>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Great news! Your email notifications are configured correctly.
        </p>
        <p style="margin: 0 0 24px 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            This test confirms that:
        </p>
        <ul style="margin: 0 0 24px 0; color: ${colors.text}; padding-left: 20px; line-height: 1.8;">
            <li>Your Postmark API token is valid</li>
            <li>Your sender email is verified</li>
            <li>Emails are being delivered successfully</li>
        </ul>
        <p style="margin: 0; color: ${colors.text}; font-size: 16px; line-height: 1.6;">
            Your clients and staff will now receive automatic notifications for appointments.
        </p>
    `;
    return baseTemplate(content, businessName);
}

// Helper function for time formatting
function formatTimeSimple(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

module.exports = {
    appointmentConfirmation,
    appointmentUpdated,
    appointmentCancelled,
    staffNotification,
    staffUpdateNotification,
    staffCancellationNotification,
    dailySummary,
    testEmail
};
