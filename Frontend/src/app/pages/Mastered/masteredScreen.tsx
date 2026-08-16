import { LibraryScreen } from "../Library/libraryScreen";

export interface MasteredScreenProps {
  onBack: () => void;
}

export function MasteredScreen({ onBack }: MasteredScreenProps) {
  return (
    <LibraryScreen
      onBack={onBack}
      masteredOnly
      titleEmoji="🏅"
      titlePrefix="一共掌握到"
    />
  );
}
