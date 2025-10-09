/**
 * Database types for the guest management system
 * Generated to match the Supabase schema
 */

// Enums and basic types
export type GuestStatus = 'pending' | 'invited' | 'responded' | 'declined' | 'submitted';
export type RecipeSubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type CommunicationType = 'invitation' | 'reminder' | 'thank_you' | 'custom';
export type CommunicationChannel = 'email' | 'sms' | 'whatsapp';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';

// Main database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
        };
      };
      guests: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          significant_other_name: string | null;
          status: GuestStatus;
          date_message_sent: string | null;
          last_reminder_sent: string | null;
          number_of_recipes: number;
          recipes_received: number;
          notes: string | null;
          tags: string[] | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          significant_other_name?: string | null;
          status?: GuestStatus;
          date_message_sent?: string | null;
          last_reminder_sent?: string | null;
          number_of_recipes?: number;
          recipes_received?: number;
          notes?: string | null;
          tags?: string[] | null;
          is_archived?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          significant_other_name?: string | null;
          status?: GuestStatus;
          date_message_sent?: string | null;
          last_reminder_sent?: string | null;
          number_of_recipes?: number;
          recipes_received?: number;
          notes?: string | null;
          tags?: string[] | null;
          is_archived?: boolean;
        };
      };
      guest_recipes: {
        Row: {
          id: string;
          guest_id: string;
          user_id: string;
          recipe_name: string;
          ingredients: string;
          instructions: string;
          comments: string | null;
          image_url: string | null;
          submission_status: RecipeSubmissionStatus;
          submitted_at: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          user_id: string;
          recipe_name: string;
          ingredients: string;
          instructions: string;
          comments?: string | null;
          image_url?: string | null;
          submission_status?: RecipeSubmissionStatus;
          submitted_at?: string | null;
          approved_at?: string | null;
        };
        Update: {
          recipe_name?: string;
          ingredients?: string;
          instructions?: string;
          comments?: string | null;
          image_url?: string | null;
          submission_status?: RecipeSubmissionStatus;
          submitted_at?: string | null;
          approved_at?: string | null;
        };
      };
      communication_log: {
        Row: {
          id: string;
          guest_id: string;
          user_id: string;
          type: CommunicationType;
          channel: CommunicationChannel;
          subject: string | null;
          content: string | null;
          status: CommunicationStatus;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          error_message: string | null;
          retry_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          user_id: string;
          type: CommunicationType;
          channel: CommunicationChannel;
          subject?: string | null;
          content?: string | null;
          status?: CommunicationStatus;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
        };
        Update: {
          type?: CommunicationType;
          channel?: CommunicationChannel;
          subject?: string | null;
          content?: string | null;
          status?: CommunicationStatus;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          error_message?: string | null;
          retry_count?: number;
        };
      };
    };
    Functions: {
      get_guest_statistics: {
        Args: { user_uuid: string };
        Returns: {
          total_guests: number;
          active_guests: number;
          archived_guests: number;
          pending_invitations: number;
          invites_sent: number;
          recipes_received: number;
          total_expected_recipes: number;
          completion_rate: number;
        };
      };
      search_guests: {
        Args: {
          user_uuid: string;
          search_query?: string;
          status_filter?: GuestStatus;
          include_archived?: boolean;
        };
        Returns: Database['public']['Tables']['guests']['Row'][];
      };
      log_communication: {
        Args: {
          guest_uuid: string;
          user_uuid: string;
          comm_type: CommunicationType;
          comm_channel: CommunicationChannel;
          comm_subject?: string;
          comm_content?: string;
        };
        Returns: string; // UUID
      };
      update_communication_status: {
        Args: {
          log_uuid: string;
          new_status: CommunicationStatus;
          error_msg?: string;
        };
        Returns: boolean;
      };
    };
  };
}

// Convenience types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Guest = Database['public']['Tables']['guests']['Row'];
export type GuestInsert = Database['public']['Tables']['guests']['Insert'];
export type GuestUpdate = Database['public']['Tables']['guests']['Update'];

export type GuestRecipe = Database['public']['Tables']['guest_recipes']['Row'];
export type GuestRecipeInsert = Database['public']['Tables']['guest_recipes']['Insert'];
export type GuestRecipeUpdate = Database['public']['Tables']['guest_recipes']['Update'];

export type CommunicationLog = Database['public']['Tables']['communication_log']['Row'];
export type CommunicationLogInsert = Database['public']['Tables']['communication_log']['Insert'];
export type CommunicationLogUpdate = Database['public']['Tables']['communication_log']['Update'];

// Extended types with relationships
export interface GuestWithRecipes extends Guest {
  guest_recipes: GuestRecipe[];
}

export interface GuestWithCommunications extends Guest {
  communication_log: CommunicationLog[];
}

export interface GuestFull extends Guest {
  guest_recipes: GuestRecipe[];
  communication_log: CommunicationLog[];
}

// Form data types for UI components
export interface GuestFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  significant_other_name?: string;
  number_of_recipes: number;
  notes?: string;
  tags?: string[];
}

export interface RecipeFormData {
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments?: string;
}

// Statistics and analytics types
export interface GuestStatistics {
  total_guests: number;
  active_guests: number;
  archived_guests: number;
  pending_invitations: number;
  invites_sent: number;
  recipes_received: number;
  total_expected_recipes: number;
  completion_rate: number;
}

export interface GuestSearchFilters {
  search_query?: string;
  status?: GuestStatus;
  include_archived?: boolean;
  tags?: string[];
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Email template types
export interface EmailTemplate {
  type: CommunicationType;
  subject: string;
  content: string;
  variables: Record<string, string>;
}

export interface EmailContext {
  guest: Guest;
  user: Profile;
  custom_message?: string;
  submission_url?: string;
}