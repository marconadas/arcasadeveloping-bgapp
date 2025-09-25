export interface NavigationItem {
  id: string
  label: string
  href: string
  children?: NavigationItem[]
}

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  date: string
  category: string
  author: string
  slug: string
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
  href: string
  category: 'licensing' | 'certification' | 'consultation' | 'reporting'
}

export interface Stats {
  fishermenRegistered: number
  aquacultureFarms: number
  protectedAreas: number
  annualProduction: number
}

export interface ContactInfo {
  address: string
  phone: string
  email: string
  socialMedia: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
    linkedin?: string
  }
}

export interface SystemIntegration {
  mrp: boolean
  crm: boolean
  srm: boolean
  sims: boolean
  cmcs: boolean
}

export type Language = 'pt' | 'en' | 'fr'

export interface BGAPPApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}
