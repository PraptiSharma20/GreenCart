import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Sends an SMS using Twilio
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - Message content
 */
export const sendSMS = async (to, message) => {
  try {
    if (!accountSid || !authToken || !twilioNumber) {
      console.warn("Twilio credentials missing. SMS not sent.");
      return null;
    }

    const response = await client.messages.create({
      body: message,
      from: twilioNumber,
      to: to,
    });

    console.log(`SMS sent successfully: ${response.sid}`);
    return response;
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
    // We don't throw here to prevent breaking the main flow
    return null;
  }
};
