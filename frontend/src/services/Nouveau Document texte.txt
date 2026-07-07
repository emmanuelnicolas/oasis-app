import * as Notifications from "expo-notifications";

export async function initializeNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.log("Notifications refusées");
    return false;
  }

  console.log("Notifications autorisées");

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Routine du matin ✨",
      body: "Votre routine OASIS vous attend.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Comment va votre peau aujourd'hui ? 🌙",
      body: "Prenez 1 minute pour compléter votre journal OASIS.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  return true;
}

export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test OASIS ✨",
      body: "Les notifications fonctionnent bien.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 120,
    },
  });
}