import { useWindowDimensions } from "react-native";

export type DeviceType = "phone" | "tablet" | "desktop";

export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();

  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  const deviceType: DeviceType = isPhone
    ? "phone"
    : isTablet
      ? "tablet"
      : "desktop";

  const horizontalPadding = isPhone
    ? 16
    : isTablet
      ? 24
      : 32;

  const contentMaxWidth = isDesktop ? 1280 : width;

  const cardGap = isPhone ? 12 : 16;

  const orbSize = isPhone
    ? Math.min(width - 96, 280)
    : isTablet
      ? 320
      : 380;

  return {
    width,
    height,
    fontScale,

    deviceType,
    isPhone,
    isTablet,
    isDesktop,

    horizontalPadding,
    contentMaxWidth,
    cardGap,
    orbSize,
  };
}