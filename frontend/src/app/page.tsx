import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect to signup to start the flow
  redirect('/signup');
}
