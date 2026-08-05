import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";

import { useSafeAreaInsets } from
  "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  useAuth,
  apiFetch,
} from "../../src/auth";

import {
  colors,
  fonts,
  radius,
  spacing,
} from "../../src/theme";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleTestNotification,
  type NotificationSettings,
  type NotificationTime,
} from "../../src/services/notificationService";


const SKIN_LABELS: Record<string, string> = {
  sec: "Sèche",
  gras: "Grasse",
  mixte: "Mixte",
  normal: "Normale",
  sensible: "Sensible",
};

const CONCERN_LABELS: Record<string, string> = {
  acne: "Acné",
  rides: "Rides",
  taches: "Taches",
  deshydratation: "Déshydratation",
  eclat: "Éclat",
  pores: "Pores",
  rougeurs: "Rougeurs",
};

const MORNING_TIMES: NotificationTime[] = [
  {
    hour: 7,
    minute: 30,
  },
  {
    hour: 8,
    minute: 0,
  },
  {
    hour: 9,
    minute: 0,
  },
];

const EVENING_TIMES: NotificationTime[] = [
  {
    hour: 20,
    minute: 0,
  },
  {
    hour: 21,
    minute: 0,
  },
  {
    hour: 22,
    minute: 30,
  },
];

function formatTime(time: NotificationTime) {
  return `${String(time.hour).padStart(
    2,
    "0"
  )}:${String(time.minute).padStart(
    2,
    "0"
  )}`;
}

function isSameTime(
  first: NotificationTime,
  second: NotificationTime
) {
  return (
    first.hour === second.hour &&
    first.minute === second.minute
  );
}

type AccessUsage = {
  plan: "free" | "premium" | "founder";
  is_premium: boolean;

  usage: {
    product_analyses: {
      period: "day";
      used: number;
      limit: number | null;
      remaining: number | null;
    };

    selfie_analyses: {
      period: "month";
      used: number;
      limit: number | null;
      remaining: number | null;
    };
  };
};

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

const {
  user,
  token,
  logout,
} = useAuth();

const [profile, setProfile] =
  useState<any>(null);

const [
  accessUsage,
  setAccessUsage,
] = useState<AccessUsage | null>(
  null
);

const userPlan =
  user?.access?.plan ||
  user?.subscription?.plan ||
  "free";

const isPremium =
  user?.access?.is_premium === true;

const planLabel =
  userPlan === "founder"
    ? "Fondateur"
    : userPlan === "premium"
      ? "Premium"
      : "Gratuit";

const productAnalysisLimit =
  user?.access?.limits
    ?.product_analyses_per_day ?? 5;

const selfieAnalysisLimit =
  user?.access?.limits
    ?.selfie_analyses_per_month ?? 2;

const productAnalysisUsed =
  accessUsage?.usage
    ?.product_analyses
    ?.used ?? 0;

const actualProductAnalysisLimit =
  accessUsage?.usage
    ?.product_analyses
    ?.limit ??
  productAnalysisLimit;

const selfieAnalysisUsed =
  accessUsage?.usage
    ?.selfie_analyses
    ?.used ?? 0;

