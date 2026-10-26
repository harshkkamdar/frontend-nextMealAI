# Slice 3 copy (logging): old and new

Q29 voice: short, plain, warm, sentence case, no exclamation marks, no emoji, no "AI" talk. Needs Ved's approval (report it as a needs-owner row; the lead owns the ledger). Toasts that only changed their dash or ampersand are listed once at the end.

## Log food (`/logs/new/food`)

| Where | Old | New |
|---|---|---|
| Title | Log food (left, 22 pt) | Log food (centred pushed header) |
| Meal pill | Lunch ▾ | Lunch (glass pill, chevron); screen reader "Meal: Lunch" |
| Search placeholder | Search foods, brands, or describe it | Search foods or brands |
| Method chips | Photo / Menu | Photo, "Snap your plate" / Menu, "Scan a menu" |
| Photo busy | Analysing… | Reading… plus a card: "Reading your photo. A few seconds. I'll fill in what I can see." |
| Search error | Search isn't reachable right now. Try again, or use Photo or Menu. | I can't reach search right now. Try again, or snap a photo instead. |
| No results | No foods match "x". Try a shorter name, or use Photo. | Nothing matches "x". Try a shorter name, or snap a photo. |
| Result source | YOURS / USDA (all-caps eyebrow) | "· Yours" / "· USDA" at the end of the caption |
| Section labels | RECENT / FAVOURITES | Recent / Favourites |
| Estimate chip | Photo estimate · confidence 75% | From your photo · about 75% sure |
| Name field | (no label) | Food |
| Amount toggle | servings / grams | Servings / Grams |
| Servings caption | 1 serving 21g | serving · 21 g |
| Macro labels | KCAL / P / C / F | Calories / Protein / Carbs / Fat, with kcal and g under the number |
| Tray eyebrow | TRAY | (removed; the meal name sits on the right of the count) |
| Tray count | 2 items · 450 kcal | 2 items · 450 kcal (unchanged) |

## Manual logs (`/logs/new/<type>`)

| Where | Old | New |
|---|---|---|
| Titles | Log weight / water / sleep / mood / energy / workout | Weight / Water / Sleep / Mood / Energy / Workout |
| Weight prompt | What's the scale saying? | What does the scale say today? |
| Water prompt | How much water today? | How many glasses so far? |
| Water value | 3 glasses | 3, "glasses" under it |
| Sleep prompt | How did you sleep? | How did you sleep last night? |
| Sleep quality label | SLEEP QUALITY –/10 | How well, 1 to 10 |
| Mood prompt | How are you feeling? | How are you feeling right now? |
| Mood label | MOOD –/10 | 1 is low, 10 is great |
| Energy prompt | How's your energy? | How much energy do you have? |
| Energy label | ENERGY –/10 | 1 is flat, 10 is flying |
| Time of day label | TIME OF DAY | Time of day |
| Notes label | NOTES | Notes |
| Notes placeholders | Any notes (optional) / How was your sleep? / What's on your mind? / Anything affecting your energy? | Optional |
| Workout prompt | Build today's session and I'll time your rests. | What are you training? I'll time your rests. |
| Workout title label | WORKOUT TITLE, "e.g. Push day" | Name, "Push day" |
| Exercises label | EXERCISES | Exercises · optional, add more as you go |
| Scale buttons (screen reader) | 1 … 10 | 1 of 10 … 10 of 10 |

## Log chooser (`/logs`) and recent logs

| Where | Old | New |
|---|---|---|
| Title | Log (left) | Log (centred pushed header, round back) |
| Food action | Log food, trailing "Scan · Search" | Log food |
| Recent label | RECENT | Recent |
| Select toggle | Select / Cancel | Select / Done |
| Empty | No logs yet. Start tracking your food, workouts, and more to see them here. | Nothing logged yet. Tap + to log your first meal. (filtered: Nothing of this kind yet.) |
| Row titles | Mood: 7/10, Energy: 6/10, 7.2 hours | Mood 7 of 10, Energy 6 of 10, 7.2 hours asleep |
| Row metric | repeated the number (2 glasses / 2 glasses) | only kcal for food and minutes for workouts |
| Time | just now | Just now |
| Bulk delete confirm | This action cannot be undone. The selected logs will be permanently removed. | They'll be gone for good, and your totals will update. |

## Your foods (`/foods`)

| Where | Old | New |
|---|---|---|
| Title | Foods | Your foods |
| Add | Add a food (orange button) | round + in the header, "Add a food" for screen readers |
| Source tags | MANUAL / USDA / GEO / PERSONAL | Added by you / USDA / From Geo / Yours |
| Macro line | 100g · 165 kcal · 31P 0C 4F · used 12× | 100 g · 165 kcal · P 31 · C 0 · F 4, then source · used 12× |
| Favourite button | Add to favorites / Remove from favorites | Add {food} to favourites / Remove {food} from favourites |
| Options sheet | Delete | Add to favourites (or Remove from favourites), Delete food |
| Delete confirm | Delete food? This will permanently remove "x" from your saved foods. | Delete this food? "x" leaves your saved foods. Meals you already logged stay as they are. |
| Empty | No saved foods yet. Foods you log will appear here automatically. | Nothing saved yet. Foods you log land here, so your usual ones are one tap away. You can also add one by hand. |
| No match | No matches. No foods match "x" | None of your foods match "x". |
| Add sheet fields | placeholders only (Food name *, Brand (optional), Serving (g), …) | labelled fields: Name, Brand (optional), Serving, g, Calories, Protein, g, Carbs, g, Fat, g |
| Name missing | Name is required | Give the food a name |
| Errors | Failed to save food / Failed to update favorite / Failed to delete food | Couldn't save that food. Try again. / Couldn't update favourites. Try again. / Couldn't delete that food. Try again. |

## Food search sheet (Food diary)

| Where | Old | New |
|---|---|---|
| Title with tray | Add to Lunch · 2 in meal | Lunch · 2 in meal |
| Tabs | Food / Meals · 3 | Foods / Saved meals · 3 |
| Search placeholder | Search foods... | Search foods |
| Saved meals empty | No saved meals yet. Log a meal, then tap "Save as meal" on it in your diary to reuse it here. | No saved meals yet. In your diary, open a meal's menu and choose Save as meal. |
| No results | No results found, "Add "x" as custom food" | Nothing matches "x". "Add "x" as a new food" |
| Idle | Type to search foods | Start typing to find a food. |
| Footer | Ask Geo to estimate / Add custom food | Ask Geo to estimate / New food |
| Back | ← Back to search | Back to search |
| Log button | Log Food / Logging... | Log food / Logging… |
| Custom form title | Create Custom Food | New food |
| Custom fields | Food Name, Serving Size (g), MACROS PER SERVING | Name, Serving, g, Per serving |
| Custom save | Save & Log, "This food will be saved to your personal database for quick access later" | Save and log, "It's saved to your foods for next time." |
| Delete confirm | Delete entry? This food entry will be removed from your diary. | Delete this entry? It comes off your diary and your totals update. |
| Toasts | x — combined into one entry / x saved & logged / Logged x — 2 items | x added to the same entry / x saved and logged / Logged x, 2 items |
