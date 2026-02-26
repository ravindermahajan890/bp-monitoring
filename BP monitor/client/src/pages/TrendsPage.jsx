import { useState, useEffect } from 'react';
import BPChart from '../components/BPChart';
import BPInsights from '../components/BPInsights';
import { getReadings } from '../api';

export default function TrendsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const { data } = await getReadings();
        setReadings(data);
      } catch (err) {
        console.error('Failed to fetch readings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, []);

  if (loading) {
    return <p className="empty-msg">Loading…</p>;
  }

  return (
    <>
      <BPChart readings={readings} />
      <BPInsights readings={readings} />
    </>
  );
}

