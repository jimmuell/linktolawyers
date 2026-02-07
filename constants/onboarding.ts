import type { ComponentProps } from 'react';

import { MaterialIcons } from '@expo/vector-icons';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  iconName: ComponentProps<typeof MaterialIcons>['name'];
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Find the Right Attorney',
    description:
      'Search our network of qualified attorneys by practice area, location, and experience to find the perfect match for your legal needs.',
    iconName: 'search',
  },
  {
    id: '2',
    title: 'Post Your Legal Request',
    description:
      'Describe your legal matter and let attorneys come to you with tailored proposals and competitive quotes.',
    iconName: 'description',
  },
  {
    id: '3',
    title: 'Compare Quotes',
    description:
      'Review and compare proposals from multiple attorneys side by side to make an informed decision.',
    iconName: 'compare-arrows',
  },
  {
    id: '4',
    title: 'Secure Messaging',
    description:
      'Communicate directly with your attorney through our encrypted messaging platform with complete confidentiality.',
    iconName: 'lock',
  },
];
