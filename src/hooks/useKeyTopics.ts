import { useState, useEffect } from 'react';

export interface KeyTopic {
  id: string;
  label: string;
  codes: { [year: string]: string }; // year → variable code (uppercase)
}

export function useKeyTopics() {
  const [topics, setTopics] = useState<KeyTopic[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/key_topics.json`)
      .then(r => r.json())
      .then(setTopics)
      .catch(err => console.error('Failed to load key_topics.json:', err));
  }, []);

  return topics;
}

/**
 * Given a topic and a year, resolve the variable code.
 * The codes in key_topics.json are from the official time-series mapping,
 * ensuring consistency across years.
 */
export function resolveVarCode(topic: KeyTopic, year: string): string | null {
  return topic.codes[year] || null;
}
