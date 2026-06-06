export type BillingPlan = 'starter' | 'team' | 'enterprise'

export type BillingSnapshot = {
  plan: BillingPlan
  effective_plan: BillingPlan
  plan_label: string
  subscription_status: string | null
  trial_ends_at: string | null
  billing_interval: 'month' | 'year' | null
  seat_quantity: number
  usage: {
    queries_used: number
    queries_limit: number | null
    user_count: number
    user_limit: number | null
  }
  features: {
    slack: boolean
    mcp: boolean
  }
  stripe_configured: boolean
  can_manage_billing: boolean
}

export type PlanLimitDetail = {
  code: 'plan_limit'
  feature: string
  plan: string
  message: string
  upgrade_path: string
}

export type BillingPlanDTO = {
  id: string
  name: string
  monthly_price_display?: string
  annual_price_display?: string
  per_seat?: boolean
  contact_sales?: boolean
  features: string[]
  checkout_intervals?: string[]
}

export type PlansCatalogDTO = {
  stripe_configured: boolean
  publishable_key: string | null
  trial_days: number
  plans: BillingPlanDTO[]
}
