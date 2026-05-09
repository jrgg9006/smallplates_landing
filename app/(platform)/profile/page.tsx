import { redirect } from 'next/navigation';

// Reason: /profile is the legacy URL. The current canonical experience lives
// at /profile/groups. Server-side redirect runs before any HTML is sent so
// users never see a flash of the legacy UI.
export default function ProfileRedirect() {
  redirect('/profile/groups');
}
