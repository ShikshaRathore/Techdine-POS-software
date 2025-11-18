const axios = require("axios");

async function sendNotification(message) {
  try {
    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ["All"],
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Notification sent:", message);
  } catch (error) {
    console.error("OneSignal Error:", error.response?.data || error);
  }
}

module.exports = sendNotification;
