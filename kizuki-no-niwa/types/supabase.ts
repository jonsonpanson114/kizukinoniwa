export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
        Tables: {
            profiles: {
                Row: {
                    id: string
                    current_phase: number | null
                    current_day: number | null
                    phase_started_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    current_phase?: number | null
                    current_day?: number | null
                    phase_started_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    current_phase?: number | null
                    current_day?: number | null
                    phase_started_at?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            stories: {
                Row: {
                    id: string
                    user_id: string
                    character: 'haru' | 'sora' | null
                    phase: number
                    day: number
                    content: string
                    summary: string | null
                    mood_tags: string[] | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    character?: 'haru' | 'sora' | null
                    phase: number
                    day: number
                    content: string
                    summary?: string | null
                    mood_tags?: string[] | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    character?: 'haru' | 'sora' | null
                    phase?: number
                    day?: number
                    content?: string
                    summary?: string | null
                    mood_tags?: string[] | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'stories_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
            kizuki: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    analysis_result: Json | null
                    question_prompt: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    analysis_result?: Json | null
                    question_prompt?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    analysis_result?: Json | null
                    question_prompt?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'kizuki_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
            dialogues: {
                Row: {
                    id: string
                    user_id: string
                    character: 'haru' | 'sora'
                    messages: Json[]
                    triggered_by_story_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    character: 'haru' | 'sora'
                    messages: Json[]
                    triggered_by_story_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    character?: 'haru' | 'sora'
                    messages?: Json[]
                    triggered_by_story_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "dialogues_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            foreshadowing: {
                Row: {
                    id: string
                    user_id: string
                    motif: string
                    status: 'planted' | 'resolved' | null
                    planted_story_id: string | null
                    resolved_story_id: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    motif: string
                    status?: 'planted' | 'resolved' | null
                    planted_story_id?: string | null
                    resolved_story_id?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    motif?: string
                    status?: 'planted' | 'resolved' | null
                    planted_story_id?: string | null
                    resolved_story_id?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'foreshadowing_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'foreshadowing_planted_story_id_fkey'
                        columns: ['planted_story_id']
                        isOneToOne: false
                        referencedRelation: 'stories'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'foreshadowing_resolved_story_id_fkey'
                        columns: ['resolved_story_id']
                        isOneToOne: false
                        referencedRelation: 'stories'
                        referencedColumns: ['id']
                    }
                ]
            }
        }
    }
}
