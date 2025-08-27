
/**
 * QBoosting Order Logging - Simplified Google Apps Script
 * Only handles logging confirmed orders from client
 */

function doGet(e) {
    const action = e.parameter.action;

    if (action === 'logOrder') {
        return ContentService.createTextOutput(
            JSON.stringify(logOrder(e.parameter))
        ).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Invalid action' })
    ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Log a confirmed order to the spreadsheet
 * Order numbers are now generated client-side for speed
 */
function logOrder(params) {
    try {
        const sheet = SpreadsheetApp.openById('176lOkYH7Z1qyYzkrEu3lK3E0o3cvjD5De1viaYFNrGs').getSheetByName('Orders');

        // Add the confirmed order directly
        sheet.appendRow([
            params.orderNumber,  // Client-generated 5-digit order number
            new Date(),          // Timestamp
            params.service,      // Service name (e.g., "FUT Champions")
            params.email,        // Customer email
            params.price,        // Price with currency (e.g., "$123")
            'Confirmed'          // Status
        ]);

        return { 
            success: true, 
            message: 'Order logged successfully',
            orderNumber: params.orderNumber 
        };
    } catch (error) {
        return { 
            success: false, 
            error: 'Failed to log order: ' + error.toString() 
        };
    }
}