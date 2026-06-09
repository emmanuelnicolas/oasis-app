import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "./theme";

type Props = {
  onCapture: (base64: string) => void;
  onClose: () => void;
};

export default function LiveCamera({ onCapture, onClose }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.msg}>Préparation de la caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.msg}>
          Autorisation caméra requise pour scanner l'étiquette.
        </Text>

        {permission.canAskAgain ? (
          <TouchableOpacity testID="grant-camera-btn" style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.msg}>
            Autorisez la caméra depuis les réglages iPhone, ou utilisez la galerie.
          </Text>
        )}

        <TouchableOpacity onPress={onClose} style={{ marginTop: spacing.md }}>
          <Text style={styles.cancelText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const snap = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        skipProcessing: Platform.OS === "android",
      });

      if (photo?.base64) {
        onCapture(photo.base64);
      } else {
        Alert.alert("Erreur", "Impossible de capturer la photo. Essayez la galerie.");
      }
    } catch (e: any) {
      Alert.alert("Erreur caméra", e?.message || "Capture échouée. Essayez la galerie.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.cam} facing={facing} />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose} testID="close-camera-btn">
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Scanner l'étiquette</Text>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing((prev) => (prev === "back" ? "front" : "back"))}
            testID="flip-camera-btn"
          >
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View pointerEvents="none" style={styles.frame}>
          <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.hint}>Cadrez la liste d'ingrédients INCI</Text>

          <TouchableOpacity style={styles.shutter} onPress={snap} disabled={capturing} testID="shutter-btn">
            {capturing ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: spacing.md }}>
            <Text style={styles.galleryFallback}>Utiliser la galerie à la place</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cam: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topTitle: { color: "#fff", fontSize: 15, fontWeight: "500" },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  frame: { position: "absolute", top: "25%", left: "10%", right: "10%", height: "35%" },
  corner: { position: "absolute", width: 32, height: 32, borderColor: "#fff" },
  bottomBar: {
    alignItems: "center",
    paddingBottom: 50,
    paddingTop: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  hint: { color: "#fff", marginBottom: spacing.md, fontSize: 13, opacity: 0.9 },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  msg: {
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: 14,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.button,
  },
  btnText: { color: "#fff", fontWeight: "500" },
  cancelText: { color: colors.textSecondary, fontSize: 14 },
  galleryFallback: { color: "#fff", fontSize: 13, textDecorationLine: "underline" },
});