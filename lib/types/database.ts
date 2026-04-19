/**
 * Database types for the guest management system
 * Generated to match the Supabase schema
 */

// Order status type
export type OrderStatus = 'paid' | 'processing' | 'in_production' | 'shipped' | 'delivered' | 'refunded' | 'error';

// Enums and basic types
export type GuestStatus = 'pending' | 'submitted' | 'reached_out';
export type GuestSource = 'manual' | 'collection' | 'imported';
export type RecipeSubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type CommunicationType = 'invitation' | 'reminder' | 'thank_you' | 'custom' | 'recipe_showcase';
export type CommunicationChannel = 'email' | 'sms' | 'whatsapp';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';

// Groups feature types
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type BookStatus = 'active' | 'reviewed' | 'ready_to_print' | 'printed' | 'inactive';
export type BookReviewStatus = 'pending' | 'approved' | 'needs_revision';
export type GroupStatus = 'pending_setup' | 'active';
// Reason: Reuses the existing `groups.relationship_to_couple` column instead of a new one.
// Values match the hyphenated form ("wedding-planner") already used by legacy data.
export type OrganizerRelationship = 'couple' | 'family' | 'friend' | 'wedding-planner';

// Newsletter types
export type NewsletterSource = 'landing_page' | 'collection_flow';
export type NewsletterStatus = 'active' | 'unsubscribed';

// Debug logs types
export type DebugLogStatus = 'active' | 'reviewed';

