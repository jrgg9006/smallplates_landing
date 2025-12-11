/**
 * Database types for the guest management system
 * Generated to match the Supabase schema
 */

// Enums and basic types
export type GuestStatus = 'pending' | 'submitted' | 'reached_out';
export type GuestSource = 'manual' | 'collection';
export type RecipeSubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type CommunicationType = 'invitation' | 'reminder' | 'thank_you' | 'custom';
export type CommunicationChannel = 'email' | 'sms' | 'whatsapp';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';

// Groups feature types
export type GroupVisibility = 'private' | 'public';
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

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
          collection_link_token: string | null;
          collection_enabled: boolean;
          custom_share_message: string | null;
          custom_share_signature: string | null;
          user_type: 'couple' | 'gift_giver';
          wedding_date: string | null;
          wedding_date_undecided: boolean;
          planning_stage: 'just-engaged' | 'deep-planning' | 'almost-done' | 'just-exploring' | null;
          partner_first_name: string | null;
          partner_last_name: string | null;
          guest_count: 'intimate' | 'perfect' | 'big' | 'undecided' | null;
          timeline: '6-plus-months' | '3-6-months' | '1-3-months' | 'less-than-month' | 'already-happened' | null;
          couple_first_name: string | null;
          couple_partner_name: string | null;
          relationship_to_couple: 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
          collection_link_token?: string | null;
          collection_enabled?: boolean;
          custom_share_message?: string | null;
          custom_share_signature?: string | null;
          user_type?: 'couple' | 'gift_giver';
          wedding_date?: string | null;
          wedding_date_undecided?: boolean;
          planning_stage?: 'just-engaged' | 'deep-planning' | 'almost-done' | 'just-exploring' | null;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          guest_count?: 'intimate' | 'perfect' | 'big' | 'undecided' | null;
          timeline?: '6-plus-months' | '3-6-months' | '1-3-months' | 'less-than-month' | 'already-happened' | null;
          couple_first_name?: string | null;
          couple_partner_name?: string | null;
          relationship_to_couple?: 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          collection_link_token?: string | null;
          collection_enabled?: boolean;
          custom_share_message?: string | null;
          custom_share_signature?: string | null;
          user_type?: 'couple' | 'gift_giver';
          wedding_date?: string | null;
          wedding_date_undecided?: boolean;
          planning_stage?: 'just-engaged' | 'deep-planning' | 'almost-done' | 'just-exploring' | null;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          guest_count?: 'intimate' | 'perfect' | 'big' | 'undecided' | null;
          timeline?: '6-plus-months' | '3-6-months' | '1-3-months' | 'less-than-month' | 'already-happened' | null;
          couple_first_name?: string | null;
          couple_partner_name?: string | null;
          relationship_to_couple?: 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
        };
      };
      guests: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          printed_name: string | null;
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
          source: GuestSource;
          is_archived: boolean;
          is_self: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          printed_name?: string | null;
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
          source?: GuestSource;
          is_archived?: boolean;
          is_self?: boolean;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          printed_name?: string | null;
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
          source?: GuestSource;
          is_archived?: boolean;
          is_self?: boolean;
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
          raw_recipe_text: string | null;
          image_url: string | null;
          upload_method: 'text' | 'audio' | 'image';
          document_urls: string[] | null;
          audio_url: string | null;
          submission_status: RecipeSubmissionStatus;
          submitted_at: string | null;
          approved_at: string | null;
          group_id: string | null;
          source: GuestSource;
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
          raw_recipe_text?: string | null;
          image_url?: string | null;
          upload_method?: 'text' | 'audio' | 'image';
          document_urls?: string[] | null;
          audio_url?: string | null;
          submission_status?: RecipeSubmissionStatus;
          submitted_at?: string | null;
          approved_at?: string | null;
          group_id?: string | null;
          source?: GuestSource;
        };
        Update: {
          recipe_name?: string;
          ingredients?: string;
          instructions?: string;
          comments?: string | null;
          raw_recipe_text?: string | null;
          image_url?: string | null;
          upload_method?: 'text' | 'audio' | 'image';
          document_urls?: string[] | null;
          audio_url?: string | null;
          submission_status?: RecipeSubmissionStatus;
          submitted_at?: string | null;
          approved_at?: string | null;
          group_id?: string | null;
          source?: GuestSource;
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
      shipping_addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient_name: string;
          street_address: string;
          apartment_unit: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          phone_number: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_name: string;
          street_address: string;
          apartment_unit?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          phone_number?: string | null;
          is_default?: boolean;
        };
        Update: {
          recipient_name?: string;
          street_address?: string;
          apartment_unit?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          phone_number?: string | null;
          is_default?: boolean;
        };
      };
      cookbooks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          is_group_cookbook: boolean;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          is_group_cookbook?: boolean;
          group_id?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          is_default?: boolean;
          is_group_cookbook?: boolean;
          group_id?: string | null;
        };
      };
      cookbook_recipes: {
        Row: {
          id: string;
          cookbook_id: string;
          recipe_id: string;
          user_id: string;
          note: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cookbook_id: string;
          recipe_id: string;
          user_id: string;
          note?: string | null;
          display_order?: number;
        };
        Update: {
          note?: string | null;
          display_order?: number;
        };
      };
      recipe_production_status: {
        Row: {
          id: string;
          recipe_id: string;
          text_finalized_in_indesign: boolean;
          image_generated: boolean;
          image_placed_in_indesign: boolean;
          operations_notes: string | null;
          production_completed_at: string | null;
          needs_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          text_finalized_in_indesign?: boolean;
          image_generated?: boolean;
          image_placed_in_indesign?: boolean;
          operations_notes?: string | null;
          production_completed_at?: string | null;
          needs_review?: boolean;
        };
        Update: {
          text_finalized_in_indesign?: boolean;
          image_generated?: boolean;
          image_placed_in_indesign?: boolean;
          operations_notes?: string | null;
          production_completed_at?: string | null;
          needs_review?: boolean;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          visibility: GroupVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string;
          visibility?: GroupVisibility;
        };
        Update: {
          name?: string;
          description?: string | null;
          created_by?: string;
          visibility?: GroupVisibility;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          profile_id: string;
          role: MemberRole;
          joined_at: string;
          invited_by: string | null;
        };
        Insert: {
          group_id: string;
          profile_id: string;
          role?: MemberRole;
          invited_by?: string | null;
        };
        Update: {
          role?: MemberRole;
          invited_by?: string | null;
        };
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          email: string;
          name: string | null;
          invited_by: string;
          status: InvitationStatus;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          email: string;
          name?: string | null;
          invited_by: string;
          status?: InvitationStatus;
          token: string;
          expires_at: string;
        };
        Update: {
          status?: InvitationStatus;
          expires_at?: string;
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

// Shipping Address types
export type ShippingAddress = Database['public']['Tables']['shipping_addresses']['Row'];
export type ShippingAddressInsert = Database['public']['Tables']['shipping_addresses']['Insert'];
export type ShippingAddressUpdate = Database['public']['Tables']['shipping_addresses']['Update'];

export type Guest = Database['public']['Tables']['guests']['Row'];
export type GuestInsert = Database['public']['Tables']['guests']['Insert'];
export type GuestUpdate = Database['public']['Tables']['guests']['Update'];
export type GuestWithMeta = Guest & {
  latest_recipe_source?: GuestSource | null;
};

export type GuestRecipe = Database['public']['Tables']['guest_recipes']['Row'];
export type GuestRecipeInsert = Database['public']['Tables']['guest_recipes']['Insert'];
export type GuestRecipeUpdate = Database['public']['Tables']['guest_recipes']['Update'];

export type CommunicationLog = Database['public']['Tables']['communication_log']['Row'];
export type CommunicationLogInsert = Database['public']['Tables']['communication_log']['Insert'];
export type CommunicationLogUpdate = Database['public']['Tables']['communication_log']['Update'];

export type Cookbook = Database['public']['Tables']['cookbooks']['Row'];
export type CookbookInsert = Database['public']['Tables']['cookbooks']['Insert'];
export type CookbookUpdate = Database['public']['Tables']['cookbooks']['Update'];

export type CookbookRecipe = Database['public']['Tables']['cookbook_recipes']['Row'];
export type CookbookRecipeInsert = Database['public']['Tables']['cookbook_recipes']['Insert'];
export type CookbookRecipeUpdate = Database['public']['Tables']['cookbook_recipes']['Update'];

export type RecipeProductionStatus = Database['public']['Tables']['recipe_production_status']['Row'];
export type RecipeProductionStatusInsert = Database['public']['Tables']['recipe_production_status']['Insert'];
export type RecipeProductionStatusUpdate = Database['public']['Tables']['recipe_production_status']['Update'];

// Groups convenience types
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupInsert = Database['public']['Tables']['groups']['Insert'];
export type GroupUpdate = Database['public']['Tables']['groups']['Update'];

export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert'];
export type GroupMemberUpdate = Database['public']['Tables']['group_members']['Update'];

export type GroupInvitation = Database['public']['Tables']['group_invitations']['Row'];
export type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert'];
export type GroupInvitationUpdate = Database['public']['Tables']['group_invitations']['Update'];

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

// Recipe with guest information
export interface RecipeWithGuest extends GuestRecipe {
  guests: {
    first_name: string;
    last_name: string;
    printed_name: string | null;
    email: string;
    is_self: boolean;
    source: GuestSource;
  } | null;
  added_by_user?: Profile | null; // For group recipes - who added this recipe to the group
  added_at?: string; // For group recipes - when it was added to the group
}

// Cookbook with recipes
export interface CookbookWithRecipes extends Cookbook {
  cookbook_recipes: (CookbookRecipe & {
    guest_recipes: RecipeWithGuest;
  })[];
}

// Recipe in cookbook with full information
export interface RecipeInCookbook extends RecipeWithGuest {
  cookbook_recipes: {
    id: string;
    user_id: string;
    note: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
  } | null;
  added_by_user?: Profile | null; // Profile of the user who added this recipe to the cookbook
}

// Groups extended types with relationships
export interface GroupMemberWithProfile extends GroupMember {
  profiles: Profile;
}

export interface GroupWithMembers extends Group {
  group_members: GroupMemberWithProfile[];
  cookbook?: Cookbook;
  recipe_count?: number;
  member_count?: number;
}

export interface GroupWithInvitations extends Group {
  group_invitations: GroupInvitation[];
}

export interface GroupFull extends GroupWithMembers {
  group_invitations: GroupInvitation[];
}

// Recipe with group information
export interface RecipeWithGroup extends RecipeWithGuest {
  groups?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

// Form data types for UI components
export interface GuestFormData {
  first_name: string;
  last_name?: string;
  printed_name?: string;
  email?: string;
  phone?: string;
  significant_other_name?: string;
  number_of_recipes?: number;
  notes?: string;
  tags?: string[];
}

export interface RecipeFormData {
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments?: string;
  upload_method?: 'text' | 'image';
  document_urls?: string[];
}

// Groups form data types
export interface GroupFormData {
  name: string;
  description?: string;
  visibility?: GroupVisibility;
}

export interface GroupInvitationFormData {
  email: string;
  name?: string;
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

// Collection-specific types
export interface CollectionGuestSubmission {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments?: string;
  raw_recipe_text?: string;
  upload_method?: 'text' | 'audio' | 'image';
  document_urls?: string[];
  audio_url?: string;
}

export interface CollectionTokenInfo {
  user_id: string;
  user_name: string;
  raw_full_name: string | null;
  custom_share_message: string | null;
  custom_share_signature: string | null;
  token: string;
  is_valid: boolean;
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