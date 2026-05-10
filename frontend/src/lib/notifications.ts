import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

let notificationHandlerConfigured = false;

const getProjectId = () => {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  );
};

export const getExpoPushToken = async (): Promise<string | null> => {
  if (Constants.appOwnership === "expo") {
    console.warn("Remote push notifications require a development build.");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const projectId = getProjectId();

  if (!projectId) {
    console.warn("Expo projectId is required to get a push token.");
    return null;
  }

  const Notifications = await import("expo-notifications");

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission was not granted.");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return token.data;
};
