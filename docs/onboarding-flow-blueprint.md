# Onboarding Flow Blueprint

A self-contained, reusable 4-slide horizontal swipeable onboarding screen for Expo Router apps with animated icons, text, and pagination dots.

---

## Dependencies

```bash
npx expo install moti react-native-reanimated react-native-safe-area-context @expo/vector-icons
```

| Package | Purpose |
|---|---|
| `moti` | Declarative spring/timing animations (wraps reanimated) |
| `react-native-reanimated` | Required peer dependency for moti |
| `react-native-safe-area-context` | Safe area insets |
| `@expo/vector-icons` (Ionicons) | Slide icons |

> **Note:** `expo-router` is assumed for navigation. Replace `router.replace(...)` with your own navigation call if using a different router.

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│  SafeAreaView (full screen)          │
│                                      │
│  ┌─ Header ────────────────────────┐ │
│  │                      [Skip]     │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ FlatList (horizontal, paging) ─┐ │
│  │                                 │ │
│  │   ┌─────────┐                   │ │
│  │   │  Icon   │  ← spring anim   │ │
│  │   │ (circle)│    scale+opacity  │ │
│  │   └─────────┘                   │ │
│  │                                 │ │
│  │   Title       ← timing anim    │ │
│  │   Description   fade+slideUp   │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ Footer ────────────────────────┐ │
│  │   ● ━━ ● ● ●   ← dot pagination│ │
│  │                                 │ │
│  │   [ Next / Get Started ]        │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## Animations Detail

### 1. Icon Container (spring)
- **From:** `opacity: 0, scale: 0.8`
- **Active slide:** `opacity: 1, scale: 1`
- **Inactive slide:** `opacity: 0.5, scale: 0.8`
- **Transition:** `type: "spring", damping: 15`

### 2. Title + Description (timing)
- **From:** `opacity: 0, translateY: 20`
- **Active slide:** `opacity: 1, translateY: 0`
- **Inactive slide:** `opacity: 0, translateY: 20`
- **Transition:** `type: "timing", duration: 400`

### 3. Pagination Dots (spring)
- **Active dot:** `width: 24`, `backgroundColor: primary color`
- **Inactive dot:** `width: 8`, `backgroundColor: border color`
- **Height:** always `8`, `borderRadius: 4`
- **Transition:** `type: "spring", damping: 15`

---

## Slide Data Structure

```typescript
interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;  // any Ionicons icon name
  title: string;
  description: string;
}
```

Replace the content below with your own app's slides:

```typescript
const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "search",
    title: "Find the Right Lawyer",
    description:
      "Browse qualified attorneys specializing in your legal needs. Filter by practice area, location, and budget.",
  },
  {
    id: "2",
    icon: "chatbubbles",
    title: "Get Competitive Quotes",
    description:
      "Receive and compare quotes from multiple attorneys. Choose the best fit for your case and budget.",
  },
  {
    id: "3",
    icon: "shield-checkmark",
    title: "Secure Communication",
    description:
      "Message attorneys directly through our secure platform. Share documents and schedule consultations.",
  },
  {
    id: "4",
    icon: "briefcase",
    title: "Manage Your Case",
    description:
      "Track your case progress, milestones, and documents all in one place. Stay informed every step of the way.",
  },
];
```

---

## Complete Onboarding Screen Component

This is fully self-contained. It depends on a `colors` theme object and a `Button` component (both provided below).

