
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

        // Find the FIRST available reserved row (oldest timestamp) instead of specific order number
        const data = sheet.getDataRange().getValues();
        
        // First try to find the specific reserved order number
        for (let i = 1; i < data.length; i++) {
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

        // If specific order not found, use the LOWEST numbered available reserved order (fallback)
        let lowestReservedOrder = null;
        let lowestRowIndex = -1;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][2] === 'Reserved' && data[i][5] === 'Pending') {
                const orderNumber = parseInt(data[i][0]);
                if (!isNaN(orderNumber) && (lowestReservedOrder === null || orderNumber < lowestReservedOrder)) {
                    lowestReservedOrder = orderNumber;
                    lowestRowIndex = i;
                }
            }
        }
        
        // If we found a reserved order, use it
        if (lowestReservedOrder !== null && lowestRowIndex !== -1) {
            sheet.getRange(lowestRowIndex + 1, 1, 1, 6).setValues([[
                lowestReservedOrder,
                new Date(),
                params.service,
                params.email,
                params.price,
                'Confirmed'
            ]]);
            return { 
                success: true, 
                message: 'Order confirmed successfully',
                actualOrderNumber: lowestReservedOrder 
            };
        }

        // If no reserved orders available, return error
        return { 
            success: false, 
            error: 'No reserved orders available. Try again in a moment.' 
        };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}