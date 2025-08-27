
function doGet(e) {
    const action = e.parameter.action;

    if (action === 'generateOrder') {
        return ContentService.createTextOutput(
            JSON.stringify(generateOrderNumber())
        ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'logOrder') {
        return ContentService.createTextOutput(
            JSON.stringify(logOrder(e.parameter))
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

function generateOrderNumber() {
    try {
        const sheet = SpreadsheetApp.openById('176lOkYH7Z1qyYzkrEu3lK3E0o3cvjD5De1viaYFNrGs').getSheetByName('Orders');

        // Get all data to find the highest order number
        const data = sheet.getDataRange().getValues();
        let nextOrderNumber = 101; // Starting number

        // Find the highest existing order number (more reliable than lastRow)
        for (let i = 1; i < data.length; i++) {
            const orderNum = parseInt(data[i][0]);
            if (!isNaN(orderNum) && orderNum >= nextOrderNumber) {
                nextOrderNumber = orderNum + 1;
            }
        }

        // Reserve this number by adding a placeholder row
        sheet.appendRow([nextOrderNumber, new Date(), 'Reserved', '', '', 'Pending']);

        return {
            success: true,
            orderNumber: nextOrderNumber
        };
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
}

function logOrder(params) {
    try {
        const sheet = SpreadsheetApp.openById('176lOkYH7Z1qyYzkrEu3lK3E0o3cvjD5De1viaYFNrGs').getSheetByName('Orders');

        // Find the reserved row and update it
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            // Check both the service column and status column for "Reserved" and "Pending"
            if (data[i][0] == params.orderNumber && data[i][2] === 'Reserved' && data[i][5] === 'Pending') {
                sheet.getRange(i + 1, 1, 1, 6).setValues([[
                    params.orderNumber,
                    new Date(),
                    params.service,
                    params.email,
                    params.price,
                    'Confirmed'
                ]]);
                return { success: true, message: 'Order confirmed successfully' };
            }
        }

        // If no reserved row found, this means the order number wasn't pre-generated
        return { 
            success: false, 
            error: `Reserved order #${params.orderNumber} not found or already used` 
        };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}