const actualSelfieAnalysisLimit =
  accessUsage?.usage
    ?.selfie_analyses
    ?.limit ??
  selfieAnalysisLimit;

  const [tips, setTips] = useState<{
    season: string;
    tips: string[];
  } | null>(null);

  const [
    notificationSettings,
    setNotificationSettings,
  ] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const [loading, setLoading] =
    useState(true);

  const [
    notificationSettingsLoaded,
    setNotificationSettingsLoaded,
  ] = useState(false);

  const [
    savingNotifications,
    setSavingNotifications,
  ] = useState(false);

  const [
    testingNotification,
    setTestingNotification,
  ] = useState(false);


  const load = useCallback(async () => {
    try {
      const [
	    profileResponse,
	    tipsResponse,
	    storedNotificationSettings,
	    accessUsageResponse,
	  ] = await Promise.all([
	    apiFetch(token, "/profile"),
	    apiFetch(token, "/tips/seasonal"),
	    getNotificationSettings(),
	    apiFetch(token, "/access/usage"),
	  ]);

      setProfile(profileResponse);
      setTips(tipsResponse);
	  
	  setAccessUsage(
		accessUsageResponse as AccessUsage
	  );

      setNotificationSettings(
        storedNotificationSettings
      );

      setNotificationSettingsLoaded(true);
    } catch (error) {
      console.warn(
        "Impossible de charger le profil",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [token]);


  useEffect(() => {
    load();
  }, [load]);


  const updateNotificationSettings = (
    values: Partial<NotificationSettings>
  ) => {
    setNotificationSettings(
      currentSettings => ({
        ...currentSettings,
        ...values,
      })
    );
  };


  const selectMorningTime = (
    morningTime: NotificationTime
  ) => {
    updateNotificationSettings({
      morningTime,
    });
  };


  const selectEveningTime = (
    eveningTime: NotificationTime
  ) => {
    updateNotificationSettings({
      eveningTime,
    });
  };


  const handleSaveNotifications =
    async () => {
      if (savingNotifications) {
        return;
      }

      setSavingNotifications(true);

      try {
        const result =
          await saveNotificationSettings(
            notificationSettings
          );

        if (
          !result.permissionGranted &&
          (
            notificationSettings
              .morningEnabled ||
            notificationSettings
              .eveningEnabled
          )
        ) {
          Alert.alert(
            "Notifications désactivées",
            "OASIS n’a pas obtenu l’autorisation d’envoyer des notifications. Vous pourrez l’autoriser dans les réglages de votre téléphone."
          );

          return;
        }

        Alert.alert(
          "Préférences enregistrées",
          notificationSettings.morningEnabled ||
            notificationSettings.eveningEnabled
            ? "Vos rappels OASIS ont été programmés."
            : "Les rappels de routine sont désactivés."
        );
      } catch (error) {
        console.warn(
          "Impossible d’enregistrer les rappels",
          error
        );

        Alert.alert(
          "Erreur",
          "Les préférences de notification n’ont pas pu être enregistrées."
        );
      } finally {
        setSavingNotifications(false);
      }
    };


  const handleTestNotification =
    async () => {
      if (testingNotification) {
        return;
      }

      setTestingNotification(true);

      try {
        const success =
          await scheduleTestNotification();

        if (!success) {
          Alert.alert(
            "Notifications désactivées",
            "Autorisez les notifications dans les réglages de votre téléphone pour recevoir le test."
          );

          return;
        }

        Alert.alert(
          "Notification programmée",
          "Une notification de test apparaîtra dans environ 10 secondes."
        );
      } catch (error) {
        console.warn(
          "Test de notification impossible",
          error
        );

        Alert.alert(
          "Erreur",
          "La notification de test n’a pas pu être programmée."
        );
      } finally {
        setTestingNotification(false);
      }
    };


  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color={colors.primary}
          size="large"
        />
      </View>
    );
  }


  return (
    <ScrollView
      style={{
        backgroundColor: colors.bg,
      }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop:
            insets.top + spacing.md,

          paddingBottom:
            insets.bottom +
            spacing.xxl,
        },
      ]}
    >
      <View style={styles.profileHeader}>
        {user?.picture ? (
          <Image
            source={{
              uri: user.picture,
            }}
            style={styles.bigAvatar}
          />
        ) : (
          <View
            style={[
              styles.bigAvatar,
              styles.avatarFallback,
            ]}
          >
            <Text style={styles.avatarLetter}>
              {(user?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.name}>
          {user?.name}
        </Text>

        <Text style={styles.email}>
          {user?.email}
        </Text>
      </View>


      {profile && profile.skin_type && (
        <View
          style={styles.card}
          testID="profile-summary"
        >
          <Text style={styles.cardLabel}>
            Votre profil de peau
          </Text>

          <View style={styles.row}>
            <Text style={styles.rowKey}>
              Type
            </Text>

            <Text style={styles.rowVal}>
              {SKIN_LABELS[
                profile.skin_type
              ] || profile.skin_type}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowKey}>
              Âge
            </Text>

            <Text style={styles.rowVal}>
              {profile.age_range}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowKey}>
              Sensibilité
            </Text>

            <Text style={styles.rowVal}>
              {profile.sensitivity}
            </Text>
          </View>

          <View
            style={[
              styles.row,
              styles.lastRow,
            ]}
          >
            <Text style={styles.rowKey}>
              Préoccupations
            </Text>

            <Text
              style={[
                styles.rowVal,
                styles.concernsValue,
              ]}
            >
              {(profile.concerns || [])
                .map(
                  (concern: string) =>
                    CONCERN_LABELS[
                      concern
                    ] || concern
                )
                .join(", ")}
            </Text>
          </View>

          <TouchableOpacity
            testID="edit-profile-btn"
            style={styles.editBtn}
            onPress={() =>
              router.push("/onboarding")
            }
          >
            <Text style={styles.editBtnText}>
              Modifier mon profil
            </Text>
          </TouchableOpacity>
        </View>
      )}
<View
  style={[
    styles.card,
    styles.premiumCard,
  ]}
  testID="premium-card"
>
  <View style={styles.premiumHeader}>
    <View style={styles.premiumIcon}>
      <Ionicons
        name={
          isPremium
            ? "diamond-outline"
            : "sparkles-outline"
        }
        size={22}
        color={colors.primary}
      />
    </View>

    <View style={styles.premiumHeaderText}>
      <Text style={styles.premiumTitle}>
        OASIS {planLabel}
      </Text>

      <Text style={styles.premiumSubtitle}>
        {isPremium
          ? "Votre intelligence skincare avancée est activée."
          : "Découvrez une analyse plus complète et un apprentissage approfondi."}
      </Text>
    </View>

    <View
      style={[
        styles.planBadge,
        isPremium &&
          styles.planBadgePremium,
      ]}
    >
      <Text
        style={[
          styles.planBadgeText,
          isPremium &&
            styles.planBadgeTextPremium,
        ]}
      >
        {planLabel}
      </Text>
    </View>
  </View>

  {!isPremium && (
    <>
      <View style={styles.freeLimits}>
        <PremiumLimitRow
		  icon="scan-outline"
		  label="Analyses produits"
		  value={
			actualProductAnalysisLimit === null
			  ? `${productAnalysisUsed} utilisées`
			  : `${productAnalysisUsed} / ${actualProductAnalysisLimit} aujourd’hui`
		  }
		/>

        <PremiumLimitRow
		  icon="camera-outline"
		  label="Analyses selfie"
		  value={
			actualSelfieAnalysisLimit === null
			  ? `${selfieAnalysisUsed} utilisées`
			  : `${selfieAnalysisUsed} / ${actualSelfieAnalysisLimit} ce mois-ci`
		  }
		/>

        <PremiumLimitRow
		  icon="chatbubble-ellipses-outline"
		  label="Coach OASIS"
		  value="Inclus"
		/>
      </View>

      <View style={styles.premiumBenefits}>
        <PremiumBenefitRow text="Analyse complète des formules" />
        <PremiumBenefitRow text="Synergies et promesses marketing" />
        <PremiumBenefitRow text="Apprentissage personnalisé complet" />
        <PremiumBenefitRow text="Historique et graphiques longue durée" />
      </View>

      <TouchableOpacity
        testID="discover-premium-btn"
        style={styles.premiumButton}
        onPress={() => {
          Alert.alert(
            "OASIS Premium",
            "L’abonnement Premium sera disponible prochainement."
          );
        }}
      >
        <Ionicons
          name="diamond-outline"
          size={18}
          color="#FFFFFF"
        />

        <Text style={styles.premiumButtonText}>
          Découvrir OASIS Premium
        </Text>
      </TouchableOpacity>

      <Text style={styles.premiumComingSoon}>
        Paiement non activé pendant la bêta.
      </Text>
    </>
  )}

  {isPremium && (
    <View style={styles.premiumActiveBox}>
      <Ionicons
        name="checkmark-circle-outline"
        size={20}
        color={colors.primary}
      />

      <Text style={styles.premiumActiveText}>
        Toutes les fonctionnalités avancées
        sont disponibles sur votre compte.
      </Text>
    </View>
  )}
</View>

      {notificationSettingsLoaded && (
        <View
          style={styles.card}
          testID="notification-settings"
        >
          <View
            style={
              styles.notificationHeader
            }
          >
            <View
              style={
                styles.notificationHeaderIcon
              }
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.cardTitle}>
                Rappels de routine
              </Text>

              <Text
                style={
                  styles.cardDescription
                }
              >
                Choisissez quand OASIS doit
                vous rappeler vos soins.
              </Text>
            </View>
          </View>


          <NotificationSection
            title="Routine du matin"
            description="Commencez la journée avec votre routine personnalisée."
            icon="sunny-outline"
            enabled={
              notificationSettings
                .morningEnabled
            }
            onEnabledChange={value =>
              updateNotificationSettings({
                morningEnabled: value,
              })
            }
            times={MORNING_TIMES}
            selectedTime={
              notificationSettings
                .morningTime
            }
            onTimeChange={
              selectMorningTime
            }
            testIDPrefix="morning"
          />


          <View
            style={
              styles.notificationDivider
            }
          />


          <NotificationSection
            title="Routine du soir"
            description="Terminez la journée avec vos soins du soir."
            icon="moon-outline"
            enabled={
              notificationSettings
                .eveningEnabled
            }
            onEnabledChange={value =>
              updateNotificationSettings({
                eveningEnabled: value,
              })
            }
            times={EVENING_TIMES}
            selectedTime={
              notificationSettings
                .eveningTime
            }
            onTimeChange={
              selectEveningTime
            }
            testIDPrefix="evening"
          />


          <TouchableOpacity
            testID="save-notifications-btn"
            style={[
              styles.saveNotificationBtn,
              savingNotifications &&
                styles.disabledButton,
            ]}
            onPress={
              handleSaveNotifications
            }
            disabled={
              savingNotifications
            }
          >
            {savingNotifications ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles
                      .saveNotificationBtnText
                  }
                >
                  Enregistrer les rappels
                </Text>
              </>
            )}
          </TouchableOpacity>


          <TouchableOpacity
            testID="test-notification-btn"
            style={[
              styles.testNotificationBtn,
              testingNotification &&
                styles.disabledButton,
            ]}
            onPress={
              handleTestNotification
            }
            disabled={
              testingNotification
            }
          >
            {testingNotification ? (
              <ActivityIndicator
                color={colors.primary}
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="notifications-circle-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text
                  style={
                    styles
                      .testNotificationBtnText
                  }
                >
                  Envoyer une notification
                  de test
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}


      {tips && tips.tips.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Conseils {tips.season}
          </Text>

          {tips.tips.map(
            (tip, index) => (
              <View
                key={index}
                style={styles.tipRow}
              >
                <Ionicons
                  name="leaf-outline"
                  size={14}
                  color={colors.primary}
                  style={{
                    marginTop: 2,
                  }}
                />

                <Text
                  style={styles.tipText}
                >
                  {tip}
                </Text>
              </View>
            )
          )}
        </View>
      )}


      <TouchableOpacity
        testID="logout-btn"
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color={colors.error}
        />

        <Text style={styles.logoutText}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PremiumLimitRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.premiumLimitRow}>
      <View style={styles.premiumLimitLeft}>
        <Ionicons
          name={icon}
          size={17}
          color={colors.primary}
        />

        <Text style={styles.premiumLimitLabel}>
          {label}
        </Text>
      </View>

      <Text style={styles.premiumLimitValue}>
        {value}
      </Text>
    </View>
  );
}


