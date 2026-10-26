import { describe, expect, it } from 'vitest'
import { parseFoodLine, parseLoggedFoods } from '@/components/chat/logged-foods'

describe('parseFoodLine', () => {
  it('reads the receipt format the backend prompt asks Geo for', () => {
    expect(parseFoodLine('Logged apple 350g · 182 cal · 0.6g P · 48g C · 0.6g F')).toEqual({
      name: 'Apple 350g', meal: null, kcal: 182, protein: 0.6, carbs: 48, fat: 0.6, estimated: false,
    })
  })

  it('takes the meal out of the name and reads a dash separator', () => {
    expect(parseFoodLine('Logged 3 eggs to breakfast — 216 cal')).toMatchObject({ name: '3 eggs', meal: 'Breakfast', kcal: 216, protein: null })
  })

  it('marks estimates and reads thousands', () => {
    expect(parseFoodLine('**Logged ~200g zucchini fritters · ~1,360 cal · 12g P (estimated)**')).toMatchObject({ name: '200g zucchini fritters', kcal: 1360, protein: 12, estimated: true })
  })

  it('ignores lines that do not claim a log', () => {
    expect(parseFoodLine('An apple is about 95 cal · 0.5g P')).toBeNull()
    expect(parseFoodLine('- Apple · 95 cal')).toBeNull()
    expect(parseFoodLine('Logged your sleep, 7h 20m')).toBeNull()
  })
})

describe('parseLoggedFoods', () => {
  it('pulls receipt lines out of the reply and keeps the rest', () => {
    const parsed = parseLoggedFoods('Logged chicken burrito bowl to lunch · 640 cal · 42g P · 70g C · 18g F\n\nThat leaves 860 kcal for the day.')
    expect(parsed.foods).toHaveLength(1)
    expect(parsed.foods[0]).toMatchObject({ name: 'Chicken burrito bowl', meal: 'Lunch', kcal: 640, carbs: 70, fat: 18 })
    expect(parsed.text).toBe('That leaves 860 kcal for the day.')
  })

  it('reads bullets under a "Logged to ..." heading', () => {
    const parsed = parseLoggedFoods('Logged to breakfast:\n- Greek yoghurt 200g · 190 cal · 20g P\n- Blueberries 80g · 46 cal\nNice start.')
    expect(parsed.foods.map((food) => food.name)).toEqual(['Greek yoghurt 200g', 'Blueberries 80g'])
    expect(parsed.text).toBe('Nice start.')
  })

  it('leaves a reply with no receipts untouched', () => {
    const text = 'Protein is 78 g short today.\n- Greek yoghurt\n- Chicken'
    expect(parseLoggedFoods(text)).toEqual({ text, foods: [] })
  })
})
