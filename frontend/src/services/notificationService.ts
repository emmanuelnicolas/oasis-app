import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const SETTINGS_KEY =
  "oasis_notification_settings";

const MORNING_NOTIFICATION_ID_KEY =
  "oasis_morning_notification_id";

const EVENING_NOTIFICATION_ID_KEY =
  "oasis_evening_notification_id";

export type NotificationTime = {
  hour: number;
  minute: number;
};

export type NotificationSettings = {
  morningEnabled: boolean;
  morningTime: NotificationTime;

  eveningEnabled: boolean;
  eveningTime: NotificationTime;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  morningEnabled: false,
  morningTime: {
    hour: 8,
    minute: 0,
  },

  eveningEnabled: false,
  eveningTime: {
    hour: 21,
    minute: 0,
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function configureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    "routine-reminders",
    {
      name: "Rappels de routine",
      importance:
        Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    }
  );
}

function normalizeTime(
  time: NotificationTime,
  fallback: NotificationTime
): NotificationTime {
  const hour = Number(time?.hour);
  const minute = Number(time?.minute);

  return {
    hour:
      Number.isInteger(hour) &&
      hour >= 0 &&
      hour <= 23
        ? hour
        : fallback.hour,

    minute:
      Number.isInteger(minute) &&
      minute >= 0 &&
      minute <= 59
        ? minute
        : fallback.minute,
  };
}

function normalizeSettings(
  value?: Partial<NotificationSettings> | null
): NotificationSettings {
  return {
    morningEnabled:
      value?.morningEnabled === true,

    morningTime: normalizeTime(
      value?.morningTime ||
        DEFAULT_NOTIFICATION_SETTINGS.morningTime,
      DEFAULT_NOTIFICATION_SETTINGS.morningTime
    ),

    eveningEnabled:
      value?.eveningEnabled === true,

    eveningTime: normalizeTime(
      value?.eveningTime ||
        DEFAULT_NOTIFICATION_SETTINGS.eveningTime,
      DEFAULT_NOTIFICATION_SETTINGS.eveningTime
    ),
  };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(
      SETTINGS_KEY
    );

    if (!stored) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    const parsed = JSON.parse(stored);

    return normalizeSettings(parsed);
  } catch (error) {
    console.warn(
      "Impossible de lire les préférences de notification",
      error
    );

    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

async function cancelStoredNotification(
  storageKey: string
) {
  const notificationId =
    await AsyncStorage.getItem(storageKey);

  if (!notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificationId
    );
  } catch (error) {
    console.warn(
      "Impossible d’annuler la notification",
      error
    );
  } finally {
    await AsyncStorage.removeItem(storageKey);
  }
}

async function cancelRoutineNotifications() {
  await Promise.all([
    cancelStoredNotification(
      MORNING_NOTIFICATION_ID_KEY
    ),
    cancelStoredNotification(
      EVENING_NOTIFICATION_ID_KEY
    ),
  ]);
}

async function scheduleMorningReminder(
  time: NotificationTime
) {
  const identifier =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Routine du matin ✨",
        body: "Votre routine OASIS vous attend.",
        sound: "default",
        data: {
          route: "/(tabs)/routines",
          reminderType: "morning_routine",
        },
      },

      trigger: {
        type:
          Notifications
            .SchedulableTriggerInputTypes
            .DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId:
          Platform.OS === "android"
            ? "routine-reminders"
            : undefined,
      },
    });

  await AsyncStorage.setItem(
    MORNING_NOTIFICATION_ID_KEY,
    identifier
  );
}

async function scheduleEveningReminder(
  time: NotificationTime
) {
  const identifier =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Routine du soir 🌙",
        body: "Prenez quelques minutes pour prendre soin de votre peau.",
        sound: "default",
        data: {
          route: "/(tabs)/routines",
          reminderType: "evening_routine",
        },
      },

      trigger: {
        type:
          Notifications
            .SchedulableTriggerInputTypes
            .DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId:
          Platform.OS === "android"
            ? "routine-reminders"
            : undefined,
      },
    });

  await AsyncStorage.setItem(
    EVENING_NOTIFICATION_ID_KEY,
    identifier
  );
}

async function hasNotificationPermission() {
  const permissions =
    await Notifications.getPermissionsAsync();

  return permissions.status === "granted";
}

export async function requestNotificationPermission() {
  await configureAndroidChannel();

  const currentPermissions =
    await Notifications.getPermissionsAsync();

  if (
    currentPermissions.status === "granted"
  ) {
    return true;
  }

  const requestedPermissions =
    await Notifications.requestPermissionsAsync();

  return (
    requestedPermissions.status === "granted"
  );
}

export async function applyNotificationSettings(
  settings: NotificationSettings,
  requestPermission = true
) {
  const normalizedSettings =
    normalizeSettings(settings);

  await configureAndroidChannel();
  await cancelRoutineNotifications();

  const hasEnabledReminder =
    normalizedSettings.morningEnabled ||
    normalizedSettings.eveningEnabled;

  if (!hasEnabledReminder) {
    return {
      success: true,
      permissionGranted:
        await hasNotificationPermission(),
    };
  }

  const permissionGranted =
    requestPermission
      ? await requestNotificationPermission()
      : await hasNotificationPermission();

  if (!permissionGranted) {
    return {
      success: false,
      permissionGranted: false,
    };
  }

  if (normalizedSettings.morningEnabled) {
    await scheduleMorningReminder(
      normalizedSettings.morningTime
    );
  }

  if (normalizedSettings.eveningEnabled) {
    await scheduleEveningReminder(
      normalizedSettings.eveningTime
    );
  }

  return {
    success: true,
    permissionGranted: true,
  };
}

export async function saveNotificationSettings(
  settings: NotificationSettings
) {
  const normalizedSettings =
    normalizeSettings(settings);

  const result =
    await applyNotificationSettings(
      normalizedSettings,
      true
    );

  if (
    !result.permissionGranted &&
    (
      normalizedSettings.morningEnabled ||
      normalizedSettings.eveningEnabled
    )
  ) {
    return result;
  }

  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(normalizedSettings)
  );

  return result;
}

export async function initializeNotifications() {
  try {
    await configureAndroidChannel();

    const settings =
      await getNotificationSettings();

    return await applyNotificationSettings(
      settings,
      false
    );
  } catch (error) {
    console.warn(
      "Initialisation des notifications impossible",
      error
    );

    return {
      success: false,
      permissionGranted: false,
    };
  }
}

export async function disableAllRoutineNotifications() {
  const disabledSettings: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    morningEnabled: false,
    eveningEnabled: false,
  };

  await cancelRoutineNotifications();

  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(disabledSettings)
  );
}

export async function scheduleTestNotification() {
  const permissionGranted =
    await requestNotificationPermission();

  if (!permissionGranted) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test OASIS ✨",
      body: "Les notifications fonctionnent bien.",
      sound: "default",
      data: {
        reminderType: "test",
      },
    },

    trigger: {
      type:
        Notifications
          .SchedulableTriggerInputTypes
          .TIME_INTERVAL,
      seconds: 10,
      channelId:
        Platform.OS === "android"
          ? "routine-reminders"
          : undefined,
    },
  });

  return true;
}