import { Image, ImageSourcePropType, View } from "react-native";

import { cn } from "@/lib/cn";

type EmptyIllustrationProps = {
  source: ImageSourcePropType;
  className?: string;
  imageClassName?: string;
};

/** Centered onboarding / empty-state illustration wrapper (Collage A). */
export function EmptyIllustration({
  source,
  className,
  imageClassName = "",
}: EmptyIllustrationProps) {
  return (
    <View className={cn("items-center justify-center py-4", className)}>
      <Image
        source={source}
        resizeMode="contain"
        className={cn("h-44 w-full max-w-xs", imageClassName)}
        accessibilityRole="image"
      />
    </View>
  );
}
