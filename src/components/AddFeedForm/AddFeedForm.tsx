"use client";

import { useRef } from "react";
import { addFeed } from "../../actions/feeds";
import styles from "./AddFeedForm.module.css";

export function AddFeedForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={async (formData) => {
        await addFeed(formData);
        formRef.current?.reset();
      }}
    >
      <input
        type="text"
        name="name"
        placeholder="Feed name"
        required
        className={styles.input}
      />
      <input
        type="url"
        name="url"
        placeholder="Feed URL"
        required
        className={styles.input}
      />
      <select name="type" className={styles.select}>
        <option value="rss">RSS</option>
        <option value="atom">Atom</option>
      </select>
      <button type="submit" className={styles.button}>
        Add
      </button>
    </form>
  );
}