export interface DebugLogRow {
  id: string;
  created_at: string;
  event_type: string;
  context: Record<string, unknown> | null;
  recipe_id: string | null;
  user_id: string | null;
  status: DebugLogStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

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
          user_type: 'couple' | 'gift_giver';
          onboarding_state: any;
          pending_email: string | null;
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
          user_type?: 'couple' | 'gift_giver';
          onboarding_state?: any;
          pending_email?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          collection_link_token?: string | null;
          collection_enabled?: boolean;
          user_type?: 'couple' | 'gift_giver';
          onboarding_state?: any;
          pending_email?: string | null;
        };
      };
      guests: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
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
          invitation_started_at: string | null;
          last_email_sent_at: string | null;
          emails_sent_count: number;
          invitation_paused_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
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
          invitation_started_at?: string | null;
          last_email_sent_at?: string | null;
          emails_sent_count?: number;
          invitation_paused_at?: string | null;
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
          group_id?: string | null;
          invitation_started_at?: string | null;
          last_email_sent_at?: string | null;
          emails_sent_count?: number;
          invitation_paused_at?: string | null;
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
          book_review_status: BookReviewStatus;
          book_review_notes: string | null;
          showcase_image_url: string | null;
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
          book_review_status?: BookReviewStatus;
          book_review_notes?: string | null;
          showcase_image_url?: string | null;
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
          book_review_status?: BookReviewStatus;
          book_review_notes?: string | null;
          showcase_image_url?: string | null;
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
          group_id: string | null;
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
          group_id?: string | null;
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
          group_id?: string | null;
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
          manually_cleared: boolean;
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
          manually_cleared?: boolean;
        };
        Update: {
          text_finalized_in_indesign?: boolean;
          image_generated?: boolean;
          image_placed_in_indesign?: boolean;
          operations_notes?: string | null;
          production_completed_at?: string | null;
          needs_review?: boolean;
          manually_cleared?: boolean;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          wedding_date: string | null;
          wedding_date_undecided: boolean;
          couple_first_name: string | null;
          couple_last_name: string | null;
          partner_first_name: string | null;
          partner_last_name: string | null;
          relationship_to_couple: 'couple' | 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
          couple_image_url: string | null;
          image_group_dashboard: string | null;
          dashboard_image_position_y: number;
          couple_image_position_y: number;
          couple_image_position_x: number;
          couple_display_name: string | null;
          gift_date: string | null;
          gift_date_undecided: boolean;
          book_close_date: string | null;
          book_status: BookStatus;
          book_reviewed_by: string | null;
          book_reviewed_at: string | null;
          book_closed_by_user: string | null;
          book_notes: string | null;
          print_couple_name: string | null;
          print_details_confirmed_at: string | null;
          status: GroupStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by?: string;
          wedding_date?: string | null;
          wedding_date_undecided?: boolean;
          couple_first_name?: string | null;
          couple_last_name?: string | null;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          relationship_to_couple?: 'couple' | 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
          couple_image_url?: string | null;
          image_group_dashboard?: string | null;
          dashboard_image_position_y?: number;
          couple_image_position_y?: number;
          couple_image_position_x?: number;
          couple_display_name?: string | null;
          gift_date?: string | null;
          gift_date_undecided?: boolean;
          book_close_date?: string | null;
          book_status?: BookStatus;
          book_reviewed_by?: string | null;
          book_reviewed_at?: string | null;
          book_closed_by_user?: string | null;
          book_notes?: string | null;
          print_couple_name?: string | null;
          print_details_confirmed_at?: string | null;
          shipping_address_id?: string | null;
          status?: GroupStatus;
        };
        Update: {
          name?: string;
          description?: string | null;
          created_by?: string;
          wedding_date?: string | null;
          wedding_date_undecided?: boolean;
          couple_first_name?: string | null;
          couple_last_name?: string | null;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          relationship_to_couple?: 'couple' | 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
          couple_image_url?: string | null;
          image_group_dashboard?: string | null;
          dashboard_image_position_y?: number;
          couple_image_position_y?: number;
          couple_image_position_x?: number;
          couple_display_name?: string | null;
          gift_date?: string | null;
          gift_date_undecided?: boolean;
          book_close_date?: string | null;
          book_status?: BookStatus;
          book_reviewed_by?: string | null;
          book_reviewed_at?: string | null;
          book_closed_by_user?: string | null;
          book_notes?: string | null;
          print_couple_name?: string | null;
          print_details_confirmed_at?: string | null;
          shipping_address_id?: string | null;
          status?: GroupStatus;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          profile_id: string;
          role: MemberRole;
          joined_at: string;
          invited_by: string | null;
          relationship_to_couple: string | null;
          custom_share_message: string | null;
          custom_share_signature: string | null;
          printed_name: string | null;
        };
        Insert: {
          group_id: string;
          profile_id: string;
          role?: MemberRole;
          invited_by?: string | null;
          relationship_to_couple?: string | null;
          custom_share_message?: string | null;
          custom_share_signature?: string | null;
          printed_name?: string | null;
        };
        Update: {
          role?: MemberRole;
          invited_by?: string | null;
          relationship_to_couple?: string | null;
          custom_share_message?: string | null;
          custom_share_signature?: string | null;
          printed_name?: string | null;
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
          relationship_to_couple: string | null;
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
          relationship_to_couple?: string | null;
        };
        Update: {
          status?: InvitationStatus;
          expires_at?: string;
          relationship_to_couple?: string | null;
        };
      };
      recipe_edit_history: {
        Row: {
          id: string;
          recipe_id: string;
          edited_by: string;
          edited_at: string;
          recipe_name_before: string;
          ingredients_before: string;
          instructions_before: string;
          comments_before: string | null;
          recipe_name_after: string;
          ingredients_after: string;
          instructions_after: string;
          comments_after: string | null;
          edit_reason: string | null;
          edit_target: 'original' | 'print_ready';
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          edited_by: string;
          edited_at?: string;
          recipe_name_before: string;
          ingredients_before: string;
          instructions_before: string;
          comments_before?: string | null;
          recipe_name_after: string;
          ingredients_after: string;
          instructions_after: string;
          comments_after?: string | null;
          edit_reason?: string | null;
          edit_target?: 'original' | 'print_ready';
        };
      };
      recipe_print_ready: {
        Row: {
          recipe_id: string;
          recipe_name_clean: string;
          ingredients_clean: string;
          instructions_clean: string;
          note_clean: string | null;
          detected_language: string | null;
          cleaning_version: number;
          agent_metadata: Record<string, unknown> | null;
          updated_at: string;
        };
        Update: {
          recipe_name_clean?: string;
          ingredients_clean?: string;
          instructions_clean?: string;
          note_clean?: string | null;
          detected_language?: string | null;
          cleaning_version?: number;
          agent_metadata?: Record<string, unknown> | null;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          source: NewsletterSource;
          status: NewsletterStatus;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source: NewsletterSource;
          status?: NewsletterStatus;
          unsubscribed_at?: string | null;
        };
        Update: {
          email?: string;
          source?: NewsletterSource;
          status?: NewsletterStatus;
          unsubscribed_at?: string | null;
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

export type RecipeEditHistory = Database['public']['Tables']['recipe_edit_history']['Row'];
export type RecipeEditHistoryInsert = Database['public']['Tables']['recipe_edit_history']['Insert'];

export type RecipePrintReady = Database['public']['Tables']['recipe_print_ready']['Row'];
export type RecipePrintReadyUpdate = Database['public']['Tables']['recipe_print_ready']['Update'];

// Newsletter convenience types
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row'];
export type NewsletterSubscriberInsert = Database['public']['Tables']['newsletter_subscribers']['Insert'];
export type NewsletterSubscriberUpdate = Database['public']['Tables']['newsletter_subscribers']['Update'];

// Order types
export type OrderType = 'initial_purchase' | 'extra_copy' | 'copy_order';

export interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  email: string;
  stripe_payment_intent: string | null;
  amount_total: number | null;
  book_quantity: number;
  shipping_address: Record<string, unknown> | null;
  couple_name: string | null;
  user_type: string;
  onboarding_data: Record<string, unknown> | null;
  status: OrderStatus;
  error_message: string | null;
  order_type: OrderType;
  group_id: string | null;
  discount_code: string | null;
  discount_amount: number | null;
}

export interface OrderInsert {
  id?: string;
  user_id?: string | null;
  email: string;
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  amount_total?: number | null;
  book_quantity?: number;
  shipping_country?: string;
  shipping_address?: Record<string, unknown> | null;
  couple_name?: string | null;
  user_type?: string;
  onboarding_data?: Record<string, unknown> | null;
  status?: OrderStatus;
  error_message?: string | null;
  order_type?: OrderType;
  group_id?: string | null;
  discount_code?: string | null;
  discount_amount?: number | null;
}

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

// Recipe data for the book review page (includes print-ready version)
export interface RecipeForReview {
  id: string;
  recipe_name: string;
  ingredients: string | null;
  instructions: string | null;
  comments: string | null;
  upload_method: string | null;
  document_urls: string[] | null;
  guests: {
    first_name: string;
    last_name: string;
    printed_name: string | null;
  } | null;
  print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
  } | null;
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
  group_id?: string;
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
  wedding_date?: string | null;
  wedding_date_undecided?: boolean;
  couple_first_name?: string | null;
  couple_last_name?: string | null;
  partner_first_name?: string | null;
  partner_last_name?: string | null;
  relationship_to_couple?: 'friend' | 'family' | 'bridesmaid' | 'wedding-planner' | 'other' | null;
  couple_display_name?: string | null;
  gift_date?: string | null;
  gift_date_undecided?: boolean;
  book_close_date?: string | null;
  created_by?: string;
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
  group_id?: string;
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
  printed_name?: string;
}

export interface CollectionTokenInfo {
  user_id: string;
  user_name: string;
  raw_full_name: string | null;
  custom_share_message: string | null;
  custom_share_signature: string | null;
  couple_names: string | null;
  couple_image_url: string | null;
  couple_image_position_y: number;
  couple_image_position_x: number;
  book_close_date: string | null;
  book_closed_by_user: string | null;
  token: string;
  is_valid: boolean;
  // Reason: Auto-resolved group when ?group= param is missing from URL — prevents orphan recipes
  resolved_group_id: string | null;
  available_groups: { id: string; name: string }[];
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