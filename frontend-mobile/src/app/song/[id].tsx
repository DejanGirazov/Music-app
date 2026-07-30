import { useLocalSearchParams } from "expo-router";
import SongDetails from "../../../components/SongDetails";

export default function SongDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SongDetails songId={id} />;
}