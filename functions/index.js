import functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const notifyNewOrder = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, _context) => {
    const order = snap.data();
    const restaurantId = order.restaurantId;

    // Get vendor's notification tokens
    const tokensSnapshot = await admin.firestore()
      .collection("restaurant")
      .doc(restaurantId)
      .collection("notificationTokens")
      .get();

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

    if (!tokens.length) {
      console.log("No tokens found for restaurant:", restaurantId);
      return;
    }

    const message = {
      notification: {
        title: "New Order Received!",
        body: `New order with ${order.items.length} item(s). Check your portal!`,
      },
      tokens,
    };

    try {
      await admin.messaging().sendMulticast(message);
      console.log("Notification sent to:", tokens);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });