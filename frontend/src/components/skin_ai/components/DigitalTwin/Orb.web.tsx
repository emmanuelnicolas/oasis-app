import React from "react";
import { ActivityIndicator, View } from "react-native";
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

import type { OrbVisualState } from "./OrbVisualState";

type Props = {
  confidence: number;
  visualState: OrbVisualState;
};

export function Orb({
  confidence,
  visualState,
}: Props) {
  return (
    <WithSkiaWeb
      getComponent={() => import("./OrbSkia")}
      componentProps={{
  confidence,
  visualState,
}}
      fallback={
        <View
          style={{
            width: 320,
            height: 320,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      }
    />
  );
}