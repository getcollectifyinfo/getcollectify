
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            companies: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    base_currency: string
                    timezone: string
                    logo_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    base_currency?: string
                    timezone?: string
                    logo_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    base_currency?: string
                    timezone?: string
                    logo_url?: string | null
                    created_at?: string
                }
            }
            // Add other tables as needed or run supabase gen types
        }
    }
}
