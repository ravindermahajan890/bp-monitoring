import { useState, useEffect } from 'react';
import ReadingForm from '../components/ReadingForm';
import ReadingsTable from '../components/ReadingsTable';
import { getReadings } from '../api';

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchReadings();
  }, []);

  return (
    <>
      <ReadingForm onSaved={fetchReadings} />
      {loading ? (
        <p className="empty-msg">Loading…</p>
      ) : (
        <ReadingsTable readings={readings} onDeleted={fetchReadings} />
      )}
    </>
  );
}

