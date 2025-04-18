import { Twilio } from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials are not properly configured");
}

const twilio = new Twilio(accountSid, authToken);

export async function sendSMS(to: string, message: string) {
    return { success: true }; // don't send SMS yet
    try {
        const result = await twilio.messages.create({
            body: message,
            from: fromNumber,
            to: `+1${to}` // Assuming US numbers, add +1 prefix
        });
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error("Error sending SMS:", error);
        return { success: false, error };
    }
}

export async function sendBulkSMS(phoneNumbers: string[], message: string) {
    const results = await Promise.all(
        phoneNumbers.map(phoneNumber => sendSMS(phoneNumber, message))
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
        total: phoneNumbers.length,
        successful: successful.length,
        failed: failed.length,
        results
    };
} 