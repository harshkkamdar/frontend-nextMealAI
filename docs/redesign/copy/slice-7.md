# Slice 7 copy (Plans)

26 Oct 2026. Old / new for every string slice 7 changed. Geo voice (Q29): short, plain, warm, sentence case, no exclamation marks. Strings not listed are unchanged (validation messages from `validate()` are kept as they are because tests and toasts share them).

## /plans

| Where | Old | New |
|---|---|---|
| Section label | ACTIVE | Active |
| Card kind line | (none) | Nutrition / Training |
| Card badge | ACTIVE | (removed; the section says it) |
| Empty slot | No nutrition plan yet · Build one → | No nutrition plan yet / Build one, or ask Geo below |
| Empty slot | No training program yet · Build one → | No training program yet / Build one, or ask Geo below |
| New-plan heading | (none) | Want a new plan? |
| Card meta, training | 5 days · Upper A/Lower A/Upper B | 4 training days, 1 rest · 5 weeks left |
| Card meta, nutrition | 1,950 kcal · 140 g protein | 1,950 kcal · 140 g protein · 4 weeks left (time left only when the plan has an end date: "N weeks left", "N days left", "Ends today") |
| Primary action | Ask Geo for a plan | Ask Geo for a plan |
| Links header (new) | (none) | Or build it yourself |
| Link | Build a nutrition plan by hand → | Nutrition plan |
| Link | Build a training program by hand → | Training program |
| History section (new) | (none) | Earlier |
| Earlier row meta | (none) | Training · 2 Jun – 24 Aug (or "Made 5 Apr" when the plan has no dates) |
| Loading (screen reader) | (none) | Loading your plans |
| Error | I couldn't load your plans. Check your connection and try again. | unchanged |

## /plans/view

| Where | Old | New |
|---|---|---|
| Header bar title | (plan name as large title) | Training plan / Nutrition plan (name moves to the large title under it) |
| Header action | Edit plan (button at the bottom) | Edit plan (round pencil, top right) |
| Section labels | DAILY TARGETS, NOTES, DAYS, SNACKS, HISTORY | Daily targets, Notes, Days, Meals, History |
| Stats (new) | (none) | 5 days · 4 training · 18 exercises |
| Calorie target | Calories 2,600 | Calories / 2,600 kcal a day |
| No targets | Targets not set · Ask Geo | No targets yet / Ask Geo to work them out with you |
| Snack rows | SNACKS section, name only | Snack · 210 kcal, then the name |
| Empty day (new) | (none) | Nothing planned for this day |
| No days | No workout days yet | unchanged |
| Activate | Make this my plan / Activating… | Make this my plan / Making it active… |
| Activate toast | Plan activated | This is your plan now |
| Activate error | Failed to activate plan | Couldn't make it active. Try again. |
| Start error | Failed to start workout | Couldn't start the workout. Try again. |
| Not found | This plan no longer exists. It may have been replaced by a newer version. | This plan is gone. It was probably replaced by a newer version. |
| No id | Nothing selected. Back to plans. | No plan picked. Back to plans |
| History, empty diff (new) | (none) | No changes recorded for this version. |
| History loading | Loading history… | (nothing; the section appears when ready) |

## Builders (/plans/new/meal, /plans/new/workout, /plans/edit)

| Where | Old | New |
|---|---|---|
| Header | New nutrition plan / Edit nutrition plan / New training program / Edit training program | unchanged (now the centred bar title) |
| Step 1 question (new) | (one long form) | What should we call this plan? / What should we call this program? / Rename it, or keep going (edit) |
| Step 1 why (new) | (none) | A name you will recognise later. Dates and notes are optional. |
| Step 2 meal question (new) | (none) | What are your daily targets? |
| Step 2 meal why (new) | (none) | Home and the food diary measure each day against these. |
| Days question, meal (new) | (none) | What does a day of eating look like? |
| Days why, meal (new) | (none) | Search a food to fill in its numbers. You can change any of them. |
| Days question, workout (new) | (none) | Plan your training days |
| Days why, workout (new) | (none) | Add exercises to each day, or mark it as a rest day. |
| Field labels | PLAN NAME, START DATE, END DATE, NOTES | Plan name, Start date, End date, Notes |
| Notes placeholder | Optional notes / Optional notes about the program | Anything Geo should keep in mind / Anything Geo should know about this program |
| Rest day | checkbox "Rest day" | chip "Rest day" |
| Active switch | Set as active plan | Set as active plan / Replaces the one you follow now |
| Step action | Save plan (one page) | Continue, then Save plan on the last step |
| Saving | Saving… | unchanged |
| Cancel | Cancel | (removed; Back does it) |
| Blocking line (new) | error list after a failed save | the first thing still missing, above the action, e.g. "Day 1 needs at least one exercise" |
