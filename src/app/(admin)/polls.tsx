import { PollsPlaceholderScreen } from '@/components/polls-placeholder-screen';

export default function AdminPollsScreen() {
  return (
    <PollsPlaceholderScreen
      titleClassName="text-role-admin"
      subtitle="Society polls will appear here — create and close from this tab next."
    />
  );
}
