export interface PoseData {
  step: number;
  name: string;
  sanskrit: string;
  imageIndex: number;
}

export const SURYA_NAMASKAR_POSES: PoseData[] = [
  { step: 1, name: 'Prayer Pose', sanskrit: 'Pranamasana', imageIndex: 1 },
  { step: 2, name: 'Raised Arms', sanskrit: 'Hasta Uttanasana', imageIndex: 2 },
  { step: 3, name: 'Forward Fold', sanskrit: 'Uttanasana', imageIndex: 3 },
  { step: 4, name: 'Equestrian Pose', sanskrit: 'Ashwa Sanchalanasana', imageIndex: 4 },
  { step: 5, name: 'Plank Pose', sanskrit: 'Dandasana', imageIndex: 5 },
  { step: 6, name: 'Eight-Limbed Salute', sanskrit: 'Ashtanga Namaskara', imageIndex: 6 },
  { step: 7, name: 'Cobra Pose', sanskrit: 'Bhujangasana', imageIndex: 7 },
  { step: 8, name: 'Downward Dog', sanskrit: 'Adho Mukha Svanasana', imageIndex: 5 },
  { step: 9, name: 'Equestrian Pose', sanskrit: 'Ashwa Sanchalanasana', imageIndex: 4 },
  { step: 10, name: 'Forward Fold', sanskrit: 'Uttanasana', imageIndex: 3 },
  { step: 11, name: 'Raised Arms', sanskrit: 'Hasta Uttanasana', imageIndex: 2 },
  { step: 12, name: 'Prayer Pose', sanskrit: 'Pranamasana', imageIndex: 1 },
];

const poseImages: Record<number, any> = {
  1: require('../assets/images/sun-salutation/pose1.png'),
  2: require('../assets/images/sun-salutation/pose2.png'),
  3: require('../assets/images/sun-salutation/pose3.png'),
  4: require('../assets/images/sun-salutation/pose4.png'),
  5: require('../assets/images/sun-salutation/pose5.png'),
  6: require('../assets/images/sun-salutation/pose6.png'),
  7: require('../assets/images/sun-salutation/pose7.png'),
};

export function getPoseImage(imageIndex: number) {
  return poseImages[imageIndex];
}
