export interface FoodMacros {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface UserFood {
  id: string
  user_id: string
  name: string
  brand?: string
  serving_size_g: number
  macros_per_serving: FoodMacros
  source: 'usda' | 'manual' | 'geo_estimate' | 'personal'
  usda_fdc_id?: number
  is_favorite: boolean
  use_count: number
  last_used_at?: string
  created_at: string
}

export interface FoodSearchResult {
  id: string | null
  usda_fdc_id?: number
  name: string
  brand?: string
  serving_size_g: number
  macros_per_serving: FoodMacros
  source: 'personal' | 'usda'
  is_favorite: boolean
  use_count: number
}

export interface CreateFoodInput {
  name: string
  brand?: string
  serving_size_g?: number
  macros_per_serving: FoodMacros
  source?: 'usda' | 'manual' | 'geo_estimate'
  usda_fdc_id?: number
  is_favorite?: boolean
}
