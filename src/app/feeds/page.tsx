import { getFeeds } from "../../actions/feeds";
import { FeedList } from "../../components/FeedList/FeedList";
import { AddFeedForm } from "../../components/AddFeedForm/AddFeedForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const feeds = await getFeeds();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Feed Management</h1>
      <AddFeedForm />
      <FeedList feeds={feeds} />
    </div>
  );
}