function PremiumBenefitRow({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.premiumBenefitRow}>
      <Ionicons
        name="checkmark-circle-outline"
        size={17}
        color={colors.primary}
      />

      <Text style={styles.premiumBenefitText}>
        {text}
      </Text>
    </View>
  );
}

function NotificationSection({
  title,
  description,
  icon,
  enabled,
  onEnabledChange,
  times,
  selectedTime,
  onTimeChange,
  testIDPrefix,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  onEnabledChange: (
    value: boolean
  ) => void;
  times: NotificationTime[];
  selectedTime: NotificationTime;
  onTimeChange: (
    time: NotificationTime
  ) => void;
  testIDPrefix: string;
}) {
  return (
    <View>
      <View
        style={
          styles.notificationToggleRow
        }
      >
        <View
          style={
            styles.notificationRoutineIcon
          }
        >
          <Ionicons
            name={icon}
            size={19}
            color={colors.primary}
          />
        </View>

        <View style={styles.headerText}>
          <Text
            style={
              styles.notificationTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles
                .notificationDescription
            }
          >
            {description}
          </Text>
        </View>

        <Switch
          testID={`${testIDPrefix}-notification-switch`}
          value={enabled}
          onValueChange={
            onEnabledChange
          }
          trackColor={{
            false: colors.border,
            true: colors.primary,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={
            colors.border
          }
        />
      </View>

      {enabled && (
        <View style={styles.timeSection}>
          <Text style={styles.timeLabel}>
            Heure du rappel
          </Text>

          <View
            style={styles.timeOptions}
          >
            {times.map(time => {
              const selected =
                isSameTime(
                  time,
                  selectedTime
                );

              return (
                <TouchableOpacity
                  key={formatTime(time)}
                  testID={`${testIDPrefix}-time-${formatTime(
                    time
                  )}`}
                  style={[
                    styles.timeButton,
                    selected &&
                      styles
                        .timeButtonSelected,
                  ]}
                  onPress={() =>
                    onTimeChange(time)
                  }
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      selected &&
                        styles
                          .timeButtonTextSelected,
                    ]}
                  >
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.md,
    backgroundColor: colors.border,
  },

  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: fonts.heading,
  },

  name: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: fonts.heading,
    fontWeight: "400",
  },

  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  cardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
    fontWeight: "500",
  },

  cardTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 3,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rowKey: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  rowVal: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },

  concernsValue: {
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },

  editBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.md,
  },

  editBtnText: {
    color: colors.primary,
    fontWeight: "500",
    fontSize: 14,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  notificationHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(126,154,136,0.12)",
    marginRight: spacing.sm,
  },

  headerText: {
    flex: 1,
  },

  notificationToggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationRoutineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(126,154,136,0.10)",
    marginRight: spacing.sm,
  },

  notificationTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  notificationDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2,
    paddingRight: spacing.sm,
  },

  notificationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  timeSection: {
    marginTop: spacing.md,
    marginLeft: 46,
  },

  timeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  timeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  timeButton: {
    minWidth: 68,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  timeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor:
      "rgba(126,154,136,0.12)",
  },

  timeButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  timeButtonTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },

  saveNotificationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    marginTop: spacing.xl,
  },

  saveNotificationBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  testNotificationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 13,
    marginTop: spacing.sm,
  },

  testNotificationBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },

  disabledButton: {
    opacity: 0.6,
  },

  tipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  tipText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },

  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "500",
  },
