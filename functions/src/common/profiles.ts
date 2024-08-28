export interface ProfileAction {
  type: string;
  alias?: string;
  profile_image?: string;
}

export interface UserProfile {
  alias: string;
  profile_image: string;
  games: string[];
}
