# D.E.V.I Waitlist Setup Guide

## Google Apps Script Setup

### 1. Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new sheet called: `DEVI_Waitlist`
3. Add headers in row 1: `timestamp`, `name`, `email`, `notes`, `source`

### 2. Add Apps Script
1. In the Sheet: `Extensions` → `Apps Script`
2. Replace the default code with:

```javascript
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    var data = JSON.parse(e.postData.contents);

    var timestamp = new Date();
    var name = (data.name || '').toString().trim();
    var email = (data.email || '').toString().trim().toLowerCase();
    var notes = (data.notes || '').toString().trim();
    var source = (data.source || 'website').toString().trim();

    // Basic email sanity check
    if (!email || email.indexOf('@') === -1) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Invalid email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([timestamp, name, email, notes, source]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. Deploy the Web App
1. Click `Deploy` → `New deployment`
2. Select type: `Web app`
3. Execute as: `Me`
4. Who has access: `Anyone`
5. Click `Deploy`
6. Copy the Web app URL

### 4. Update the Website
1. Open `devi.html`
2. Find this line in the JavaScript:
   ```javascript
   const res = await fetch('YOUR_APPS_SCRIPT_WEB_APP_URL_HERE', {
   ```
3. Replace `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with your actual Web app URL

## Form Features
- ✅ Email validation
- ✅ Automatic timestamp
- ✅ Source tracking
- ✅ Error handling
- ✅ Success/error messages
- ✅ Form reset on success

## Optional Enhancements

### Email Confirmation
Set up Zapier or similar to send confirmation emails when new rows are added to the sheet.

### Analytics
Add Google Analytics events to track form submissions.

### Spam Protection
Consider adding reCAPTCHA or similar spam protection.

## Testing
1. Fill out the form on the D.E.V.I page
2. Check your Google Sheet for new entries
3. Verify all fields are captured correctly

## Troubleshooting
- If form doesn't submit, check browser console for errors
- Ensure the Web app URL is correct
- Verify the Google Sheet has the correct headers
- Check that the Apps Script has proper permissions
