# Slice 1b copy (welcome and sign-in), for Ved's approval

24 Oct 2026. Old copy from `phase2/fiqr`; new copy as built on `redesign/fiqr-v2`.

## Welcome (new route `/welcome`; `/` now opens it)

| Slide | Title | Line |
|---|---|---|
| 1 | Food | Snap a meal or describe it. Geo counts the calories and macros for you. |
| 2 | Train | A program built around your week, your gear and anything that hurts. |
| 3 | Geo | Your coach in chat. Ask about food or training at any hour. |
| 4 | Check-in | Every week Geo reads your trend and adjusts your plan. |

Buttons: "Continue" (ink, slides 1-3), "Get started" (orange, slide 4), "I have an account". Mini-component sample text: Chicken rice bowl 612 kcal; Oats with berries; Greek yogurt; Rest / Set 3 of 4 next; Bench press 60 kg × 8; This week; "Hit my protein with what's in my fridge? Eggs, yogurt, tuna, rice." / "A tuna rice bowl with a yogurt dressing gets you most of the way."; Weight -0.6 kg, 7-day average, this week; Calories 1,950 to 1,900 from next week; Workouts 4 of 4.

## Sign in, sign up, password

| Where | Old | New |
|---|---|---|
| Login title / line | Welcome back / Sign in to your account | Welcome back / Sign in to pick up where you left off. |
| Login CTA, busy | Sign in / Signing in... | Sign in / Signing in… |
| Login link | New here? Create an account | New here? Create an account (unchanged) |
| Login error | toast with the API message | inline box above Sign in with the API message, shakes |
| Email error | Please enter a valid email | Enter an email like name@example.com |
| Password error (login) | Password is required | Enter your password |
| Sign-up title / line | Create your account / Start your fitness journey | Create your account / Geo saves your plan and your logs to it. |
| Sign-up password hint | placeholder "At least 8 characters" | tick line "At least 8 characters" that fills as you type |
| Sign-up errors | Password must be at least 8 characters / Please confirm your password / Passwords do not match | Use at least 8 characters / Type the password again / The two passwords don't match |
| Sign-up link | Have an account? Log in | I have an account |
| Forgot title / line / CTA | Reset your password / Enter your email and we'll send you a reset link / Send reset link | unchanged wording |
| Forgot result | toast "If that email exists, we've sent you a reset link." | screen "Check your email" / "If an account uses {email}, a reset link is on its way. It can take a minute to arrive." / Back to sign in / Send it again |
| Reset, bad link | Invalid or expired reset link / Please request a new password reset link. / Request a new link | This reset link has expired / Reset links work once and expire. Ask for a new one and use the latest email. / Send a new link |
| Reset form | Choose a new password / Choose a strong password you haven't used before / Update password | Choose a new password / Use at least 8 characters, one you haven't used here before. / Update password |
| Reset success toast | Password updated. Please sign in with your new password. | Password updated. Sign in with your new password. |
| Password fields | - | Show / Hide toggle |
