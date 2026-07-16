# 001 — Retarget the progress fill

- **Status**: DONE
- **Commit**: 073e70c
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file, 3 lines

## Problem

`mobile/src/screens/ProgressScreen.js:64` resets the same value that drives the normal progress-fill transform before every update. Switching periods while a fill is moving therefore restarts it at zero instead of retargeting from its current position.

```js
/* mobile/src/screens/ProgressScreen.js:64 — current */
useEffect(() => {
  energyFill.setValue(0);
  const animation = Animated.timing(energyFill, {
    duration: reducedMotion ? 140 : 220,
    easing: Easing.bezier(0.23, 1, 0.32, 1),
    toValue: reducedMotion ? 1 : energyPercentage,
    useNativeDriver: true,
  });
```

## Target

For normal motion, let the `Animated.Value` keep its in-flight value; effect cleanup stops the prior timing animation, and the next 220ms animation retargets it to the new percentage. For Reduce Motion, reset only the opacity value, then retain the 140ms opacity-only fade. Keep the existing `Easing.bezier(0.23, 1, 0.32, 1)` and `useNativeDriver: true`.

```js
/* target */
useEffect(() => {
  if (reducedMotion) {
    energyFill.setValue(0);
  }
  const animation = Animated.timing(energyFill, {
    duration: reducedMotion ? 140 : 220,
    easing: Easing.bezier(0.23, 1, 0.32, 1),
    toValue: reducedMotion ? 1 : energyPercentage,
    useNativeDriver: true,
  });
```

## Repo conventions to follow

- Use React Native's built-in `Animated` and `Easing`; do not add a motion dependency.
- `mobile/src/screens/GoalSavedScreen.js:8` is the existing one-shot entrance pattern: opacity and transform, 220ms strong ease-out, and a 140ms Reduce Motion fade.

## Steps

1. In `mobile/src/screens/ProgressScreen.js`, replace the unconditional `energyFill.setValue(0)` with a `reducedMotion` guard.
2. Keep the existing effect cleanup (`animation.stop()`), `scaleX`, `transformOrigin: "left center"`, easing, and duration values unchanged.

## Boundaries

- Do NOT change any markup, nutrition calculations, API calls, or period-selection behavior.
- Do NOT add dependencies or introduce shared motion tokens for this single correction.
- If the current effect no longer uses `Animated.Value`, stop and report instead of adapting the plan.

## Verification

- **Mechanical**: run `npm run mobile:test`; it passes. Compile the Expo web development target when the local dependency installation is healthy.
- **Feel check**: open progress and switch Today/This week twice before the fill settles. The fill should redirect from its visible position, never jump to zero. With Reduce Motion enabled, the final-width fill should use only a 140ms opacity fade.
- **Done when**: normal progress updates retarget smoothly with a 220ms strong ease-out; reduced motion preserves the opacity-only alternative.
