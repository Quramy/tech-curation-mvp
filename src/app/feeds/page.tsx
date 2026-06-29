import { getFeeds } from "../../actions/feeds";
import { AddFeedForm } from "../../components/AddFeedForm/AddFeedForm";
import { FeedIO } from "../../components/FeedIO/FeedIO";
import { FeedList } from "../../components/FeedList/FeedList";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const feeds = await getFeeds();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Feed Management</h1>
      <AddFeedForm />
      <FeedIO />
      <FeedList feeds={feeds} />
    </div>
  );
}
