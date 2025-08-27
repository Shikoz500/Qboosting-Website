
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

        // Get the last row with data
        const lastRow = sheet.getLastRow();
        let nextOrderNumber = 101; // Starting number

        if (lastRow > 1) { // If there are existing orders
            const lastOrderNumber = sheet.getRange(lastRow, 1).getValue();
            nextOrderNumber = parseInt(lastOrderNumber) + 1;
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
            if (data[i][0] == params.orderNumber && data[i][2] === 'Reserved') {
                sheet.getRange(i + 1, 1, 1, 6).setValues([[
                    params.orderNumber,
                    new Date(),
                    params.service,
                    params.email,
                    params.price,
                    'Confirmed'
                ]]);
                break;
            }
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}