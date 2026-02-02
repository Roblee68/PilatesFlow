/**
 * MyoMesh Cloud Functions
 * Email notifications via Postmark
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendEmail, sendBatchEmails } = require('./emails/postmark');
const templates = require('./emails/templates');

admin.initializeApp();
const db = admin.firestore();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get email settings for an organization
 */
async function getEmailSettings(orgId) {
    const doc = await db.collection('organizations').doc(orgId).collection('settings').doc('email').get();
    if (!doc.exists) return null;
    return doc.data();
}

/**
 * Get organization details
 */
async function getOrganization(orgId) {
    const doc = await db.collection('organizations').doc(orgId).get();
    if (!doc.exists) return null;
    return doc.data();
}

/**
 * Get client details
 */
async function getClient(orgId, clientId) {
    const doc = await db.collection('organizations').doc(orgId).collection('clients').doc(clientId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
}

/**
 * Get staff member details by name
 */
async function getStaffByName(orgId, staffName) {
    const snapshot = await db.collection('organizations').doc(orgId).collection('users')
        .where('fullName', '==', staffName)
        .limit(1)
        .get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get client notes and body charts for summary
 */
async function getClientHistory(orgId, clientId) {
    // Get most recent notes
    const notesSnapshot = await db.collection('organizations').doc(orgId)
        .collection('clients').doc(clientId).collection('notes')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
    
    const notes = notesSnapshot.docs.map(doc => doc.data());
    
    // Get body chart if exists
    const clientDoc = await db.collection('organizations').doc(orgId).collection('clients').doc(clientId).get();
    const clientData = clientDoc.data();
    
    return {
        recentNotes: notes,
        bodyChart: clientData?.bodyChart || null,
        currentConcerns: clientData?.currentConcerns || []
    };
}

/**
 * Format time for display
 */
function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// ============================================
// APPOINTMENT CREATED
// ============================================

exports.onAppointmentCreated = functions.firestore
    .document('organizations/{orgId}/sessions/{sessionId}')
    .onCreate(async (snapshot, context) => {
        const { orgId, sessionId } = context.params;
        const session = snapshot.data();
        
        console.log(`New appointment created: ${sessionId} for org: ${orgId}`);
        
        // Get email settings
        const emailSettings = await getEmailSettings(orgId);
        if (!emailSettings || !emailSettings.notificationsEnabled) {
            console.log('Email notifications not enabled for this organization');
            return null;
        }
        
        const org = await getOrganization(orgId);
        const orgName = org?.name || 'Your Practice';
        
        const emails = [];
        
        // Send to clients
        if (emailSettings.sendClientConfirmations && session.clients) {
            for (const clientId of session.clients) {
                const client = await getClient(orgId, clientId);
                if (client?.email) {
                    emails.push({
                        to: client.email,
                        subject: `Appointment Confirmed - ${formatDate(session.date)}`,
                        html: templates.appointmentConfirmation({
                            clientName: client.name,
                            businessName: orgName,
                            date: formatDate(session.date),
                            time: formatTime(session.time),
                            sessionType: session.type,
                            staffName: session.teacherName,
                            notes: session.notes
                        })
                    });
                }
            }
        }
        
        // Send to staff
        if (emailSettings.sendStaffNotifications && session.teacherName) {
            const staff = await getStaffByName(orgId, session.teacherName);
            if (staff?.email) {
                emails.push({
                    to: staff.email,
                    subject: `New Booking - ${session.clientNames} on ${formatDate(session.date)}`,
                    html: templates.staffNotification({
                        staffName: session.teacherName,
                        businessName: orgName,
                        clientNames: session.clientNames,
                        date: formatDate(session.date),
                        time: formatTime(session.time),
                        sessionType: session.type,
                        notes: session.notes
                    })
                });
            }
        }
        
        // Send all emails
        if (emails.length > 0) {
            await sendBatchEmails(emailSettings.postmarkToken, emailSettings.fromEmail, emailSettings.fromName, emails);
            console.log(`Sent ${emails.length} notification emails`);
        }
        
        return null;
    });

// ============================================
// APPOINTMENT UPDATED
// ============================================

exports.onAppointmentUpdated = functions.firestore
    .document('organizations/{orgId}/sessions/{sessionId}')
    .onUpdate(async (change, context) => {
        const { orgId, sessionId } = context.params;
        const before = change.before.data();
        const after = change.after.data();
        
        // Check if significant changes were made
        const dateChanged = before.date !== after.date;
        const timeChanged = before.time !== after.time;
        const staffChanged = before.teacherName !== after.teacherName;
        
        if (!dateChanged && !timeChanged && !staffChanged) {
            console.log('No significant changes to notify about');
            return null;
        }
        
        console.log(`Appointment updated: ${sessionId} for org: ${orgId}`);
        
        // Get email settings
        const emailSettings = await getEmailSettings(orgId);
        if (!emailSettings || !emailSettings.notificationsEnabled) {
            return null;
        }
        
        const org = await getOrganization(orgId);
        const orgName = org?.name || 'Your Practice';
        
        const emails = [];
        const changes = [];
        if (dateChanged) changes.push(`Date: ${formatDate(before.date)} → ${formatDate(after.date)}`);
        if (timeChanged) changes.push(`Time: ${formatTime(before.time)} → ${formatTime(after.time)}`);
        if (staffChanged) changes.push(`Staff: ${before.teacherName} → ${after.teacherName}`);
        
        // Notify clients
        if (emailSettings.sendClientConfirmations && after.clients) {
            for (const clientId of after.clients) {
                const client = await getClient(orgId, clientId);
                if (client?.email) {
                    emails.push({
                        to: client.email,
                        subject: `Appointment Updated - ${formatDate(after.date)}`,
                        html: templates.appointmentUpdated({
                            clientName: client.name,
                            businessName: orgName,
                            date: formatDate(after.date),
                            time: formatTime(after.time),
                            sessionType: after.type,
                            staffName: after.teacherName,
                            changes: changes
                        })
                    });
                }
            }
        }
        
        // Notify staff (both old and new if changed)
        if (emailSettings.sendStaffNotifications) {
            const staffToNotify = new Set([after.teacherName]);
            if (staffChanged) staffToNotify.add(before.teacherName);
            
            for (const staffName of staffToNotify) {
                const staff = await getStaffByName(orgId, staffName);
                if (staff?.email) {
                    emails.push({
                        to: staff.email,
                        subject: `Appointment Updated - ${after.clientNames}`,
                        html: templates.staffUpdateNotification({
                            staffName: staffName,
                            businessName: orgName,
                            clientNames: after.clientNames,
                            date: formatDate(after.date),
                            time: formatTime(after.time),
                            sessionType: after.type,
                            changes: changes,
                            wasReassigned: staffChanged && staffName === before.teacherName
                        })
                    });
                }
            }
        }
        
        if (emails.length > 0) {
            await sendBatchEmails(emailSettings.postmarkToken, emailSettings.fromEmail, emailSettings.fromName, emails);
            console.log(`Sent ${emails.length} update notification emails`);
        }
        
        return null;
    });

// ============================================
// APPOINTMENT CANCELLED
// ============================================

exports.onAppointmentDeleted = functions.firestore
    .document('organizations/{orgId}/sessions/{sessionId}')
    .onDelete(async (snapshot, context) => {
        const { orgId, sessionId } = context.params;
        const session = snapshot.data();
        
        console.log(`Appointment deleted: ${sessionId} for org: ${orgId}`);
        
        // Get email settings
        const emailSettings = await getEmailSettings(orgId);
        if (!emailSettings || !emailSettings.notificationsEnabled) {
            return null;
        }
        
        const org = await getOrganization(orgId);
        const orgName = org?.name || 'Your Practice';
        
        const emails = [];
        
        // Notify clients
        if (emailSettings.sendClientConfirmations && session.clients) {
            for (const clientId of session.clients) {
                const client = await getClient(orgId, clientId);
                if (client?.email) {
                    emails.push({
                        to: client.email,
                        subject: `Appointment Cancelled - ${formatDate(session.date)}`,
                        html: templates.appointmentCancelled({
                            clientName: client.name,
                            businessName: orgName,
                            date: formatDate(session.date),
                            time: formatTime(session.time),
                            sessionType: session.type
                        })
                    });
                }
            }
        }
        
        // Notify staff
        if (emailSettings.sendStaffNotifications && session.teacherName) {
            const staff = await getStaffByName(orgId, session.teacherName);
            if (staff?.email) {
                emails.push({
                    to: staff.email,
                    subject: `Appointment Cancelled - ${session.clientNames}`,
                    html: templates.staffCancellationNotification({
                        staffName: session.teacherName,
                        businessName: orgName,
                        clientNames: session.clientNames,
                        date: formatDate(session.date),
                        time: formatTime(session.time),
                        sessionType: session.type
                    })
                });
            }
        }
        
        if (emails.length > 0) {
            await sendBatchEmails(emailSettings.postmarkToken, emailSettings.fromEmail, emailSettings.fromName, emails);
            console.log(`Sent ${emails.length} cancellation notification emails`);
        }
        
        return null;
    });

// ============================================
// DAILY SUMMARY (Scheduled - 6 PM daily)
// ============================================

exports.sendDailySummaries = functions.pubsub
    .schedule('0 18 * * *')  // 6 PM daily
    .timeZone('America/Toronto')
    .onRun(async (context) => {
        console.log('Running daily summary job...');
        
        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Get all organizations
        const orgsSnapshot = await db.collection('organizations').get();
        
        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;
            const org = orgDoc.data();
            
            // Get email settings
            const emailSettings = await getEmailSettings(orgId);
            if (!emailSettings || !emailSettings.notificationsEnabled || !emailSettings.sendDaySummaries) {
                continue;
            }
            
            // Get tomorrow's sessions
            const sessionsSnapshot = await db.collection('organizations').doc(orgId)
                .collection('sessions')
                .where('date', '==', tomorrowStr)
                .orderBy('time', 'asc')
                .get();
            
            if (sessionsSnapshot.empty) {
                continue; // No sessions tomorrow
            }
            
            const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Group sessions by staff member
            const sessionsByStaff = {};
            for (const session of sessions) {
                const staffName = session.teacherName || 'Unassigned';
                if (!sessionsByStaff[staffName]) {
                    sessionsByStaff[staffName] = [];
                }
                sessionsByStaff[staffName].push(session);
            }
            
            // Send summary to each staff member
            for (const [staffName, staffSessions] of Object.entries(sessionsByStaff)) {
                const staff = await getStaffByName(orgId, staffName);
                if (!staff?.email) continue;
                
                // Get client history for each session
                const sessionsWithHistory = [];
                for (const session of staffSessions) {
                    const clientHistories = [];
                    if (session.clients) {
                        for (const clientId of session.clients) {
                            const client = await getClient(orgId, clientId);
                            const history = await getClientHistory(orgId, clientId);
                            clientHistories.push({
                                name: client?.name || 'Unknown',
                                ...history
                            });
                        }
                    }
                    sessionsWithHistory.push({
                        ...session,
                        clientHistories
                    });
                }
                
                await sendEmail(
                    emailSettings.postmarkToken,
                    emailSettings.fromEmail,
                    emailSettings.fromName,
                    staff.email,
                    `Tomorrow's Schedule - ${formatDate(tomorrowStr)}`,
                    templates.dailySummary({
                        staffName: staffName,
                        businessName: org.name || 'Your Practice',
                        date: formatDate(tomorrowStr),
                        sessions: sessionsWithHistory
                    })
                );
                
                console.log(`Sent daily summary to ${staff.email}`);
            }
        }
        
        console.log('Daily summary job completed');
        return null;
    });

// ============================================
// TEST EMAIL FUNCTION (HTTP Callable)
// ============================================

exports.sendTestEmail = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    
    const { orgId, testEmail } = data;
    
    // Verify user has permission
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.organizationId !== orgId || !['owner', 'admin'].includes(userData.role)) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }
    
    // Get email settings
    const emailSettings = await getEmailSettings(orgId);
    if (!emailSettings || !emailSettings.postmarkToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Email settings not configured');
    }
    
    const org = await getOrganization(orgId);
    
    try {
        await sendEmail(
            emailSettings.postmarkToken,
            emailSettings.fromEmail,
            emailSettings.fromName,
            testEmail,
            'Test Email from MyoMesh',
            templates.testEmail({
                businessName: org?.name || 'Your Practice'
            })
        );
        
        return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
        console.error('Test email error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
