import { Linking, Alert } from "react-native";

/**
 * Opens WhatsApp or falls back to WhatsApp Web to contact support.
 *
 * @param {Object} userProfile - The user's profile info from the redux store
 */
export const openWhatsAppSupport = async (userProfile) => {
  const name = userProfile?.name || "";
  const phone = userProfile?.phone || "";

  // 1. Build the full pre-filled message for the native app
  const fullMessage = `Hello FoodExpress Support,

I need assistance regarding the FoodExpress app.

Name: ${name}
Registered Mobile: ${phone}
Order ID (if applicable):

My Issue:`;

  const encodedFullMessage = encodeURIComponent(fullMessage);
  const whatsappUrl = `whatsapp://send?phone=919158852129&text=${encodedFullMessage}`;

  // 2. Fallback WhatsApp Web URL as specified in the requirements
  const fallbackText = "Hello FoodExpress Support, I need assistance regarding the FoodExpress app.";
  const encodedFallback = encodeURIComponent(fallbackText);
  const webUrl = `https://wa.me/919158852129?text=${encodedFallback}`;

  try {
    // Check if the native WhatsApp application protocol is supported
    const isSupported = await Linking.canOpenURL(whatsappUrl).catch(() => false);
    if (isSupported) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to WhatsApp Web
      const isWebSupported = await Linking.canOpenURL(webUrl).catch(() => false);
      if (isWebSupported) {
        await Linking.openURL(webUrl);
      } else {
        Alert.alert("Support", "Unable to open WhatsApp. Please contact us at +91 9158852129.");
      }
    }
  } catch (error) {
    // If anything fails in the try block, attempt directly opening web URL as a catch-all
    try {
      await Linking.openURL(webUrl);
    } catch (fallbackError) {
      Alert.alert("Support", "Unable to open WhatsApp. Please contact us at +91 9158852129.");
    }
  }
};