```tsx
// onboarding.tsx
import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

// ─── Replace these with your own theme/colors ───
const colors = {
  background: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#666666",
  primary: "#2563EB",
  border: "#E5E5E5",
};
// ─────────────────────────────────────────────────

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "search",
    title: "Find the Right Lawyer",
    description:
      "Browse qualified attorneys specializing in your legal needs. Filter by practice area, location, and budget.",
  },
  {
    id: "2",
    icon: "chatbubbles",
    title: "Get Competitive Quotes",
    description:
      "Receive and compare quotes from multiple attorneys. Choose the best fit for your case and budget.",
  },
  {
    id: "3",
    icon: "shield-checkmark",
    title: "Secure Communication",
    description:
      "Message attorneys directly through our secure platform. Share documents and schedule consultations.",
  },
  {
    id: "4",
    icon: "briefcase",
    title: "Manage Your Case",
    description:
      "Track your case progress, milestones, and documents all in one place. Stay informed every step of the way.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Replace with your destination route
    router.replace("/(auth)/login");
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => (
    <View style={[styles.slide, { width }]}>
      {/* Animated icon circle */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: currentIndex === index ? 1 : 0.5,
          scale: currentIndex === index ? 1 : 0.8,
        }}
        transition={{ type: "spring", damping: 15 }}
        style={[styles.iconContainer, { backgroundColor: colors.primary }]}
      >
        <Ionicons name={item.icon} size={64} color="#FFFFFF" />
      </MotiView>

      {/* Animated title + description */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{
          opacity: currentIndex === index ? 1 : 0,
          translateY: currentIndex === index ? 0 : 20,
        }}
        transition={{ type: "timing", duration: 400 }}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </MotiView>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Skip button (top-right) */}
      <View style={styles.header}>
        <Button title="Skip" onPress={handleSkip} variant="ghost" size="sm" />
      </View>

      {/* Horizontal paging FlatList */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
      />

      {/* Pagination dots + Next/Get Started button */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <MotiView
              key={index}
              animate={{
                width: currentIndex === index ? 24 : 8,
                backgroundColor:
                  currentIndex === index ? colors.primary : colors.border,
              }}
              transition={{ type: "spring", damping: 15 }}
              style={styles.paginationDot}
            />
          ))}
        </View>

        <Button
          title={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    width: "100%",
  },
});
```

---

## Button Component

A simple themed button used by the onboarding screen. Supports `primary`, `secondary`, `outline`, and `ghost` variants.

```tsx
// button.tsx
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

// ─── Replace with your own theme colors ───
const colors = {
  primary: "#2563EB",
  surface: "#F5F5F5",
  text: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E5E5E5",
};
// ───────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case "primary":
        return colors.primary;
      case "secondary":
        return colors.surface;
      case "outline":
      case "ghost":
        return "transparent";
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return colors.text;
      case "outline":
      case "ghost":
        return colors.primary;
      default:
        return "#FFFFFF";
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") {
      return disabled ? colors.border : colors.primary;
    }
    return "transparent";
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case "md":
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case "lg":
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return 14;
      case "md":
        return 16;
      case "lg":
        return 18;
      default:
        return 16;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 1 : 0,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
});
```

---

## How to Customize

| What | Where |
|---|---|
| Slide content | Change the `slides` array (icons, titles, descriptions) |
| Number of slides | Add/remove items from the `slides` array |
| Colors | Replace the `colors` object or wire up your own theme context |
| Icon set | Swap `Ionicons` for any `@expo/vector-icons` family (MaterialIcons, FontAwesome, etc.) |
| Icon size | Change `size={64}` in the `<Ionicons>` call |
| Circle size | Adjust `iconContainer` width/height/borderRadius (keep borderRadius = width/2) |
| Destination route | Change `router.replace("/(auth)/login")` in `handleComplete` |
| Animation speed | Adjust `damping` (spring) or `duration` (timing) values |
| Dot sizing | Active width `24`, inactive width `8`, height `8` in pagination |
| Button label on last slide | Change `"Get Started"` string in the ternary |

---

## Swipe Behavior

- Uses `FlatList` with `horizontal` + `pagingEnabled` for native snap-to-page swiping
- `onViewableItemsChanged` with `viewAreaCoveragePercentThreshold: 50` tracks which slide is visible
- The "Next" button programmatically calls `scrollToIndex` to advance
- On the last slide, the button label changes to "Get Started" and triggers navigation
- "Skip" in the header jumps directly to the destination at any point
