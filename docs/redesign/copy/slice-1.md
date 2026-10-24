# Slice 1 copy list (onboarding) - for Ved's approval (Q29)

Old text is from `phase2/fiqr` at 832302c. The consent and medical-advice paragraphs are legal text and are unchanged in substance; only the em dashes became parentheses.

## Step questions and why-lines

| Screen | Old | New question | New why-line |
|---|---|---|---|
| Personal (form) | "Let's get to know you! This helps me personalize your plans." | - | - |
| Name | label "Name", placeholder "Your name" | What should Geo call you? | A first name is fine. |
| Sex | label "Sex", options Male / Female / Other | What is your sex? (Female / Male / Other) | Geo uses it to estimate how many calories you burn. |
| Date of birth | label "Date of birth" | When were you born? | Age changes how much you burn at rest. (shows "34 years old") |
| Height | label "Height", placeholder "e.g. 175", toast "Please enter a valid height (100-250 cm)" | How tall are you? (cm / ft) | Height and weight set your daily calories. |
| Fitness (form) | "Now let's talk about your fitness setup!" | - | - |
| Goal | "Primary goal": Fat Loss / Muscle Gain / Maintenance / Body Recomposition | What is your main goal? Lose fat (Eat a little under what you burn) / Build muscle (Eat a little over it and lift) / Both, slowly (Lose fat and build muscle at the same time) / Stay where I am (Keep weight steady, eat and train well) | Geo sets your calories and training from this. You can change it later. |
| Activity | "Activity level": Sedentary / Light / Moderate / Active / Very Active | How active are you outside workouts? Mostly sitting (Desk job, little walking) / Lightly active (On your feet some of the day) / Moderately active (Walking or standing a lot) / Active (Physical job or long daily walks) / Very active (Hard physical work every day) | - |
| Frequency | "Workout frequency (days per week)" number field | How many days a week can you train? (1-7) | Geo builds your program around this. |
| Experience | "Experience level": Beginner / Intermediate / Advanced | How long have you been training? New to it (Under a year of regular training) / Some experience (One to three years) / Experienced (Three years or more). Skip | - |
| Equipment | "Equipment" chips, "None" | What can you train with? ... Just my body (No equipment) | Pick everything you have access to. |
| Injuries | "Injuries", placeholder "e.g. Lower back pain" | Anything Geo should work around? CTA "Nothing to work around" when empty | Injuries or pain. Geo leaves out exercises that load them. |
| Body measurements | waist, chest, hip, body fat (optional) | removed from onboarding (still editable in Profile) | - |
| Nutrition (form) | "Almost done! Let's nail down your nutrition preferences." | - | - |
| Weight | "Current weight (kg)", placeholder "e.g. 75" | What do you weigh today? (kg / lb) | Geo uses this to set your daily calories. |
| Target | "Target weight (kg)", placeholder "e.g. 70" | What weight are you aiming for? "6.2 kg to lose" | You are at 78.2 kg today. |
| Reflection (new) | - | "6.2 kg is about 12 weeks at a steady pace." / gain: same at a quarter kilo a week / zero: "Holding steady is a plan too." CTA "Sounds right" | "A steady half a kilo a week is easier to stick with. Geo sets your calories for it and adjusts them at every weekly check-in." Card: "Sam, the rest is about food: allergies, how you eat and what you enjoy." |
| Allergies | "Allergies": Dairy, Gluten, Nuts, Eggs, Soy, Shellfish, None | Any food allergies? ... No allergies | Geo never suggests or logs these for you. |
| Diet | "Dietary style": Omnivore ... Kosher | How do you eat? I eat everything / Vegetarian / Vegan / Pescatarian / Halal / Kosher / Keto / Paleo. Skip | - |
| Dislikes | "Disliked foods", placeholder "e.g. Broccoli" | Foods you would rather skip? CTA "Nothing comes to mind" when empty | Geo keeps them out of your nutrition plan. |
| Cuisines | "Preferred cuisines", placeholder "e.g. Italian" | What do you like to eat? CTA "Anything goes" when empty | Cuisines Geo should lean on. |
| Meals | "Meals per day" | How many meals a day suit you? CTA "Finish" | Snacks count as meals. |

## Toasts

| Old | New |
|---|---|
| "Step 1 complete" / "Step 2 complete" / "Step 3 complete" | none (the next screen is the confirmation; a success haptic plays) |
| "Failed to save personal info" (and fitness, nutrition) | "That didn't save. Check your connection and try again." (server message shown when it has one) |
| "Please select your sex" / "Please select your activity level" / "Please select your primary goal" | none (Continue stays disabled until answered) |

## Consent, generating, reveal

| Screen | Old | New |
|---|---|---|
| Consent title | "Before Geo starts" + "Two things I need you to know, then we build your plan." | "Before Geo starts" + "Two things you should know, then Geo builds your plan." |
| Consent CTA | "Agree and continue" | "I agree" |
| Consent error | "Couldn't save. Try again." | "That didn't save. Check your connection and try again." |
| Generating | "Building your plan…" + "Geo is working out your calories, macros and training days." | "Geo is building your plan" + "This takes a few seconds." + checklist: Daily calories / Protein, carbs and fat / Your training week / Meals around what you like |
| Reveal | "Here's your personalised plan! Take a look and let me know if you'd like any changes." | "Your plan is ready" + "This is where you start. Geo adjusts it at every weekly check-in." |
| Reveal CTAs | "Looks good, let's go" / "I'd like to make changes" | "Start" / "Change something with Geo" |
| Reveal, no plan | "No plans created yet" + "Geo is still working on your plan, or it may not have generated. You can head to the dashboard and ask Geo to create one." + "Continue to dashboard" | "Geo could not finish your plan" + "Your answers are saved. Start now and ask Geo for a plan from Today; it takes one message." + "Go to Today" |
| Reveal, load error | toast "Failed to load plans" | "Your plan didn't load" + "Your answers are saved. Try again, or start and ask Geo for your plan from Today." + Try again |