premiumCard: {
  overflow: "hidden",
},

premiumHeader: {
  flexDirection: "row",
  alignItems: "center",
},

premiumIcon: {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor:
    "rgba(126,154,136,0.14)",
  marginRight: spacing.sm,
},

premiumHeaderText: {
  flex: 1,
  paddingRight: spacing.sm,
},

premiumTitle: {
  fontSize: 17,
  color: colors.textPrimary,
  fontWeight: "700",
},

premiumSubtitle: {
  fontSize: 11,
  lineHeight: 17,
  color: colors.textSecondary,
  marginTop: 3,
},

planBadge: {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 5,
  backgroundColor: colors.bg,
},

planBadgePremium: {
  borderColor: colors.primary,
  backgroundColor:
    "rgba(126,154,136,0.14)",
},

planBadgeText: {
  fontSize: 10,
  color: colors.textSecondary,
  fontWeight: "700",
  textTransform: "uppercase",
},

planBadgeTextPremium: {
  color: colors.primary,
},

freeLimits: {
  marginTop: spacing.lg,
  borderTopWidth: 1,
  borderTopColor: colors.border,
},

premiumLimitRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},

premiumLimitLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
},

premiumLimitLabel: {
  fontSize: 13,
  color: colors.textPrimary,
},

premiumLimitValue: {
  fontSize: 12,
  color: colors.textSecondary,
  fontWeight: "600",
},

premiumBenefits: {
  gap: spacing.sm,
  marginTop: spacing.lg,
},

premiumBenefitRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
},

premiumBenefitText: {
  flex: 1,
  fontSize: 12,
  lineHeight: 18,
  color: colors.textPrimary,
},

premiumButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  backgroundColor: colors.primary,
  borderRadius: radius.button,
  paddingVertical: 14,
  marginTop: spacing.lg,
},

premiumButtonText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "600",
},

premiumComingSoon: {
  textAlign: "center",
  fontSize: 10,
  color: colors.textSecondary,
  marginTop: spacing.sm,
},

premiumActiveBox: {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  backgroundColor:
    "rgba(126,154,136,0.10)",
  borderRadius: radius.button,
  padding: spacing.md,
  marginTop: spacing.lg,
},

premiumActiveText: {
  flex: 1,
  fontSize: 12,
  lineHeight: 18,
  color: colors.textPrimary,
},
});