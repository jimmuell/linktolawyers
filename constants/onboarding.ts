import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'search',
    title: 'Find the Right Lawyer',
    description:
      'Browse qualified attorneys specializing in your legal needs. Filter by practice area, location, and budget.',
  },
  {
    id: '2',
    icon: 'chatbubbles',
    title: 'Get Competitive Quotes',
    description:
      'Receive and compare quotes from multiple attorneys. Choose the best fit for your case and budget.',
  },
  {
    id: '3',
    icon: 'shield-checkmark',
    title: 'Secure Communication',
    description:
      'Message attorneys directly through our secure platform. Share documents and schedule consultations.',
  },
  {
    id: '4',
    icon: 'briefcase',
    title: 'Manage Your Case',
    description:
      'Track your case progress, milestones, and documents all in one place. Stay informed every step of the way.',
  },
];
